import sessionHandler from '../../utils/sessionHandler.js'
import chalk from 'chalk'

export const resetSession = async (sessionId) => {
   console.log(chalk.blue('resetting initial session...'))

   try {
      await sessionHandler.loadSession(sessionId)
   } catch (error) {
      console.log(chalk.red(`From reset session service --> ${error}`))
   }
}

export const loadSessionFromStore = async (shop) => {
   const sessionId = `offline_${shop}`
   const offlineSession = await sessionHandler.loadSession(sessionId)
   return offlineSession
}
