import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';

// still a copy from YT to be converted
export const What = t.union(
  [t.literal('foryou'), t.literal('following'), t.literal('search')],
  'What',
);

export type What = t.TypeOf<typeof What>;

export const Format = t.union([t.literal('csv'), t.literal('json')], 'Format');
export type Format = t.TypeOf<typeof Format>;

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

export const PublicListItem = t.strict(
  {
    id: t.string,
  },
  'PublicListItem',
);
export type PublicListItem = t.TypeOf<typeof PublicListItem>;

export const PublicSearchList = t.strict(
  {
    total: t.number,
    stripped: t.number,
    content: t.array(PublicListItem),
  },
  'PublicSearchList',
);

export type PublicSearchList = t.TypeOf<typeof PublicSearchList>;

export const GetSearchByQueryOutput = t.type({}, 'GetSearchByQueryOutput');
export type GetSearchByQueryOutput = t.TypeOf<typeof GetSearchByQueryOutput>;

export const GetQueryListOutput = t.type({}, 'GetQueryListOutput');
export type GetQueryListOutput = t.TypeOf<typeof GetQueryListOutput>;
