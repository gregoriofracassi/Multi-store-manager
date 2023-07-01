import { getProduct, getProductImages, putProduct } from '../services/products.js'
import { getMultiStoreFromProductId } from '../services/multiStoreProducts.js'
import { getSessionsFromStores } from '../services/stores.js'
import sessionHandler from '../../utils/sessionHandler.js'
import MultiStoreProductModel from '../../utils/models/MultiStoreProducts.js'
import { resetSession, loadSessionFromStore } from '../services/sessions.js'
import chalk from 'chalk'
import lodash from 'lodash'

const { cloneDeep } = lodash

const sanitizeProduct = async (product, id, customSession) => {
   try {
      const productCopy = cloneDeep(product)
      delete productCopy.id
      const response = await getProduct(id, customSession)
      let productToModify = response.body.product

      productCopy.variants.forEach((variant) => {
         delete variant['id']
         delete variant.image_id
         const newPrice = parseInt(variant.price) * 3 + 0.99
         variant.price = newPrice.toString()
         variant.product_id = parseInt(id)
      })

      productCopy.options.forEach((option) => {
         delete option.id
         option.product_id = parseInt(id)
      })

      delete productCopy.image.id
      productCopy.image.product_id = parseInt(id)

      if (productToModify?.variants?.length !== productCopy?.variants?.length) {
         console.log(chalk.blueBright('Updating number of variants'))
         await putProduct(id, customSession, productCopy)
         const response = await getProduct(id, customSession)
         productToModify = response.body.product
         console.dir(
            { prodInReq: productCopy.variants.length, prodSaved: productToModify.variants.length },
            { depth: null }
         )
      }

      if (productCopy.images && productCopy.images.length) {
         productCopy.images.forEach((image, index) => {
            delete image.id
            image.product_id = parseInt(id)

            if (image.variant_ids && image.variant_ids.length) {
               const newVariantIds = image.variant_ids.map((variantId, ind) => {
                  const variantIndex = product.variants.findIndex((variant) => variant.id === variantId)
                  // console.log(
                  //    chalk.cyan(
                  //       `Img ind.${index} is considering variant_id ind.${ind}, is assigned to variant ind.${variantIndex} in the main product`
                  //    )
                  // )
                  const toModVariantIds = productToModify.variants.map((variant) => variant.id)
                  // console.log(chalk.cyan(`These are the ids of the variants of corresponding product ${id}:`))
                  // console.dir({ toModVariantIds })
                  // console.dir({ 'toModVariantIds[variantIndex]': toModVariantIds[variantIndex] })
                  return toModVariantIds[variantIndex]
               })
               image.variant_ids = newVariantIds
            }
         })
      }

      // console.dir({productCopy}, { depth: null })
      return productCopy
   } catch (error) {
      console.log(chalk.red(`From sanitizeProduct --> ${error}`))
   }
}

const updateProductHookHandler = async (topic, shop, webhookRequestBody, webhookId, apiVersion) => {
   try {
      console.log(chalk.bgCyanBright(topic))
      const offlineSession = await loadSessionFromStore(shop)
      const product = JSON.parse(webhookRequestBody)
      const multiStorePd = await getMultiStoreFromProductId(product.id)
      console.log(`Executing webhook ${chalk.cyan(webhookId)} for product ${chalk.greenBright(product.id)}`)

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

         const updateProducts = async (sessionObj) => {
            const loadedSession = await sessionHandler.loadSession(sessionObj.sessionId)
            const sanitizedProduct = await sanitizeProduct(product, sessionObj.id, loadedSession)
            console.log(chalk.blue(`updating product in ${sessionObj.store.shop}`))
            const newProduct = await putProduct(sessionObj.id, loadedSession, sanitizedProduct)
            return newProduct
         }
         await Promise.allSettled(fullData.map((sessionObj) => updateProducts(sessionObj)))

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
