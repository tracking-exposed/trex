import { Video } from '@backend/models/Video';
import * as t from 'io-ts';

export const Keypair = t.strict(
  {
    publicKey: t.string,
    secretKey: t.string,
  },
  'AccountKeys'
);

export type Keypair = t.TypeOf<typeof Keypair>;

/**
 * Account Settings
 *
 */
export const Settings = t.strict(
  {
    active: t.boolean,
    enhanceYouTubeExperience: t.boolean,
    independentContributions: t.strict({
      enable: t.boolean,
      showUI: t.boolean,
    }),
    svg: t.boolean,
    videorep: t.boolean,
    playhide: t.boolean,
    alphabeth: t.boolean,
    edit: t.union([Video, t.null]),
  },
  'AccountSettings'
);

export const getDefaultSettings = (): Settings => ({
  active: true,
  enhanceYouTubeExperience: true,
  svg: false,
  videorep: true,
  playhide: false,
  alphabeth: false,
  independentContributions: { enable: true, showUI: false },
  edit: null,
});

export type Settings = t.TypeOf<typeof Settings>;
