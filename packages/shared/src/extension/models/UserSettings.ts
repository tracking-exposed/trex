import * as t from 'io-ts';

export const UserSettings = t.type(
  {
    active: t.boolean,
    publicKey: t.string,
    secretKey: t.string,
    ux: t.boolean,
    researchTag: t.union([t.string, t.undefined]),
    experimentId: t.union([t.string, t.undefined]),
  },
  'UserSettings'
);

export type UserSettings = t.TypeOf<typeof UserSettings>;

export default UserSettings;
