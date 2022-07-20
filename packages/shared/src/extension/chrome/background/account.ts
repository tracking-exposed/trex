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
const DEFAULT_SETTINGS = {
  active: true,
  ux: false,
  researchTag: undefined,
  experimentId: undefined,
};

/**
 * Create publicKey and secretKey
 */
export function initializeKey(): KeyPair {
  // use publicKey and secretKey from process.env when available
  if (process.env.PUBLIC_KEY && process.env.SECRET_KEY) {
    log.info(
      'Found PUBLIC and SECRET keys in envrionment, returning those and skipping generation %j',
      process.env
    );
    return {
      publicKey: process.env.PUBLIC_KEY,
      secretKey: process.env.SECRET_KEY,
    };
  }
  const newKeypair = nacl.sign.keyPair();
  const publicKey = bs58.encode(newKeypair.publicKey);
  const secretKey = bs58.encode(newKeypair.secretKey);
  const rv = { publicKey, secretKey };
  log.info('initializing new key pair:', rv);
  return rv;
}

interface WithUserId {
  userId: string;
}

const readOrDefault = async (
  fn: string,
  codec: any,
  defaults: any
): Promise<any> => {
  try {
    const result = await file.readJSON(fn, codec);

    return {
      ...defaults,
      ...result,
    };
  } catch (err) {
    log.info('Error caught while checking settings.json: %s', err);
    return defaults;
  }
};

async function handleLocalLookup(
  { userId }: WithUserId,
  sendResponse: (response: Partial<UserSettings>) => void
): Promise<void> {
  let settings = await readOrDefault(
    'settings.json',
    t.partial(UserSettings.props),
    DEFAULT_SETTINGS
  );

  const experimentInfo = await readOrDefault('experiment.json', t.any, {
    researchTag: undefined,
    experimentId: undefined,
  });

  try {
    if (!(settings.publicKey?.length && settings.secretKey?.length))
      throw new Error('Invalid key material found in settings.json');

    log.info('Loaded configuration from file settings.json: %j', settings);
    await db.set(userId, { ...settings, ...experimentInfo });
  } catch (err) {
    log.info('Error caught while checking settings.json: %s', err);
  }

  try {
    settings = await db.getValid(UserSettings)(userId);
    log.info('Loaded correctly settings from localStorage %j', settings);
  } catch (err) {
    const initialSettings: UserSettings = {
      ...initializeKey(),
      ...DEFAULT_SETTINGS,
    };
    settings = await db.set(userId, initialSettings);
  }

  return sendResponse(settings);
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
