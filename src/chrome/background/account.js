import nacl from 'tweetnacl';
import bs58 from 'bs58';
import _ from 'lodash';
import api from '../api';
import { isEmpty } from '../../utils';
import db from '../db';

const bo = chrome || browser;
const FIXED_USER_NAME = 'local';

// defaults of the settings stored in 'config' and controlled by popup
const DEFAULT_SETTINGS = {
  active: true,
  svg: false,
  videorep: true,
  playhide: false,
};


function initializeKey() {
  const newKeypair = nacl.sign.keyPair();
  // eslint-disable-next-line no-console
  console.log('Initializing new key pair:', bs58.encode(newKeypair.publicKey));
  return {
    publicKey: bs58.encode(newKeypair.publicKey),
    secretKey: bs58.encode(newKeypair.secretKey),
  };
}
function setDefaults(val) {
  val.active = DEFAULT_SETTINGS.active;
  val.ux = DEFAULT_SETTINGS.ux;
  return val;
}

function userLookup({ userId }, sendResponse) {
  db.get(userId).then((val) => {
    if (isEmpty(val)) {
      val = setDefaults(initializeKey());
      db.set(userId, val).then((val) => {
        // eslint-disable-next-line no-console
        console.log('First access attempted, created config', val);
        sendResponse(val);
      });
    } else {
      // eslint-disable-next-line no-console
      console.log('sending back from userLookup', userId, val);
      sendResponse(val);
    }
  });
}

function serverLookup(payload, sendResponse) {
  /* remoteLookup might be call as first function after the extension has been
   * installed, and the keys not be yet instanciated */
  const userId = FIXED_USER_NAME;
  db.get(userId)
    .then((val) => {
      if (isEmpty(val)) {
        val = setDefaults(initializeKey());
        // eslint-disable-next-line no-console
        console.log(
          "serverLookup isn't used since a while and have been trimmed: double check!"
        );
        return db.set(userId, val).then(function () {
          return val;
        });
      }
      return val;
    })
    .then(async (x) => {
      try {
        const response = await api.handshake(payload, FIXED_USER_NAME);
        return sendResponse({ type: 'handshakeResponse', response: response });
      } catch (error) {
        return sendResponse({ type: 'handshakeError', response: error });
      }
    });
}

function configUpdate(payload, sendResponse) {
  const userId = FIXED_USER_NAME;
  db.get(userId)
    .then((val) => {
      const update = _.merge(val, payload);
      return db.set(userId, update);
    })
    .then((val) => {
      // eslint-disable-next-line no-console
      console.log('ConfigUpdate completed and return', val);
      sendResponse(val);
    });
}

bo.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // eslint-disable-next-line no-console
  console.log('focacci', request);
  if (request.type === 'localLookup') {
    userLookup(
      request.payload ? request.payload : { userId: FIXED_USER_NAME },
      sendResponse
    );
    return true;
  }
  if (request.type === 'recommendationsFetch') {
    serverLookup(request.payload, sendResponse);
    return true;
  }
  if (request.type === 'configUpdate') {
    configUpdate(request.payload, sendResponse);
    return true;
  }
});