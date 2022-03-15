import { SyncReq } from '@shared/extension/chrome/background/sync';
import db from '@shared/extension/chrome/db';
import config from '@shared/extension/config';
import { decodeKey, decodeString } from '@shared/extension/utils/common.utils';
import { GetAPI } from '@shared/providers/api.provider';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import ytLog from '../../logger';


export const getHeadersForDataDonation = async (req: SyncReq): Promise<any>  => {
  // ytLog.info('Request %O', req);

  const { payload } = req;
  const cookieId = req.userId;

  const keypair: any = await db.get('local');

  ytLog.info('Keypair %O', keypair);

  if (!keypair) {
    throw new Error('Cannot sign payload, no keypair found!');
  }

  const signature = nacl.sign.detached(
    decodeString(JSON.stringify(payload)),
    decodeKey(keypair.secretKey)
  );

  ytLog.info('Signature %s', signature);

  const headers = {
    'Content-Type': 'application/json',
    'X-YTtrex-Version': config.VERSION,
    'X-YTtrex-Build': config.BUILD,
    'X-YTtrex-NonAuthCookieId': cookieId,
    'X-YTtrex-PublicKey': keypair.publicKey,
    'X-YTtrex-Signature': bs58.encode(signature),
  };

  return headers;
}

// export an instance of the API client with proper endpoint
export default GetAPI({
  baseURL: config.API_ROOT,
  getAuth: async (req) => req,
  onUnauthorized: async (res) => res,
});
