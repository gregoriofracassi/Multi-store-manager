import clientProvider from '../../utils/clientProvider.js'
import StoreModel from '../../utils/models/StoreModel.js'
import SessionModel from '../../utils/models/SessionModel.js'
import createHttpError from 'http-errors'

export const getStoresFromTag = async (req, res) => {
   const { client } = await clientProvider.restClient({
      req,
      res,
      isOnline: false
   })
   const response = await client.get({
      path: `products/${req.params.product_id}`
   })
   console.log({response})
   const productTags = response.body.product.tags.split(', ')
   const stores = await StoreModel.find({
      tags: {
         $in: productTags
      }
   })
   return stores
}

export const getSessionsFromStores = async (req, res, storeArr = []) => {
   const shops = storeArr.map((store) => store.shop)
   const sessions = SessionModel.find({
      shop: {
         $in: shops
      }
   })
   if (!sessions) createHttpError(404, 'No sessions for the provided shops')
   return sessions
}
