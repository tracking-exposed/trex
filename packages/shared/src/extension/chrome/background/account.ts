import nacl from 'tweetnacl';
import bs58 from 'bs58';

import { Message, ServerLookup } from '../../models/Message';
import { ServerLookupResponse } from '../../models/ServerLookupResponse';
import UserSettings from '../../models/UserSettings';
import log from '../../logger';
import db from '../db';

export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

const bo = chrome;
const FIXED_USER_NAME = 'local';

// defaults of the settings stored in 'config' and controlled by popup
const DEFAULT_SETTINGS = { active: true, ux: false };

function initializeKey(): KeyPair {
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
async function handleServerLookup(
  payload: ServerLookup['payload'],
  sendResponse: (response: ServerLookupResponse) => void
): Promise<void> {
  sendResponse(null);
}

async function handleConfigUpdate(
  payload: Partial<UserSettings>,
  sendResponse: (response: Partial<UserSettings>) => void
): Promise<void> {
  const userId = FIXED_USER_NAME;
  const settings = await db.update(userId, payload);
  log.info('completed ConfigUpdate, user settings now', settings);
  sendResponse(settings);
}

export const load = (): void => {
  bo.runtime.onMessage.addListener((request: Message, sender, sendResponse) => {
    if (request.type === 'LocalLookup') {
      void handleLocalLookup(request.payload, sendResponse);
      return true;
    }

    if (request.type === 'ServerLookup') {
      void handleServerLookup(request.payload, sendResponse);
      return true;
    }

    if (request.type === 'ConfigUpdate') {
      void handleConfigUpdate(request.payload, sendResponse);
      return true;
    }
  });
};
