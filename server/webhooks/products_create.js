import { getProduct, uploadProduct, deleteProduct } from '../services/products.js'
import { getMultiStoreFromProductId } from '../services/multiStoreProducts.js'
import { getStoresFromTag, getSessionsFromStores, getCurrentStore } from '../services/stores.js'
import sessionHandler from '../../utils/sessionHandler.js'
import MultiStoreProductModel from '../../utils/models/MultiStoreProducts.js'
import { resetSession, loadSessionFromStore } from '../services/sessions.js'
import chalk from 'chalk'
import lodash from 'lodash'

const { cloneDeep } = lodash

const sanitizeProduct = (product) => {
   product.variants.forEach((variant) => {
      const newPrice = parseInt(variant.price) * 3
      variant.price = newPrice.toString()
   })
   return product
}

const createProductHookHandler = async (topic, shop, webhookRequestBody, webhookId, apiVersion) => {
   try {
      console.log(chalk.bgCyanBright(topic));
      const offlineSession = await loadSessionFromStore(shop)
      const productId = JSON.parse(webhookRequestBody).id.toString()

      console.log(`Executing webhook ${chalk.cyan(webhookId)} for product ${chalk.greenBright(productId)}`);
      const product = await getProduct(productId, offlineSession)
      delete product.body.product.id
      const productBody = product.body.product

      let existingInStores = []
      const multiStorePd = await getMultiStoreFromProductId(productId)
      if (multiStorePd) {
         existingInStores = multiStorePd.shopifyData.map((shop) => shop.store)
      }
      
      const stores = await getStoresFromTag(existingInStores, offlineSession, productId)
      const sessionStoresToAdd = await getSessionsFromStores(stores.toAdd, offlineSession.id, {
         offline: true,
         noCurrent: true
      })
      const sessionStoresToDelete = await getSessionsFromStores(stores.toDelete, offlineSession.id, { offline: true })

      if (sessionStoresToDelete.length || sessionStoresToAdd.length) {
         const uploadedProducts = []
         const deletedProducts = []

         const addProducts = async (sessionObj) => {
            const loadedSession = await sessionHandler.loadSession(sessionObj.session.id)
            console.log(chalk.blue(`uploading product to ${sessionObj.store.shop}...`))
            const sanitizedProduct = sanitizeProduct(productBody)
            const uploaded = await uploadProduct(sanitizedProduct, loadedSession)
            uploadedProducts.push({ store: sessionObj.store._id, id: uploaded.body.product.id })
         }
         await Promise.allSettled(sessionStoresToAdd.map((sessionObj) => addProducts(sessionObj)))
        
         const removeProducts = async (sessionObj) => {
            const loadedSession = await sessionHandler.loadSession(sessionObj.session.id)
            console.log(chalk.blue(`deleting product from ${sessionObj.store.shop}...`))
            const shopifyData = multiStorePd.shopifyData.find(
               (shop) => sessionObj.store._id.toString() === shop.store._id.toString()
            )
            await deleteProduct(shopifyData.id, loadedSession)
            deletedProducts.push({ id: shopifyData.id, store: sessionObj.store._id })
         }
         await Promise.allSettled(sessionStoresToDelete.map((sessionObj) => removeProducts(sessionObj)))

         const responseObj = {}

         if (!multiStorePd) {
            const keepInCurrentStore = async () => {
               const currentStore = await getCurrentStore(offlineSession.id)
               const deletedStoresIds = sessionStoresToDelete.map((sesSt) => sesSt.store._id.toString())
               return deletedStoresIds.includes(currentStore._id.toString()) ? false : currentStore._id
            }
            const current = await keepInCurrentStore()
            console.log(chalk.blue('adding multistore product...'))
            const newMultiStorePd = new MultiStoreProductModel({
               product: product.body.product,
               shopifyData: current
                  ? [...uploadedProducts, { id: productId, store: current }]
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

         await resetSession(offlineSession.id)
      } else {
         console.log(chalk.yellow('Product already present in all corresponding stores'))
      }
      console.log(chalk.green('done.'))
   } catch (error) {
      console.log(chalk.red(`From create webhook --> ${error}`))
   }
}

export default createProductHookHandler
