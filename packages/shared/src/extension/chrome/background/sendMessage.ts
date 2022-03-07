import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { isLeft } from 'fp-ts/lib/Either';

import log from '../../logger';
import { Message, ServerLookup } from '../../models/Message';
import { UserSettings } from '../../models/UserSettings';
import { ServerLookupResponse } from '../../models/ServerLookupResponse';

const bo = chrome;

const ifValid =
  <C extends t.Any>(codec: C) =>
  (cb: (x: t.TypeOf<C>) => void) =>
  (x: unknown): void => {
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
  cb: (response: ServerLookupResponse) => void
): void =>
  sendMessage(
    {
      type: 'ServerLookup',
      payload,
    },
    ifValid(ServerLookupResponse)(cb)
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
