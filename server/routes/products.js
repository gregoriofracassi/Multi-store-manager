import { Router } from 'express'
import clientProvider from '../../utils/clientProvider.js'
import subscriptionRoute from './recurringSubscriptions.js'
import { DataType } from '@shopify/shopify-api'
import createHttpError from 'http-errors'
import { getStoresFromTag, getSessionsFromStores, getCurrentStore } from '../services/stores.js'
import sessionHandler from '../../utils/sessionHandler.js'
import { uploadProduct, getProduct, putProduct, deleteProduct } from '../services/products.js'
import { getMultiStoreFromProductId } from '../services/multiStoreProducts.js'
import verifyRequest from '../middleware/verifyRequest.js'
import axios from 'axios'
import shopify from '../../utils/shopifyConfig.js'
import MultiStoreProductModel from '../../utils/models/MultiStoreProducts.js'
import chalk from 'chalk'

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
      createHttpError(500, 'Server error')
   }
})

productsRouter.post('/multistore/:product_id', async (req, res) => {
   try {
      const product = await getProduct(req, res)

      let existingInStores = []
      const multiStorePd = await getMultiStoreFromProductId(req, res)
      if (multiStorePd) {
         existingInStores = multiStorePd.shopifyData.map((shop) => shop.store)
      }

      const tempProduct = { title: 'calamaro' }

      const stores = await getStoresFromTag(req, res, existingInStores)
      const sessionStoresToAdd = await getSessionsFromStores(req, res, stores.toAdd, {
         online: true,
         noCurrent: true
      })
      const sessionStoresToDelete = await getSessionsFromStores(req, res, stores.toDelete, { online: true })

      if (sessionStoresToDelete.length || sessionStoresToAdd.length) {
         const uploadedProducts = []
         const deletedProducts = []
         for (const sessionObj of sessionStoresToAdd) {
            const loadedSession = await sessionHandler.loadSession(sessionObj.session.id)
            console.log(chalk.blue(`uploading product to ${sessionObj.store.shop}...`))
            const uploaded = await uploadProduct(req, res, tempProduct, loadedSession)
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
            const isCurrentActive = async () => {
               const currentStore = await getCurrentStore(req, res)
               const deletedStoresIds = sessionStoresToDelete.map((sesSt) => sesSt.store._id.toString())
               return deletedStoresIds.includes(currentStore._id.toString()) ? false : currentStore._id
            }
            const current = await isCurrentActive()
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
               console.log({ toDelete })
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

         console.log(chalk.blue('resetting initial session...'))
         await sessionHandler.loadSession(req.sessionId)
         if (req.sessionId) {
            delete req.sessionId
         }
         res.status(200).send(responseObj)
      } else {
         console.log(chalk.yellow('Product already present in all corresponding stores'))
         res.status(200).send('Product already present in all corresponding stores')
      }
      console.log(chalk.green('done.'))
   } catch (error) {
      createHttpError(500, 'Server error')
   }
})

productsRouter.put('/multistore/:product_id', async (req, res) => {
   try {
      const multiStorePd = await MultiStoreProductModel.findOne({
         shopifyData: {
            $elemMatch: {
               id: req.params.product_id
            }
         }
      })

      // const sessionsAndProductIds = multiStorePd.shopify_ids
      // const modifiedProducts = []
      // for (const obj of sessionsAndProductIds) {
      //    const [[sessionId, productId]] = Object.entries(obj)
      //    const loadedSession = await sessionHandler.loadSession(sessionId)
      //    const modified = await putProduct(req, res, loadedSession, productId)
      //    modifiedProducts.push({ [sessionId]: modified.body })
      //    console.log({ modified })
      // }

      // const updatedMultiStore = MultiStoreProductModel.findByIdAndUpdate(multiStorePd._id, req.body, {
      //    runValidators: true,
      //    new: true
      // })

      // await sessionHandler.loadSession(req.sessionId)
      // if (req.sessionId) {
      //    delete req.sessionId
      // }
      res.status(200).send({ multiStorePd })
   } catch (error) {
      createHttpError(500, 'Server error')
   }
})

export default productsRouter
