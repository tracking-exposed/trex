import { SyncReq } from '@shared/extension/chrome/background/sync';
import db from '@shared/extension/chrome/db';
import config from '@shared/extension/config';
import { MakeAPIClient } from '@shared/providers/api.provider';
import { decodeFromBase58, decodeString, encodeToBase58 } from '@shared/utils/decode.utils';
import * as endpoints from '@tktrex/endpoints';
import nacl from 'tweetnacl';
import { tkLog } from '../logger';

export const getHeadersForDataDonation = async (req: SyncReq): Promise<any> => {
  // ytLog.info('Request %O', req);

  const { payload } = req;
  const cookieId = req.userId;

  const keypair: any = await db.get('local');

  tkLog.info('Keypair %O', keypair);

  if (!keypair) {
    throw new Error('Cannot sign payload, no keypair found!');
  }

  tkLog.debug('Signing payload %O', payload);

  const signature = nacl.sign.detached(
    decodeString(JSON.stringify(payload)),
    decodeFromBase58(keypair.secretKey),
  );

  tkLog.info('Signature %s', signature);

  const headers = {
    'Content-Type': 'application/json',
    'X-Tktrex-Version': config.VERSION,
    'X-Tktrex-Build': config.BUILD,
    'X-Tktrex-NonAuthCookieId': cookieId,
    'X-Tktrex-PublicKey': keypair.publicKey,
    'X-Tktrex-Signature': encodeToBase58(signature),
  };

  return headers;
};

// export an instance of the API client with proper endpoint
export default MakeAPIClient(
  {
    baseURL: config.API_ROOT,
    getAuth: async (req) => req,
    onUnauthorized: async (res) => res,
  },
  endpoints,
);
