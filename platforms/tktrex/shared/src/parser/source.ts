import * as t from 'io-ts';
import { HTML } from '../models/http/HTML';
import { Supporter } from '@shared/models/Supporter';

export const HTMLSource = t.type(
  {
    html: HTML,
    supporter: Supporter,
  },
  'HTMLSource',
);
export type HTMLSource = t.TypeOf<typeof HTMLSource>;
