import { Video } from '@backend/models/Video';
import * as t from 'io-ts';

export const AccountKeys = t.strict(
  {
    publicKey: t.string,
    secretKey: t.string,
  },
  'AccountKeys'
);

export type AccountKeys = t.TypeOf<typeof AccountKeys>;

/**
 * Account Settings
 *
 */
export const Settings = t.intersection(
  [
    AccountKeys,
    t.strict({
      channelCreatorId: t.union([t.string, t.null]),
      active: t.boolean,
      ccRecommendations: t.boolean,
      communityRecommendations: t.boolean,
      stats: t.boolean,
      svg: t.boolean,
      videorep: t.boolean,
      playhide: t.boolean,
      alphabeth: t.boolean,
      ux: t.boolean,
      edit: t.union([Video, t.null]),
    }),
  ],
  'AccountSettings'
);

export type Settings = t.TypeOf<typeof Settings>;
