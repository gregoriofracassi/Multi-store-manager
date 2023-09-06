import { NavigationMenu } from '@shopify/app-bridge-react'
import { AppProvider as PolarisProvider } from '@shopify/polaris'
import '@shopify/polaris/build/esm/styles.css'
import translations from '@shopify/polaris/locales/en.json'
import { usePath, useRoutes } from 'raviger'
import routes from './Routes'
import ApolloClientProvider from './providers/ApolloClientProvider'
import AppBridgeProvider from './providers/AppBridgeProvider'

export default function App() {
   const RouteComponents = useRoutes(routes)

   return (
      <PolarisProvider i18n={translations}>
         <AppBridgeProvider>
            <ApolloClientProvider>{RouteComponents}</ApolloClientProvider>
         </AppBridgeProvider>
      </PolarisProvider>
   )
}
