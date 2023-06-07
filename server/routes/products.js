import { Router } from 'express'
import clientProvider from '../../utils/clientProvider.js'
import createHttpError from 'http-errors'
import { getStoresFromTag, getSessionsFromStores, getCurrentStore } from '../services/stores.js'
import sessionHandler from '../../utils/sessionHandler.js'
import { uploadProduct, getProduct, putProduct, deleteProduct } from '../services/products.js'
import { getMultiStoreFromProductId } from '../services/multiStoreProducts.js'
import MultiStoreProductModel from '../../utils/models/MultiStoreProducts.js'
import chalk from 'chalk'
import { resetSession } from '../services/sessions.js'

const productsRouter = Router()
// productsRouter.use(subscriptionRoute)

productsRouter.get('/', async (req, res) => {
   try {
      const { client } = await clientProvider.restClient({
         req,
         res,
         isOnline: false
      })
      const allProducts = await client.get({ path: 'products' })
      res.status(200).send(allProducts)
   } catch (error) {
      createHttpError(500, 'Server error')
   }
})

productsRouter.get('/:product_id', async (req, res) => {
   try {
      const { client } = await clientProvider.restClient({
         req,
         res,
         isOnline: false
      })
      const product = await client.get({
         path: `products/${req.params.product_id}`
      })
      res.status(200).send(product)
   } catch (error) {
      console.log(chalk.red(error));
   }
})

productsRouter.post('/multistore/:product_id', async (req, res) => {
   try {
      const product = await getProduct(req, res)
      delete product.body.product.id
      const productBody = product.body.product

      let existingInStores = []
      const multiStorePd = await getMultiStoreFromProductId(req, res)
      if (multiStorePd) {
         existingInStores = multiStorePd.shopifyData.map((shop) => shop.store)
      }

      const stores = await getStoresFromTag(req, res, existingInStores)
      const sessionStoresToAdd = await getSessionsFromStores(req, res, stores.toAdd, {
         offline: true,
         noCurrent: true
      })
      const sessionStoresToDelete = await getSessionsFromStores(req, res, stores.toDelete, { offline: true })

      if (sessionStoresToDelete.length || sessionStoresToAdd.length) {
         const uploadedProducts = []
         const deletedProducts = []
         for (const sessionObj of sessionStoresToAdd) {
            const loadedSession = await sessionHandler.loadSession(sessionObj.session.id)
            console.log(chalk.blue(`uploading product to ${sessionObj.store.shop}...`))
            const uploaded = await uploadProduct(req, res, productBody, loadedSession)
            uploadedProducts.push({ store: sessionObj.store._id, id: uploaded.body.product.id })
         }
         for (const sessionObj of sessionStoresToDelete) {
            const loadedSession = await sessionHandler.loadSession(sessionObj.session.id)
            console.log(chalk.blue(`deleting product from ${sessionObj.store.shop}...`))
            const shopifyData = multiStorePd.shopifyData.find(
               (shop) => sessionObj.store._id.toString() === shop.store._id.toString()
            )
            await deleteProduct(req, res, shopifyData.id, loadedSession)
            deletedProducts.push({ id: shopifyData.id, store: sessionObj.store._id })
         }

         const responseObj = {}

         if (!multiStorePd) {
            const keepInCurrentStore = async () => {
               const currentStore = await getCurrentStore(req, res)
               const deletedStoresIds = sessionStoresToDelete.map((sesSt) => sesSt.store._id.toString())
               return deletedStoresIds.includes(currentStore._id.toString()) ? false : currentStore._id
            }
            const current = await keepInCurrentStore()
            console.log(chalk.blue('adding multistore product...'))
            const newMultiStorePd = new MultiStoreProductModel({
               product: product.body.product,
               shopifyData: current
                  ? [...uploadedProducts, { id: req.params.product_id, store: current }]
                  : uploadedProducts
            })
            responseObj.saved = await newMultiStorePd.save()
         } else {
            console.log(chalk.blue('updating multistore product....'))
            if (uploadedProducts.length) {
               responseObj.updatedMultiProduct = await MultiStoreProductModel.findOneAndUpdate(
                  { _id: multiStorePd._id },
                  {
                     $push: {
                        shopifyData: { $each: uploadedProducts }
                     }
                  },
                  { new: true, runValidators: true }
               )
            }
            if (deletedProducts.length) {
               const toDelete = deletedProducts.map((pro) => pro.id)
               responseObj.deleteMultiProduct = await MultiStoreProductModel.findOneAndUpdate(
                  { _id: multiStorePd._id },
                  {
                     $pull: {
                        shopifyData: { id: { $in: toDelete } }
                     }
                  },
                  { new: true, runValidators: true }
               )
            }
         }

         await resetSession(req, res)
         res.status(201).send(responseObj)
      } else {
         console.log(chalk.yellow('Product already present in all corresponding stores'))
         res.status(201).send('Product already present in all corresponding stores')
      }
      console.log(chalk.green('done.'))
   } catch (error) {
      console.log(chalk.red(error))
   }
})

productsRouter.put('/multistore/:product_id', async (req, res) => {
   try {
      const product = await getProduct(req, res)
      const multiStorePd = await getMultiStoreFromProductId(req, res)
      const fullData = []
      for (const shopiData of multiStorePd.shopifyData) {
         const session = await getSessionsFromStores(req, res, [shopiData.store], {
            offline: true,
            noCurrent: true
         })
         if (session.length) {
            fullData.push({ ...shopiData.toJSON(), sessionId: session[0].session.id })
         }
      }

      for (const sessionObj of fullData) {
         const loadedSession = await sessionHandler.loadSession(sessionObj.sessionId)
         console.log(chalk.blue(`updating product in ${sessionObj.store.shop}...`))
         await putProduct(req, res, sessionObj.id, loadedSession, product.body.product)
      }
      const updated = await MultiStoreProductModel.findOneAndUpdate(
         { _id: multiStorePd._id },
         {
            product: req.body
         },
         { new: true, runValidators: true }
      )
      res.status(201).send({ updated })
      console.log(chalk.green('done.'))
   } catch (error) {
      console.log(chalk.red(error))
   }
})

productsRouter.delete('/multistore/:product_id', async (req, res) => {
   try {
      const multiStorePd = await getMultiStoreFromProductId(req, res)
      const fullData = []
      for (const shopiData of multiStorePd.shopifyData) {
         const session = await getSessionsFromStores(req, res, [shopiData.store], {
            offline: true,
            noCurrent: true
         })
         if (session.length) {
            fullData.push({ ...shopiData.toJSON(), sessionId: session[0].session.id })
         }
      }

      for (const sessionObj of fullData) {
         const loadedSession = await sessionHandler.loadSession(sessionObj.sessionId)
         console.log(chalk.blue(`updating product in ${sessionObj.store.shop}...`))
         await deleteProduct(req, res, sessionObj.id, loadedSession)
      }
      const deleted = await MultiStoreProductModel.findOneAndDelete({ _id: multiStorePd._id })
      res.status(201).send({ deleted })
      console.log(chalk.green('done.'))
   } catch (error) {
      console.log(chalk.red(error))
   }
})

export default productsRouter
