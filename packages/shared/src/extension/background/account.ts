import bs58 from 'bs58';
import * as t from 'io-ts';
import nacl from 'tweetnacl';
import { HandshakeResponse } from '../../models/HandshakeBody';
import db from '../db';
import file from '../file';
import log from '../logger';
import { ServerLookup, LocalLookup } from '../models/Message';
import UserSettings from '../models/UserSettings';
import { LoadOpts } from './sync';

export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

export const FIXED_USER_NAME = 'local';

// defaults of the settings stored in 'config' and controlled by popup
const DEFAULT_SETTINGS = {
  active: true,
  ux: false,
};

/**
 * Create publicKey and secretKey
 */
export function initializeKey(): KeyPair {
  // use publicKey and secretKey from process.env when available
  if (process.env.PUBLIC_KEY && process.env.SECRET_KEY) {
    log.info(
      'Found PUBLIC and SECRET keys in environment, returning those and skipping generation %j',
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
  log.info('initializing new key pair: %O', rv);
  return rv;
}

interface WithUserId {
  userId: string;
}

const readOrDefault = async <T extends t.Mixed>(
  fn: string,
  codec: T,
  defaults: any
): Promise<T['_O']> => {
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

/**
 * Load settings from `settings.json`
 */
export async function handleSettingsLookup(
  { userId }: WithUserId,
  sendResponse: (response: Partial<UserSettings>) => void
): Promise<void> {
  const settingsJson = await readOrDefault(
    'settings.json',
    t.partial(UserSettings.props),
    DEFAULT_SETTINGS
  );

  log.info('Loaded configuration from file settings.json: %j', settingsJson);

  const experimentInfo = await readOrDefault('experiment.json', t.any, {});

  log.info(
    'Loaded experiment info from file experiment.json: %j',
    settingsJson
  );

  const settings = { ...DEFAULT_SETTINGS, ...settingsJson, ...experimentInfo };

  return sendResponse(settings);
}

/**
 * Get settings from chrome.storage
 *
 * Then `publicKey` and `secretKey` creation is defined by the variable `initKeys`.
 */
export async function handleLocalLookup(
  { userId }: LocalLookup['payload'],
  sendResponse: (response: Partial<UserSettings>) => void
): Promise<void> {
  let settings;
  try {
    settings = await db.getValid(t.partial(UserSettings.props))(userId);
    log.info('Loaded correctly settings from localStorage %j', settings);
  } catch (err) {
    log.info('Settings in db is not well formed %O', err);

    const initialSettings: Partial<UserSettings> = {
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
 */
export const handleServerLookup =
  (opts: LoadOpts) =>
  async (
    { href, ...config }: ServerLookup['payload'],
    sendResponse: (response: HandshakeResponse) => void
  ): Promise<void> => {
    log.info('handshake body %O', config);
    void opts.api.v2.Public.Handshake({
      Body: { config, href },
    } as any)().then((response: any) => {
      log.info('handshake response %O', response);
      if (response._tag === 'Right') {
        sendResponse(response.right);
      } else {
        // TODO: handle error here
        sendResponse(response.left);
      }
    });
  };

export async function handleConfigUpdate(
  payload: Partial<UserSettings>,
  sendResponse: (response: Partial<UserSettings>) => void
): Promise<void> {
  const userId = FIXED_USER_NAME;
  const settings = await db.update(userId, payload);
  log.info('completed ConfigUpdate, user settings now', settings);
  sendResponse(settings);
}
