import * as t from 'io-ts';

export const PublicKeyParams = t.type(
  { publicKey: t.string },
  'PublicKeyParams'
);
export type PublicKeyParams = t.TypeOf<typeof PublicKeyParams>;
