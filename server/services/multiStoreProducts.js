import createHttpError from 'http-errors'
import chalk from 'chalk'
import MultiStoreProductModel from '../../utils/models/MultiStoreProducts.js'

export const getMultiStoreFromProductId = async (req, res) => {
   console.log(chalk.blue('getting multistore from product shopify id...'));
   try {
      const multiStorePd = await MultiStoreProductModel.findOne({
         shopifyData: {
            $elemMatch: {
               id: req.params.product_id
            }
         }
      }).populate('shopifyData.store')
      return multiStorePd
   } catch (error) {
      createHttpError(500, 'Server error')
   }
}