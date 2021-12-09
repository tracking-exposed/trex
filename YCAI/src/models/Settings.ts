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
    enhanceYouTubeExperience: t.boolean,
    independentContributions: t.strict({
      enable: t.boolean,
      showUI: t.boolean,
    }),
  },
  'AccountSettings'
);

export const getDefaultSettings = (): Settings => ({
  enhanceYouTubeExperience: true,
  independentContributions: {
    enable: true,
    showUI: process.env.NODE_ENV === 'development',
  },
});

export type Settings = t.TypeOf<typeof Settings>;
