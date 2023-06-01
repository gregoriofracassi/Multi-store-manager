import clientProvider from '../../utils/clientProvider.js'
import StoreModel from '../../utils/models/StoreModel.js'
import SessionModel from '../../utils/models/SessionModel.js'
import createHttpError from 'http-errors'
import chalk from 'chalk'

function cutStringUpToDotCom(str) {
   const dotComIndex = str.indexOf('.com')
   if (dotComIndex !== -1) {
      return str.substring(0, dotComIndex + 4)
   }
   return str
}

export const getStoresFromTag = async (req, res, exceptStores = []) => {
   console.log(chalk.blue('getting stores from product tags...'))
   try {
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
      const result = { toAdd: [], toDelete: [], byTag: stores }
      if (exceptStores && exceptStores.length) {
         const combinedStores = [
            ...stores.map((st) => {
               return { store: st, from: 'new' }
            }),
            ...exceptStores.map((st) => {
               return { store: st, from: 'existing' }
            })
         ]
         const resultArr = Object.values(
            combinedStores.reduce((acc, val) => {
               if (!acc[val.store._id.toString()]) {
                  acc[val.store._id.toString()] = { store: val.store, count: 1, from: val.from }
               } else {
                  acc[val.store._id.toString()].count++
               }
               return acc
            }, {})
         )
         resultArr.forEach((el) => {
            if (el.count < 2) {
               el.from === 'existing' ? result.toDelete.push(el.store) : result.toAdd.push(el.store)
            }
         })
         return result
      }
      result.toAdd = stores
      return result
   } catch (error) {
      console.log(chalk.red(error))
   }
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
      console.log(chalk.red(error))
   }
}

export const getCurrentStore = async (req, res) => {
   try {
      const { sessionId } = req
      const store = await StoreModel.findOne({
         shop: cutStringUpToDotCom(sessionId)
      })
      return store
   } catch (error) {
      console.log(chalk.red('Cannot find store with current session id'))
   }
}
