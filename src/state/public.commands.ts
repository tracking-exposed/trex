import { HandshakeBody } from '@backend/models/HandshakeBody';
import { command } from 'avenger';
import { Messages } from '../models/Messages';
import { Settings } from '../models/Settings';
import { API } from '../providers/api.provider';
import { sendMessage } from '../providers/browser.provider';
import { keypair, settings } from './public.queries';

export const handshake = command((handshake: HandshakeBody) =>
  API.Public.Handshake({ Body: handshake })
);

export const generateKeypair = command(
  () => sendMessage(Messages.GenerateKeypair)(),
  {
    keypair,
  }
);

export const deleteKeypair = command(
  () => sendMessage(Messages.DeleteKeypair)(),
  {
    keypair,
  }
);

export const updateSettings = command(
  (payload: Settings) => sendMessage(Messages.UpdateSettings)(payload),
  { settings, keypair }
);
