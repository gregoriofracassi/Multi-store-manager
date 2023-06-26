//Combine all your webhooks here
import { DeliveryMethod } from '@shopify/shopify-api'
import shopify from '../../utils/shopifyConfig.js'
import appUninstallHandler from './app_uninstalled.js'
import productsCreateHook from './products_create.js'
import updateProductHookHandler from './products_update.js'
import deleteProductHookHandler from './products_Delete.js'

/*
  Template for adding new topics:
  ```
  TOPIC: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/topic",
      callback: topicHandler,
    },
  ```

    - Webhook topic and callbackUrl topic should be exactly the same because it's using catch-all
    - Don't change the delivery method unless you know what you're doing
      - the method is `DeliveryMethod.Http` and not `DeliveryMethod.http`, mind the caps on `H` in `http`
*/

const webhookRegistrar = async (additionalHooks = false) => {
   const hooks = {
      APP_UNINSTALLED: {
         deliveryMethod: DeliveryMethod.Http,
         callbackUrl: '/webhooks/app_uninstalled',
         callback: appUninstallHandler
      }
   }
   if (additionalHooks) {
      hooks.PRODUCTS_CREATE = {
         deliveryMethod: DeliveryMethod.Http,
         callbackUrl: `/webhooks/products_create`,
         callback: productsCreateHook
      }
      hooks.PRODUCTS_UPDATE = {
         deliveryMethod: DeliveryMethod.Http,
         callbackUrl: `/webhooks/products_create`,
         callback: updateProductHookHandler
      }
      hooks.PRODUCTS_DELETE = {
         deliveryMethod: DeliveryMethod.Http,
         callbackUrl: `/webhooks/products_create`,
         callback: deleteProductHookHandler
      }
   }
   shopify.webhooks.addHandlers(hooks)
}

export default webhookRegistrar
