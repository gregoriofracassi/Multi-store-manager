import { Router } from 'express'
import clientProvider from '../../utils/clientProvider.js'
import subscriptionRoute from './recurringSubscriptions.js'
import { DataType } from '@shopify/shopify-api'
import storesRouter from './stores.js'
import productsRouter from './products.js'
import webhooksRouter from './webhooks.js'

const userRoutes = Router()
userRoutes.use(subscriptionRoute)
userRoutes.use('/stores', storesRouter)
userRoutes.use('/products', productsRouter)
userRoutes.use('/webhooks', webhooksRouter)

userRoutes.get('/api', (req, res) => {
   const sendData = { text: 'This is coming from /apps/api route.' }
   res.status(200).json(sendData)
})

userRoutes.get('/apipaperone', async (req, res) => {
   const sendData = { text: 'This is coming from /apps/api/paprone.' }
   // const { client } = await clientProvider.restClient({
   //    req,
   //    res,
   //    isOnline: false
   // });
   // const response = await client.get({ path: 'products/8331824988482' });
   // console.log({ text: response.body.product.title });
   res.status(200).json(sendData)
})

userRoutes.post('/api', async (req, res) => {
   const { client } = await clientProvider.restClient({
      req,
      res,
      isOnline: false
   })
   const body = {
      product: {
         title: 'My Product Title'
      }
   }
   const stuff = await client.post({
      path: 'products',
      data: body,
      type: DataType.JSON
   })
   res.status(200).send(stuff)
})

userRoutes.get('/api/gql', async (req, res) => {
   //false for offline session, true for online session
   const { client } = await clientProvider.graphqlClient({
      req,
      res,
      isOnline: false
   })

   const shop = await client.query({
      data: `{
      shop {
        name
      }
    }`
   })

   res.status(200).send(shop)
})

export default userRoutes
