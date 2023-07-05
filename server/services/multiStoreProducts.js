import chalk from 'chalk'
import MultiStoreProductModel from '../../utils/models/MultiStoreProducts.js'

export const getMultiStoreFromProductId = async (productId) => {
   console.log(chalk.blue('getting multistore from product shopify id...'));
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
      console.log(chalk.red(`Error from getMultiStoreFromProductId -> ${error}`));
   }
}