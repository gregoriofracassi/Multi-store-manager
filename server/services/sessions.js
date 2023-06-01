import sessionHandler from '../../utils/sessionHandler.js'
import chalk from 'chalk'

export const resetSession = async (req, res) => {
   console.log(chalk.blue('resetting initial session...'))

   try {
      await sessionHandler.loadSession(req.sessionId)
      if (req.sessionId) {
         delete req.sessionId
      }
   } catch (error) {
      console.log(chalk.red(error))
   }
}
