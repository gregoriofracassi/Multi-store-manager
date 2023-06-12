import clientProvider from '../../utils/clientProvider.js'
import { DataType } from '@shopify/shopify-api'
import chalk from 'chalk'

export const formatProductBody = (body) => {
   return { product: body }
}

export const uploadProduct = async (newProduct, customSession, req, res ) => {
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
      console.log(`From upload product service --> ${error}`)
   }
}

export const deleteProduct = async (productId, customSession, req, res) => {
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
      console.log(chalk.red(`From delete product service --> ${error}`))
   }
}

export const getProduct = async (productId, customSession, req, res) => {
   try {
      const { client } = await clientProvider.restClient({
         req,
         res,
         isOnline: false,
         customSession
      })
      const product = await client.get({
         path: `products/${productId}`
      })
      return product
   } catch (error) {
      console.log(chalk.red(`From get product service --> ${error}`))
   }
}

export const putProduct = async (req, res, productId, customSession, newProduct) => {
   try {
      const body = formatProductBody(req.body)
      const { client } = await clientProvider.restClient({
         req,
         res,
         isOnline: false,
         customSession
      })
      const product = await client.put({
         path: `products/${productId}`,
         data: body
      })
      return product
   } catch (error) {
      console.log(chalk.red(`From put product service --> ${error}`))
   }
}
