import bs58 from 'bs58';
import { HandshakeResponse } from '../../../models/HandshakeBody';
import nacl from 'tweetnacl';
import log from '../../logger';
import { Message, ServerLookup } from '../../models/Message';
import UserSettings from '../../models/UserSettings';
import { bo } from '../../utils/browser.utils';
import db from '../db';
import { LoadOpts } from './sync';

export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

const FIXED_USER_NAME = 'local';

// defaults of the settings stored in 'config' and controlled by popup
const DEFAULT_SETTINGS = { active: true, ux: false };

export function initializeKey(): KeyPair {
  const newKeypair = nacl.sign.keyPair();
  const publicKey = bs58.encode(newKeypair.publicKey);
  log.info('initializing new key pair:', publicKey);
  return {
    publicKey,
    secretKey: bs58.encode(newKeypair.secretKey),
  };
}

interface WithUserId {
  userId: string;
}

async function handleLocalLookup(
  { userId }: WithUserId,
  sendResponse: (response: unknown) => void
): Promise<void> {
  try {
    sendResponse(await db.getValid(UserSettings)(userId));
  } catch (err) {
    const initialSettings: UserSettings = {
      ...initializeKey(),
      ...DEFAULT_SETTINGS,
    };
    const newSettings = await db.set(userId, initialSettings);
    sendResponse(newSettings);
  }
}

/**
 * handleServerLookup will be used to fetch settings from the server
 * after the default settings have been obtained from the local storage
 *
 * TODO: implement
 */
export const handleServerLookup =
  (opts: LoadOpts) =>
  async (
    payload: ServerLookup['payload'],
    sendResponse: (response: HandshakeResponse) => void
  ): Promise<void> => {
    log.info('handshake body %O', payload);
    void opts.api.v2.Public.Handshake({
      Body: payload as any,
    })().then((response) => {
      log.info('handshake response %O', response);
      if (response._tag === 'Right') {
        sendResponse(response.right as any);
      } else {
        // TODO: handle error here
        sendResponse(response.left as any);
      }
    });
  };

async function handleConfigUpdate(
  payload: Partial<UserSettings>,
  sendResponse: (response: Partial<UserSettings>) => void
): Promise<void> {
  const userId = FIXED_USER_NAME;
  const settings = await db.update(userId, payload);
  log.info('completed ConfigUpdate, user settings now', settings);
  sendResponse(settings);
}

export const load = (opts: LoadOpts): void => {
  bo.runtime.onMessage.addListener((request: Message, sender, sendResponse) => {
    if (request.type === 'LocalLookup') {
      void handleLocalLookup(request.payload, sendResponse);
      return true;
    }

    if (request.type === 'ServerLookup') {
      void handleServerLookup(opts)(request.payload, sendResponse);
      return true;
    }

    if (request.type === 'ConfigUpdate') {
      void handleConfigUpdate(request.payload, sendResponse);
      return true;
    }
  });
};
