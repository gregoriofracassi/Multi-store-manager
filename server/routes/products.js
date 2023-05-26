import { Router } from 'express'
import clientProvider from '../../utils/clientProvider.js'
import subscriptionRoute from './recurringSubscriptions.js'
import { DataType } from '@shopify/shopify-api'
import createHttpError from 'http-errors'
import { getStoresFromTag, getSessionsFromStores } from '../services/stores.js'
import sessionHandler from '../../utils/sessionHandler.js'
import { uploadProduct, getProduct, putProduct } from '../services/products.js'
import verifyRequest from '../middleware/verifyRequest.js'
import axios from 'axios'
import shopify from '../../utils/shopifyConfig.js'
import MultiStoreProductModel from '../../utils/models/MultiStoreProducts.js'

const productsRouter = Router()
// productsRouter.use(subscriptionRoute)

productsRouter.get('/', async (req, res) => {
   try {
      const { client } = await clientProvider.restClient({
         req,
         res,
         isOnline: false
      })
      const allProducts = await client.get({ path: 'products' })
      res.status(200).send(allProducts)
   } catch (error) {
      createHttpError(500, 'Server error')
   }
})

productsRouter.get('/:product_id', async (req, res) => {
   try {
      const { client } = await clientProvider.restClient({
         req,
         res,
         isOnline: false
      })
      const product = await client.get({
         path: `products/${req.params.product_id}`
      })
      res.status(200).send(product)
   } catch (error) {
      createHttpError(500, 'Server error')
   }
})

productsRouter.post('/by_tag/:product_id', async (req, res) => {
   try {
      console.log('in the route')
      const product = await getProduct(req, res)

      const tempProduct = { title: 'fetori' }

      const stores = await getStoresFromTag(req, res)
      const sessions = await getSessionsFromStores(req, res, stores)
      const onlineSessionsIds = sessions.filter((ses) => !ses.id.startsWith('offline')).map((sess) => sess.id)
      console.log({ onlineSessionsIds })
      const uploadedProducts = []
      for (const id of onlineSessionsIds) {
         const loadedSession = await sessionHandler.loadSession(id)
         const uploaded = await uploadProduct(req, res, tempProduct, loadedSession)
         uploadedProducts.push({ [id]: uploaded.body.product.id })
         console.log({ uploaded })
      }

      delete product.id
      const newMultiStore = new MultiStoreProductModel({
         product: product.body,
         shopify_ids: uploadedProducts
      })
      const saved = await newMultiStore.save()

      await sessionHandler.loadSession(req.sessionId)
      if (req.sessionId) {
         delete req.sessionId
      }
      res.status(200).send(saved)
   } catch (error) {
      createHttpError(500, 'Server error')
   }
})

productsRouter.put('/by_tag/:product_id', async (req, res) => {
   try {
      console.log('in the route')
      const multiStorePd = await MultiStoreProductModel.find({
         shopify_ids: {
            $elemMatch: {
               $eq: req.params.product_id
            }
         }
      })

      const sessionsAndProductIds = multiStorePd.shopify_ids
      const modifiedProducts = []
      for (const obj of sessionsAndProductIds) {
         const [[sessionId, productId]] = Object.entries(obj)
         const loadedSession = await sessionHandler.loadSession(sessionId)
         const modified = await putProduct(req, res, loadedSession, productId)
         modifiedProducts.push({ [sessionId]: modified.body })
         console.log({ modified })
      }

      const updatedMultiStore = MultiStoreProductModel.findByIdAndUpdate(multiStorePd._id, req.body, {
         runValidators: true,
         new: true
      })

      await sessionHandler.loadSession(req.sessionId)
      if (req.sessionId) {
         delete req.sessionId
      }
      res.status(200).send({updatedMultiStore, modifiedProducts})
   } catch (error) {
      createHttpError(500, 'Server error')
   }
})

export default productsRouter