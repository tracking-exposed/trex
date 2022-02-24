import { HandshakeBody } from '@shared/models/HandshakeBody';
import { command } from 'avenger';
import * as TE from 'fp-ts/lib/TaskEither';
import { Messages, browser } from '../../providers/browser.provider';
import { Settings } from '../../models/Settings';
import { settings, settingsRefetch, keypair, API } from './popup.queries';

export const handshake = command((handshake: HandshakeBody) =>
  API.v3.Public.Handshake({ Body: handshake })
);

export const updateSettings = command(
  (payload: Settings) => browser.sendMessage(Messages.UpdateSettings)(payload),
  { settings, settingsRefetch }
);

export const refreshSettings = command(() => TE.right(undefined), {
  settings: settingsRefetch,
});

export const generateKeypair = command(
  () => browser.sendMessage(Messages.GenerateKeypair)(),
  {
    keypair,
  }
);
