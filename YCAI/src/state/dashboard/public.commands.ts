import { HandshakeBody } from '@trex/shared/models/HandshakeBody';
import { command } from 'avenger';
import * as TE from 'fp-ts/lib/TaskEither';
import { setItem } from '@trex/shared/providers/localStorage.provider';
import * as sharedConst from '@trex/shared/constants';
import { Settings } from '../../models/Settings';
import { API } from '../../api';
import { profile } from './creator.queries';
import { keypair, settings, settingsRefetch } from './public.queries';

export const handshake = command((handshake: HandshakeBody) =>
  API.v3.Public.Handshake({ Body: handshake })
);

// todo:
export const generateKeypair = command(() => TE.right({}), {
  keypair,
});
// todo:
export const deleteKeypair = command(() => TE.right({}), {
  keypair,
});

export const updateSettings = command(
  (payload: Settings) => TE.fromIO(setItem(sharedConst.SETTINGS_KEY, payload)),
  { keypair, settings, settingsRefetch }
);

export const deleteProfile = command(
  () => TE.fromIO(setItem(sharedConst.CONTENT_CREATOR, null)),
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
  settings: settingsRefetch,
});
