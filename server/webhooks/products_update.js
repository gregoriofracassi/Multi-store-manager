import { putProduct } from '../services/products.js'
import { getMultiStoreFromProductId } from '../services/multiStoreProducts.js'
import { getStoresFromTag, getSessionsFromStores, getCurrentStore } from '../services/stores.js'
import sessionHandler from '../../utils/sessionHandler.js'
import MultiStoreProductModel from '../../utils/models/MultiStoreProducts.js'
import { resetSession, loadSessionFromStore } from '../services/sessions.js'
import chalk from 'chalk'

const updateProductHookHandler = async (topic, shop, webhookRequestBody, webhookId, apiVersion) => {
   try {
      console.log(chalk.bgCyanBright(topic))
      const offlineSession = await loadSessionFromStore(shop)
      const product = JSON.parse(webhookRequestBody)
      delete product.variants
      const multiStorePd = await getMultiStoreFromProductId(product.id)
      if (multiStorePd) {
         const fullData = []
         for (const shopiData of multiStorePd.shopifyData) {
            const session = await getSessionsFromStores([shopiData.store], offlineSession.id, {
               offline: true,
               noCurrent: true
            })
            if (session && session.length) {
               fullData.push({ ...shopiData.toJSON(), sessionId: session[0].session.id })
            }
         }

         for (const sessionObj of fullData) {
            const loadedSession = await sessionHandler.loadSession(sessionObj.sessionId)
            console.log(chalk.blue(`updating product in ${sessionObj.store.shop}...`))
            await putProduct(sessionObj.id, loadedSession, product)
         }
         await MultiStoreProductModel.findOneAndUpdate(
            { _id: multiStorePd._id },
            {
               product: product
            },
            { new: true, runValidators: true }
         )
      } else {
         console.log(chalk.yellow('No record of this product being associated to others'))
      }
      await resetSession(offlineSession.id)
      console.log(chalk.green('done.'))
   } catch (error) {
      console.log(chalk.red(error))
   }
}

export default updateProductHookHandler
