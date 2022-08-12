import * as t from 'io-ts';

export const YTHeaders = t.type(
  {
    'X-YTtrex-Version': t.string,
    'X-YTtrex-Build': t.string,
    'X-YTtrex-PublicKey': t.string,
    'X-YTtrex-Signature': t.string,
  },
  'YTHeaders'
);

export type YTHeaders = t.TypeOf<typeof YTHeaders>;
