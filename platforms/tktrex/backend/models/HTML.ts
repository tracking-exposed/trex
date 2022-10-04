import { HTML as BaseHTML } from '@tktrex/shared/models/http/HTML';
import * as t from 'io-ts';

export const HTML = t.intersection(
  [
    BaseHTML,
    t.type({
      _id: t.string,
      publicKey: t.string,
    }),
  ],
  'HTML'
);

export type HTML = t.TypeOf<typeof HTML>
