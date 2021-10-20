import { HandshakeBody } from '@backend/models/HandshakeBody';
import { command } from 'avenger';
import { DeleteKeypair, GenerateKeypair, UpdateSettings } from '../models/MessageRequest';
import { Settings } from '../models/Settings';
import { API } from '../providers/api.provider';
import { sendMessage } from '../providers/browser.provider';
import { keypair, settings } from './public.queries';

export const handshake = command((handshake: HandshakeBody) =>
  API.Public.Handshake({ Body: handshake })
);

export const generateKeypair = command(
  () => sendMessage({ type: GenerateKeypair.value }),
  {
    keypair,
  }
);

export const deleteKeypair = command(
  () => sendMessage({ type: DeleteKeypair.value }),
  {
    keypair,
  }
);

export const updateSettings = command(
  (payload: Settings) =>
    sendMessage({ type: UpdateSettings.value, payload: payload }),
  { settings, keypair }
);
