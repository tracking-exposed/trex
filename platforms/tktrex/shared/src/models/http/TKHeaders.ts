import * as t from 'io-ts';
import _ from 'lodash';

export const TKHeaders = t.type(
  {
    'Content-Length': t.any,
    'X-Tktrex-Version': t.string,
    'X-Tktrex-Build': t.string,
    'X-Tktrex-PublicKey': t.string,
    'X-Tktrex-Signature': t.string,
  },
  'TKHeaders',
);

export type TKHeaders = t.TypeOf<typeof TKHeaders>;

// when the headers are received on the backend they get lowercased
// and so we derive a "lower case" (LC) codec from `TKHeaders`
const tkHeadersLCProps = {
  ...Object.entries(TKHeaders.props).reduce(
    (acc, [key, codec]) => ({
      ...acc,
      [_.toLower(key)]: codec,
    }),
    {},
  ),
};

export const TKHeadersLC = t.type(tkHeadersLCProps, 'TKHeadersLC');

export type TKHeadersLC = t.TypeOf<typeof TKHeadersLC>;
