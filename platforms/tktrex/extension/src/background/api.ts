import { SyncReq } from '@shared/extension/chrome/background/sync';
import db from '@shared/extension/chrome/db';
import config from '@shared/extension/config';
import { MakeAPIClient } from '@shared/providers/api.provider';
import {
  decodeFromBase58,
  decodeString,
  encodeToBase58,
} from '@shared/utils/decode.utils';
import * as endpoints from '@tktrex/endpoints';
import _ from 'lodash';
import nacl from 'tweetnacl';
import { tkLog } from '../logger';

export const getHeadersForDataDonation = async(req: SyncReq): Promise<any> => {
  // ytLog.info('Request %O', req);

  const { payload } = req;
  const staticStorageName = req.userId;

  const userSettings: any = await db.get('local');

  tkLog.info('userSettings %O', userSettings);

  if (!userSettings) {
    throw new Error('Cannot sign payload, no keypair found!');
  }

  _.map(payload, function(revnt) {
    if (userSettings.researchTag?.length)
      revnt.researchTag = userSettings.researchTag;
  });

  tkLog.debug('Signing payload %O', payload);

  const signatureUint = nacl.sign.detached(
    decodeString(JSON.stringify(payload)),
    decodeFromBase58(userSettings.secretKey),
  );

  const signature = encodeToBase58(signatureUint);

  tkLog.debug('Signature %s', signature);

  const headers = {
    'Content-Type': 'application/json',
    'X-Tktrex-Version': config.VERSION,
    'X-Tktrex-Build': config.BUILD,
    'X-Tktrex-NonAuthCookieId': staticStorageName,
    'X-Tktrex-PublicKey': userSettings.publicKey,
    'X-Tktrex-Signature': signature,
  };

  return headers;
};

// export an instance of the API client with proper endpoint
export default MakeAPIClient(
  {
    baseURL: config.API_ROOT,
    getAuth: async(req) => req,
    onUnauthorized: async(res) => res,
  },
  endpoints,
);
