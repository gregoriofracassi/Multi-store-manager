import { Router } from 'express'
import clientProvider from '../../utils/clientProvider.js'
import chalk from 'chalk'

const webhooksRouter = Router()

webhooksRouter.get('/', async (req, res) => {
   try {
      const { client } = await clientProvider.restClient({
         req,
         res,
         isOnline: false
      })
      const webhooks = await client.get({ path: 'webhooks' })
      res.status(200).send(webhooks)
   } catch (error) {
      console.log(chalk.red(`From getWebhooks --> ${error}`));
   }
})

export default webhooksRouter
