import * as t from 'io-ts';

export const Keypair = t.strict(
  {
    publicKey: t.string,
    secretKey: t.string,
  },
  'AccountKeys'
);

export type Keypair = t.TypeOf<typeof Keypair>;
