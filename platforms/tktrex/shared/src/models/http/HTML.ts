import { HTML as BaseHTML } from '@shared/models/HTML';
import { Nature } from '../Nature';
import * as t from 'io-ts';

export const HTML = t.intersection(
  [
    BaseHTML,
    Nature,
    t.strict({
      nature: Nature,
      geoip: t.union([t.string, t.undefined], 'GeoIP'),
    }),
  ],
  'HTML',
);

export type HTML = t.TypeOf<typeof HTML>;
