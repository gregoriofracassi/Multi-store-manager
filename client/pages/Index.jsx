import { useAppBridge } from '@shopify/app-bridge-react'
import { Redirect } from '@shopify/app-bridge/actions'
import { Layout, LegacyCard, Page, Text } from '@shopify/polaris'
import { navigate } from 'raviger'
import React from 'react'

const HomePage = () => {
   const app = useAppBridge()
   const redirect = Redirect.create(app)

   return (
      <Page title="Guidelines">
         <Layout>
            <Layout.Section fullWidth>
               <LegacyCard
                  sectioned
                  title="Risoluzione problemi"
                  primaryFooterAction={{
                     content: 'Invito',
                     onAction: () => {
                        redirect.dispatch(Redirect.Action.REMOTE, {
                           url: 'https://discord.gg/NGfDU4UQuX',
                           newContext: true
                        })
                     }
                  }}
                  secondaryFooterActions={[
                     {
                        content: 'Download',
                        onAction: () => {
                           redirect.dispatch(Redirect.Action.REMOTE, {
                              url: 'https://discord.com/download',
                              newContext: true
                           })
                        }
                     }
                  ]}
               >
                  <p>
                     Per qualunque problema con l'app, suggerimenti o modifiche (all'app o ai tag degli store)
                     scrivi a Gregorio su Discord all'interno del server dedicato. Qua sotto hai il link per
                     scaricare Discord (scrolla in fondo per Mac) e l'invito per entrare nel server.
                  </p>
               </LegacyCard>
            </Layout.Section>
            <Layout.Section fullWidth>
               <LegacyCard sectioned title="Sincronizzazione prodotti">
                  <p>
                     Per <b>caricare, modificare o cancellare un prodotto</b> su più store contemporaneamente,
                     fallo normalmente sullo <b>store madre</b> e sarà caricato/modificato/cancellato automaticamente
                     anche sugli altri store a seconda di quali tag gli hai dato. <br />
                     Se vuoi modificare il prodotto su uno degli store satellite questo non modificherà gli altri prodotti associati.
                     <br />
                     <br />
                     
                  </p>
                  <p>
                     Ogni store ha una serie di tag che servono per l'associazione dei prodotti. Al momento
                     non puoi vederli/modificarli, quella feature è in fase di sviluppo. Pubblicherò su
                     Discord la lista corrente di <b>associazioni store - tag</b>.
                     <br />
                     <br />
                  </p>
                  <p>
                     Se vuoi <b>modificare la distribuzione</b> di un prodotto sugli store satellite, la
                     modifica del tag sul prodotto nello store madre non è sufficiente.
                     Cancella il prodotto e re-uploadalo con i tag che vuoi. Se si trova che sarebbe più comodo avere la sincronizzazione sulla modifica dei tag di un prodotto già presente scrivetemelo su Discord &#9757; &#128077;
                     <br />
                     <br />
                     <Text as="span" color="warning" fontWeight="semibold">
                        Al momento non avrai un feedback visivo dei prodotti che si caricano sui vari store, è in fase di sviluppo. <br></br>
                        Se non vedi ancora i prodotti presenti negli store associati, aspetta un paio di
                        minuti. Se la chiamata fallisce è programmata per ripetersi automaticamente. Se il
                        problema persiste scrivi a Gregorio.
                     </Text>
                     <br />
                     <br />
                  </p>
               </LegacyCard>
            </Layout.Section>
         </Layout>
      </Page>
   )
}

export default HomePage
