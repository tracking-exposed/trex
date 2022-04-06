import { isLeft } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { HandshakeResponse } from '../../../models/HandshakeBody';
import log from '../../logger';
import { Message, ServerLookup } from '../../models/Message';
import { UserSettings } from '../../models/UserSettings';
import { bo } from '../../utils/browser.utils';

const ifValid =
  <C extends t.Any>(codec: C) =>
  (cb: (x: t.TypeOf<C>) => void) =>
  (x: unknown): void => {
    log.debug('Check response is valid %O', x);
    const v = codec.decode(x);

    if (isLeft(v)) {
      const msg = `Error decoding backend response:\n${PathReporter.report(
        v
      ).join('\n')}`;
      log.error(msg);
    } else {
      cb(v.right);
    }
  };

// this method doesn't do much, but it forces me
// to send messages to the background using
// the correct message type
const sendMessage = (message: Message, cb: (response: unknown) => void): void =>
  bo.runtime.sendMessage(message, cb);

export const localLookup = (cb: (userSettings: UserSettings) => void): void =>
  sendMessage(
    {
      type: 'LocalLookup',
      payload: {
        userId: 'local',
      },
    },
    ifValid(UserSettings)(cb)
  );

export const serverLookup = (
  payload: ServerLookup['payload'],
  cb: (response: HandshakeResponse) => void
): void =>
  sendMessage(
    {
      type: 'ServerLookup',
      payload,
    },
    ifValid(HandshakeResponse)(cb)
  );

export const configUpdate = (
  payload: Partial<UserSettings>,
  cb: (response: UserSettings) => void
): void =>
  sendMessage(
    {
      type: 'ConfigUpdate',
      payload,
    },
    ifValid(UserSettings)(cb)
  );
