/* eslint-disable node/no-callback-literal */
import { isLeft } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { HandshakeResponse } from '../../../models/HandshakeBody';
import log from '../../logger';
import { Message, ServerLookup } from '../../models/Message';
import { UserSettings } from '../../models/UserSettings';
import { bo } from '../../utils/browser.utils';

interface ErrorResponse {
  type: 'Error';
  error: Error;
}
interface SuccessResponse<T> {
  type: 'Success';
  result: T;
}

export type Response<T> = ErrorResponse | SuccessResponse<T>;

export type SendResponse<T> = (r: Response<T>) => void;

const ifValid =
  <C extends t.Any>(codec: C) =>
  (m: Message['type'], cb: SendResponse<t.TypeOf<C>>) =>
  (x: unknown): void => {
    log.debug('Check response is valid %O', x);
    const v = codec.decode(x);

    if (isLeft(v)) {
      const msg = `Error decoding backend response:\n${PathReporter.report(
        v
      ).join('\n')}`;
      log.error(msg);
      // eslint-disable-next-line n/no-callback-literal
      cb({
        type: 'Error',
        error: new Error(
          `Error during '${m}' on codec ${codec.name} validation \n\n`.concat(
            PathReporter.report(v).join('\n')
          )
        ),
      });
    } else {
      // eslint-disable-next-line n/no-callback-literal
      cb({ type: 'Success', result: v.right });
    }
  };

// this method doesn't do much, but it forces me
// to send messages to the background using
// the correct message type
const sendMessage = (message: Message, cb: (response: unknown) => void): void =>
  bo.runtime.sendMessage(message, cb);

export const settingsLookup = (cb: SendResponse<Partial<UserSettings>>): void =>
  sendMessage(
    {
      type: 'SettingsLookup',
      payload: {
        userId: 'local',
      },
    },
    ifValid(t.partial(UserSettings.props))('SettingsLookup', cb)
  );

export const partialLocalLookup = (
  cb: SendResponse<Partial<UserSettings>>
): void =>
  sendMessage(
    {
      type: 'LocalLookup',
      payload: {
        userId: 'local',
      },
    },
    ifValid(t.partial(UserSettings.props))('LocalLookup', cb)
  );

export const localLookup = (
  initKeys: boolean,
  cb: SendResponse<UserSettings>
): void =>
  sendMessage(
    {
      type: 'LocalLookup',
      payload: {
        userId: 'local',
      },
    },
    ifValid(UserSettings)('LocalLookup', cb)
  );

export const serverLookup = (
  payload: ServerLookup['payload'],
  cb: SendResponse<HandshakeResponse>
): void =>
  sendMessage(
    {
      type: 'ServerLookup',
      payload,
    },
    ifValid(HandshakeResponse)('ServerLookup', cb)
  );

export const configUpdate = (
  payload: Partial<UserSettings>,
  cb: SendResponse<UserSettings>
): void =>
  sendMessage(
    {
      type: 'ConfigUpdate',
      payload,
    },
    ifValid(UserSettings)('ConfigUpdate', cb)
  );
