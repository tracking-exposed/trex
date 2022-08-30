import * as t from 'io-ts';
import { HTML as BaseHTML } from '@shared/models/HTML';
import { Nature } from '@tktrex/shared/models/Nature';

export const HTML = t.intersection(
  [
    BaseHTML,
    Nature,
    t.strict({
      geoip: t.union([t.string, t.undefined], 'GeoIP'),
    }),
  ],
  'HTML'
);

export type HTML = t.TypeOf<typeof HTML>;
