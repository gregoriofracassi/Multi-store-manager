import { Router } from 'express'
import clientProvider from '../../utils/clientProvider.js'
import subscriptionRoute from './recurringSubscriptions.js'
import { DataType } from '@shopify/shopify-api'
import StoreModel from '../../utils/models/StoreModel.js'
import createHttpError from 'http-errors'
import { getStoresFromTag } from '../services/stores.js'

const storesRouter = Router()
// storesRouter.use(subscriptionRoute)

storesRouter.put('/set_tags/:id', async (req, res) => {
   const foundStore = StoreModel.findById(req.params.id)
   if (!foundStore) createHttpError(404, 'Store not found')
   const store = await StoreModel.findOneAndUpdate(
      { _id: req.params.id },
      {
         $set: { tags: req.body.tags }
      },
      { new: true }
   )
   res.status(200).send(store)
})

storesRouter.get('/', async (req, res) => {
   try {
      const allStores = await StoreModel.find()
      res.status(200).send(allStores)
   } catch (error) {
      createHttpError(500, 'Server error')
   }
})

storesRouter.get('/by_tag/:product_id', async (req, res) => {
   try {
      const stores = await getStoresFromTag(req, res)
      res.status(200).send(stores)
   } catch (error) {
      createHttpError(500, 'Server error')
   }
})

export default storesRouter
