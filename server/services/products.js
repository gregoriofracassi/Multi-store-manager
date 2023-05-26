import clientProvider from '../../utils/clientProvider.js'
import { DataType } from '@shopify/shopify-api'

export const uploadProduct = async (req, res, newProduct, customSession) => {
   const { client } = await clientProvider.restClient({
      req,
      res,
      isOnline: false,
      customSession
   })
   const body = { product: newProduct }
   const product = await client.post({
      path: 'products',
      data: body,
      type: DataType.JSON
   })
   return product
}

export const getProduct = async (req, res) => {
   const { client } = await clientProvider.restClient({
      req,
      res,
      isOnline: false
   })
   const product = await client.get({
      path: `products/${req.params.product_id}`
   })
   console.log({ product })
   if (!product) createHttpError(404, 'No product with this id')
   return product
}

export const putProduct = async (req, res, customSession, productId) => {
   // body example:
   // product: {
   //    title: 'whatever'
   // }
   const { client } = await clientProvider.restClient({
      req,
      res,
      isOnline: false,
      customSession
   })
   const product = await client.put({
      path: `products/${productId}`,
      data: req.body
   })
   console.log({ product })
   if (!product) createHttpError(404, 'No product with this id')
   return product
}
