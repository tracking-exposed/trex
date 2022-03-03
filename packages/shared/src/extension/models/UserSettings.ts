import * as t from 'io-ts';

export const UserSettings = t.type(
  {
    active: t.boolean,
    publicKey: t.string,
    secretKey: t.string,
    ux: t.boolean,
  },
  'UserSettings'
);

export type UserSettings = t.TypeOf<typeof UserSettings>;

export default UserSettings;
