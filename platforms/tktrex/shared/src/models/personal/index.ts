import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';
import MetaData from '../MetaData';
import {Supporter} from '@shared/models/Supporter';

export const PersonalVideoFeed = t.strict(
  {
    id: t.string,
    savingTime: DateFromISOString,
  },
  'PersonalVideoFeed',
);

export type PersonalVideoFeed = t.TypeOf<typeof PersonalVideoFeed>;

export const PersonalVideoList = t.strict(
  {
    total: t.number,
    stripped: t.number,
    content: t.array(PersonalVideoFeed),
  },
  'PersonalVideoList',
);

export type PersonalVideoList = t.TypeOf<typeof PersonalVideoList>;

/**
 * Personal data
 */
export const PersonalData = t.strict({
  supporter: Supporter,
  metadata: t.array(MetaData),
}, 'PersonalData');

export type PersonalData = t.TypeOf<typeof PersonalData>
