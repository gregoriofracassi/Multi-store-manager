import clientProvider from '../../utils/clientProvider.js'
import StoreModel from '../../utils/models/StoreModel.js'
import SessionModel from '../../utils/models/SessionModel.js'
import createHttpError from 'http-errors'
import chalk from 'chalk'

export const getStoresFromTag = async (req, res) => {
   console.log(chalk.blue('getting stores form product tags...'))
   const { client } = await clientProvider.restClient({
      req,
      res,
      isOnline: false
   })
   const response = await client.get({
      path: `products/${req.params.product_id}`
   })
   const productTags = response.body.product.tags.split(', ')
   const stores = await StoreModel.find({
      tags: {
         $in: productTags
      }
   })
   return stores
}

export const getSessionsFromStores = async (req, res, storeArr = [], options) => {
   console.log(chalk.blue('getting sessions from stores...'))
   try {
      const shops = storeArr.map((store) => store.shop)
      const sessions = await SessionModel.find({
         shop: {
            $in: shops
         }
      })
      if (!sessions) createHttpError(404, 'No sessions for the provided shops')
      let mappedSessions = sessions.map((session) => {
         const store = storeArr.find((st) => st.shop === session.shop)
         return { session, store }
      })
      if (options?.noCurrent && req.sessionId) {
         mappedSessions = mappedSessions.filter((sess) => sess.session.id !== req.sessionId)
      }
      if (options?.online) {
         mappedSessions = mappedSessions.filter((ses) => !ses.session.id.startsWith('offline'))
      }
      return mappedSessions
   } catch (error) {
      createHttpError(500, 'Server error')
   }
}
