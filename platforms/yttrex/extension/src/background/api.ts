import { SyncReq } from '@shared/extension/background/sync';
import db from '@shared/extension/db';
import config from '@shared/extension/config';
import { MakeAPIClient } from '@shared/providers/api.provider';
import {
  decodeFromBase58,
  decodeString,
  encodeToBase58,
} from '@shared/utils/decode.utils';
import * as endpoints from '@yttrex/shared/endpoints';
import nacl from 'tweetnacl';
import ytLog from '../logger';
import { UserSettings } from '@shared/extension/models/UserSettings';

export const getHeadersForDataDonation = async (req: SyncReq): Promise<any> => {
  const { payload } = req;

  const userSettings: UserSettings = (await db.get('local')) as any;

  ytLog.info('User setting %O', userSettings);

  if (!userSettings) {
    throw new Error('Cannot sign payload, no keypair found!');
  }

  const signature = nacl.sign.detached(
    decodeString(JSON.stringify(payload)),
    decodeFromBase58(userSettings.secretKey)
  );
  const sign = encodeToBase58(signature);

  ytLog.info('Signature (%s)', sign);

  const headers = {
    'Content-Type': 'application/json',
    'X-YTtrex-Version': config.VERSION,
    'X-YTtrex-Build': config.BUILD_DATE,
    'X-YTtrex-NonAuthCookieId': userSettings.researchTag ?? '',
    'X-YTtrex-PublicKey': userSettings.publicKey,
    'X-YTtrex-Signature': sign,
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
  endpoints
);
