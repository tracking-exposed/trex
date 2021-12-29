import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { isLeft } from 'fp-ts/lib/Either';

import log from '../../logger';
import { Message } from '../../models/Message';
import { UserSettings } from '../../models/UserSettings';

const bo = chrome;

const ifValid = <C extends t.Any>(
  codec: C,
  cb: (x: t.TypeOf<C>) => void,
) => (x: unknown): void => {
    const v = codec.decode(x);

    if (isLeft(v)) {
      log.error(PathReporter.report(v));
    } else {
      cb(v.right);
    }
  };

// this method doesn't do much, but it forces me
// to send messages to the background using
// the correct message type
const sendMessage = (
  message: Message,
  cb: (response: unknown) => void,
): void => bo.runtime.sendMessage(message, cb);

export const localLookup = (
  cb: ((userSettings: UserSettings) => void),
): void => sendMessage({
  type: 'LocalLookup',
  payload: {
    userId: 'local',
  },
}, ifValid(UserSettings, cb));

export interface ServerLookupPayload {
  feedId: string;
  href: string;
}

export const ServerLookupResponse = t.type({});

export type ServerLookupResponse = t.TypeOf<typeof ServerLookupResponse>;

export const serverLookup = (
  payload: ServerLookupPayload,
  cb: ((response: ServerLookupResponse) => void),
): void =>
  sendMessage({
    type: 'ServerLookup',
    payload,
  }, ifValid(ServerLookupResponse, cb));

export const configUpdate = (
  payload: Partial<UserSettings>,
  cb: ((response: UserSettings) => void),
): void =>
  sendMessage({
    type: 'ConfigUpdate',
    payload,
  }, ifValid(UserSettings, cb));
