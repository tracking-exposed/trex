import { load } from '@shared/extension/chrome/background/index';
import db from '@shared/extension/chrome/db';
import config from '@shared/extension/config';
import { decodeKey, decodeString } from '@shared/extension/utils/common.utils';
import bs58 from 'bs58';
import ytLog from 'logger';
import nacl from 'tweetnacl';
import api from '../../api';
import './chromeConfig';

load({
  api: api.API,
  getHeadersForDataDonation: async (req) => {
    ytLog.debug('Request %O', req);

    const { payload } = req;
    const cookieId = req.userId;

    const keypair: any = await db.get('local');
    if (!keypair) {
      throw new Error('Cannot sign payload, no keypair found!');
    }

    const signature = nacl.sign.detached(
      decodeString(JSON.stringify(payload)),
      decodeKey(keypair.secretKey)
    );

    const headers = {
      'Content-Type': 'application/json',
      'X-YTtrex-Version': config.VERSION,
      'X-YTtrex-Build': config.BUILD,
      'X-YTtrex-NonAuthCookieId': cookieId,
      'X-YTtrex-PublicKey': keypair.publicKey,
      'X-YTtrex-Signature': bs58.encode(signature),
    };
    ytLog.debug('Headers %O', headers);
    return headers;
  },
});
