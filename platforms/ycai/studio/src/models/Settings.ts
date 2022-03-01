import * as t from 'io-ts';
import {
  Settings,
  getDefaultSettings,
} from '@shared/models/extension/Settings';

export const OptInNudgeStatus = t.strict(
  {
    showNudgeTimes: t.array(t.number),
  },
  'OptInNudgeStatus'
);

export type OptInNudgeStatus = t.TypeOf<typeof OptInNudgeStatus>;

export const getInitialOptInNudgeStatus = (): OptInNudgeStatus => ({
  showNudgeTimes: [
    Date.now() + 1000 * 60 * 15, // 15 minutes from now
    Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week from now
    Date.now() + 1000 * 60 * 60 * 24 * 7, // 2 weeks from now
    Date.now() + 1000 * 60 * 60 * 24 * 30, // 1 month from now
    Date.now() + 1000 * 60 * 60 * 24 * 365, // 2 months from now
  ],
});

export { Settings, getDefaultSettings };
