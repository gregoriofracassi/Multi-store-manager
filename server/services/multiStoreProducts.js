import chalk from 'chalk'
import MultiStoreProductModel from '../../utils/models/MultiStoreProducts.js'
import { allTags } from './utils.js'
import StoreModel from '../../utils/models/StoreModel.js'

export const _populateStoresWithTags = async () => {
   try {
      await StoreModel.updateMany({}, { $set: { tags: allTags } })
   } catch (error) {
      console.log(chalk.red(`Error from getMultiStoreFromProductId -> ${error}`))
   }
}

export const getMultiStoreFromProductId = async (productId) => {
   console.log(chalk.blue('getting multistore from product shopify id...'))
   try {
      const multiStorePd = await MultiStoreProductModel.findOne({
         shopifyData: {
            $elemMatch: {
               id: productId
            }
         }
      }).populate('shopifyData.store')
      return multiStorePd
   } catch (error) {
      console.log(chalk.red(`Error from getMultiStoreFromProductId -> ${error}`))
   }
}
