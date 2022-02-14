import * as t from 'io-ts';

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
    enable: false,
    showUI: process.env.NODE_ENV === 'development',
  },
});

export type Settings = t.TypeOf<typeof Settings>;
