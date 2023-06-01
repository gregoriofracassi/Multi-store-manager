import { Router } from 'express'
import StoreModel from '../../utils/models/StoreModel.js'
import { getStoresFromTag } from '../services/stores.js'
import chalk from 'chalk'

const storesRouter = Router()
// storesRouter.use(subscriptionRoute)

storesRouter.put('/set_tags/:id', async (req, res) => {
   try {
      const store = await StoreModel.findOneAndUpdate(
         { _id: req.params.id },
         {
            $set: { tags: req.body.tags }
         },
         { new: true }
      )
      res.status(200).send(store)
   } catch (error) {
      console.log(chalk.red(error))
   }
})

storesRouter.get('/', async (req, res) => {
   try {
      const allStores = await StoreModel.find()
      res.status(200).send(allStores)
   } catch (error) {
      console.log(chalk.red(error))
   }
})

storesRouter.get('/by_tag/:product_id', async (req, res) => {
   try {
      const stores = await getStoresFromTag(req, res)
      res.status(200).send(stores)
   } catch (error) {
      console.log(chalk.red(error))
   }
})

export default storesRouter
