import * as t from 'io-ts';


export const UserSettings = t.type({
  publicKey: t.string,
  active: t.boolean,
  ux: t.boolean,
}, 'UserSettings');

export type UserSettings = t.TypeOf<typeof UserSettings>;

export default UserSettings;
