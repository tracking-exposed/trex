import { HandshakeBody } from '@trex/shared/models/HandshakeBody';
import { command } from 'avenger';
import * as TE from 'fp-ts/lib/TaskEither';
import { Messages } from '../models/Messages';
import { Settings } from '../models/Settings';
import { API } from '../api';
import { sendMessage } from '../providers/browser.provider';
import { settings, settingsRefetch, keypair } from './popup.queries';

export const handshake = command((handshake: HandshakeBody) =>
  API.v3.Public.Handshake({ Body: handshake })
);

export const updateSettings = command(
  (payload: Settings) => sendMessage(Messages.UpdateSettings)(payload),
  { settings, settingsRefetch }
);

export const refreshSettings = command(() => TE.right(undefined), {
  settings: settingsRefetch,
});

export const generateKeypair = command(
  () => sendMessage(Messages.GenerateKeypair)(),
  {
    keypair,
  }
);
