import nacl from 'tweetnacl';
import bs58 from 'bs58';
import _ from 'lodash';

import api from '../api';
import { isEmpty } from '../../utils';
import db from '../db';
import log from '../../logger';

import { Message } from 'models/Message';
export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

const bo = chrome;
const FIXED_USER_NAME = 'local';

// defaults of the settings stored in 'config' and controlled by popup
const DEFAULT_SETTINGS = { active: true, ux: false };

bo.runtime.onMessage.addListener(
  (request: Message, sender, sendResponse) => {
    if (request.type === 'LocalLookup') {
      userLookup(request.payload, sendResponse);
      return true;
    }

    if (request.type === 'ServerLookup') {
      serverLookup(request.payload, sendResponse);
      return true;
    }

    if (request.type === 'ConfigUpdate') {
      configUpdate(request.payload, sendResponse);
      return true;
    }
  },
);

function initializeKey(): KeyPair {
  const newKeypair = nacl.sign.keyPair();
  log.info(
    'Initializing new key pair:',
    bs58.encode(newKeypair.publicKey),
  );
  return {
    publicKey: bs58.encode(newKeypair.publicKey),
    secretKey: bs58.encode(newKeypair.secretKey),
  };
}

interface WithUserId {
  userId: string;
};

function userLookup(
  { userId }: WithUserId,
  sendResponse: (response: unknown) => void,
): void {
  db.get(userId).then(
    (val: unknown) => {
      if (isEmpty(val)) {
        const val = {
          ...initializeKey(),
          ...DEFAULT_SETTINGS,
        };
        db.set(userId, val).then((val) => {
          log.info('First access attempted, created config', val);
          sendResponse(val);
        }).catch((err: Error) => {
          log.error(err);
        });
      } else {
        log.info('sending back from userLookup', userId, val);
        sendResponse(val);
      }
    },
    log.error,
  );
};

function serverLookup(
  payload: unknown,
  sendResponse: (response: unknown) => void,
): void {
  /* remoteLookup might be call as first function after the extension has been
     * installed, and the keys not be yet instanciated */
  const userId = FIXED_USER_NAME;

  db.get(userId).then((val) => {
    if (isEmpty(val)) {
      const val = {
        ...initializeKey(),
        ...DEFAULT_SETTINGS,
      };
      log.info('serverLookup isn\'t used since a while and have been trimmed: double check!');
      return db.set(userId, val).then(function() { return val; });
    }
    return val;
  }).then((x) =>
    api
      .handshake(payload, 'local')
      .then(response => sendResponse({
        type: 'handshakeResponse',
        response,
      }))
      .catch(error => sendResponse({
        type: 'handshakeError',
        response: error,
      })),
  ).catch(log.error);
};

function configUpdate(
  payload: unknown,
  sendResponse: (response: unknown) => void,
): void {
  const userId = FIXED_USER_NAME;
  db.get(userId).then((val) => {
    const update = _.merge(val, payload);
    return db.set(userId, update).catch(log.error);
  }).then((val) => {
    log.info('ConfigUpdate completed and return', val);
    sendResponse(val);
  }).catch(log.error);
}
