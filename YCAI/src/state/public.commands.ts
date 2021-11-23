import { HandshakeBody } from '@backend/models/HandshakeBody';
import { command } from 'avenger';
import * as TE from 'fp-ts/lib/TaskEither';
import { Messages } from '../models/Messages';
import { Settings } from '../models/Settings';
import { API } from '../providers/api.provider';
import { sendMessage } from '../providers/browser.provider';
import { profile } from './creator.queries';
import { keypair, settings, settingsRefetch } from './public.queries';

export const handshake = command((handshake: HandshakeBody) =>
  API.v3.Public.Handshake({ Body: handshake })
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
  { keypair, settings, settingsRefetch }
);

export const deleteProfile = command(
  () => sendMessage(Messages.UpdateContentCreator)(null),
  { profile }
);

export const downloadTXTFile = command(
  ({ name, data }: { name: string; data: any }) => {
    return TE.fromIO(() => {
      const downloadEl = document.createElement('a');
      downloadEl.download = name;
      const file = new Blob([data], {
        type: 'application/txt',
      });
      downloadEl.href = window.URL.createObjectURL(file);
      document.body.appendChild(downloadEl);
      downloadEl.click();
      document.body.removeChild(downloadEl);
    });
  }
);

export const refreshSettings = command(() => TE.right(undefined), {
  settings: settingsRefetch
})