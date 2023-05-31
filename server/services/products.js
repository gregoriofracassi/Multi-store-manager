import clientProvider from '../../utils/clientProvider.js'
import { DataType } from '@shopify/shopify-api'
import chalk from 'chalk'

export const uploadProduct = async (req, res, newProduct, customSession) => {
   try {
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
   } catch (error) {
      console.log(chalk.red(error))
   }
}

export const deleteProduct = async (req, res, productId, customSession) => {
   try {
      const { client } = await clientProvider.restClient({
         req,
         res,
         isOnline: false,
         customSession
      })
      const product = await client.delete({
         path: `products/${productId}`
      })
      return product
   } catch (error) {
      console.log(chalk.red(error))
   }
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
   if (!product) createHttpError(404, 'No product with this id')
   return product
}
