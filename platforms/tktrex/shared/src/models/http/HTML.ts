import { HTML as BaseHTML } from '@shared/models/HTML';
import { Nature } from '../Nature';
import * as t from 'io-ts';

const { counters, ...baseHTMLProps } = BaseHTML.types[0].type.props;
const TKBaseHTML = t.type({ ...baseHTMLProps }, 'TKBaseHTML');
export const HTML = t.intersection(
  [
    TKBaseHTML,
    BaseHTML.types[1],
    Nature,
    t.strict({
      timelineId: t.string,
      nature: Nature,
      rect: t.any,
      geoip: t.union(
        [
          t.type({
            country: t.string,
            city: t.string,
          }),
          t.undefined,
        ],
        'GeoIP'
      ),
    }),
  ],
  'HTML'
);

export type HTML = t.TypeOf<typeof HTML>;
