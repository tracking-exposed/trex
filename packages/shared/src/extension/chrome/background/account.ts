import bs58 from 'bs58';
import { HandshakeResponse } from '../../../models/HandshakeBody';
import nacl from 'tweetnacl';
import log from '../../logger';
import { Message, ServerLookup } from '../../models/Message';
import UserSettings from '../../models/UserSettings';
import { bo } from '../../utils/browser.utils';
import db from '../db';
import file from '../file';
import { LoadOpts } from './sync';
import * as t from 'io-ts';

export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

const FIXED_USER_NAME = 'local';

// defaults of the settings stored in 'config' and controlled by popup
const DEFAULT_SETTINGS = { active: true, ux: false, researchTag: '' };

/**
 * Create publicKey and secretKey
 */
export function initializeKey(): KeyPair {
  // use publicKey and secretKey from process.env when available
  if (process.env.PUBLIC_KEY && process.env.SECRET_KEY) {
    return {
      publicKey: process.env.PUBLIC_KEY,
      secretKey: process.env.SECRET_KEY,
    };
  }
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
  sendResponse: (response: Partial<UserSettings>) => void
): Promise<void> {
  let settings;
  try {
    const localSettings = await file.readJSON(
      'settings.json',
      t.partial(UserSettings.props)
    );
    settings = {
      ...DEFAULT_SETTINGS,
      ...localSettings,
    };
    await db.set(userId, settings);
  } catch (err) {
    settings = await db.getValid(UserSettings)(userId);

    const initialSettings: UserSettings = {
      ...initializeKey(),
      ...DEFAULT_SETTINGS,
    };
    settings = await db.set(userId, initialSettings);
  }

  sendResponse(settings);
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
    { href, ...config }: ServerLookup['payload'],
    sendResponse: (response: HandshakeResponse) => void
  ): Promise<void> => {
    log.info('handshake body %O', config);
    void (opts.api as any).v2.Public.Handshake({
      Body: { config: config as any, href },
    })().then((response: any) => {
      log.info('handshake response %O', response);
      if (response._tag === 'Right') {
        sendResponse(response.right);
      } else {
        // TODO: handle error here
        sendResponse(response.left);
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
