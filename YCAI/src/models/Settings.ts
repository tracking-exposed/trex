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
    enable: false,
    showUI: process.env.NODE_ENV === 'development',
  },
});

export type Settings = t.TypeOf<typeof Settings>;

export const OptInNudgeStatus = t.strict({
  showNudgeTimes: t.array(t.number),
}, 'OptInNudgeStatus');

export type OptInNudgeStatus = t.TypeOf<typeof OptInNudgeStatus>;

export const getInitialOptInNudgeStatus = (): OptInNudgeStatus => ({
  showNudgeTimes: [
    Date.now() + 1000 * 60 * 15,            // 15 minutes from now
    Date.now() + 1000 * 60 * 60 * 24 * 7,   // 1 week from now
    Date.now() + 1000 * 60 * 60 * 24 * 7,   // 2 weeks from now
    Date.now() + 1000 * 60 * 60 * 24 * 30,  // 1 month from now
    Date.now() + 1000 * 60 * 60 * 24 * 365, // 2 months from now
  ],
});
