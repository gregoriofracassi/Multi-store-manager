import { Session } from '@shopify/shopify-api';
import Cryptr from 'cryptr';
import SessionModel from './models/SessionModel.js';

const cryption = new Cryptr(process.env.ENCRYPTION_STRING);

const storeSession = async (session) => {
   await SessionModel.findOneAndUpdate(
      { id: session.id },
      {
         content: cryption.encrypt(JSON.stringify(session)),
         shop: session.shop
      },
      { upsert: true }
   );

   return true;
};

const loadSession = async (id) => {
   //   const sessionResult = await SessionModel.findOne({ id: 'gbranddevstore2.myshopify.com_97640874286' });
   const sessionResult = await SessionModel.findOne({ id });
   if (sessionResult === null) {
      return undefined;
   }
   if (sessionResult.content.length > 0) {
      const sessionObj = JSON.parse(cryption.decrypt(sessionResult.content));
      const returnSession = new Session(sessionObj);
      return returnSession;
   }
   return undefined;
};

const deleteSession = async (id) => {
   await SessionModel.deleteMany({ id });
   return true;
};

const sessionHandler = { storeSession, loadSession, deleteSession };

export default sessionHandler;

// {
//    sessionObj: {
//      id: 'gbrand-store2023.myshopify.com_97395507507',
//      shop: 'gbrand-store2023.myshopify.com',
//      state: '352543414120517',
//      isOnline: true,
//      accessToken: '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',
//      scope: 'write_content',
//      expires: '2023-05-20T11:21:10.256Z',
//      onlineAccessInfo: {
//        expires_in: 86392,
//        associated_user_scope: 'write_content',
//        session: '7d4d3e21c7b7b06c38d4cf1d4da47d2273bbe65fdfa9fc077531c93bbf2a6ce3',
//        account_number: 0,
//        associated_user: [Object]
//      }
//    }
//  }
