import * as t from 'io-ts';

export const TKHeaders = t.type(
  {
    'X-Tktrex-Version': t.string,
    'X-Tktrex-Build': t.string,
    'X-Tktrex-PublicKey': t.string,
    'X-Tktrex-Signature': t.string,
  },
  'TKHeaders',
);

export type TKHeaders = t.TypeOf<typeof TKHeaders>;
