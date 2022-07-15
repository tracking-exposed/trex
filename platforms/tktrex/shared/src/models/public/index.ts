import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';


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

export const GetSearchByQueryOutput = t.array(t.any, 'GetSearchByQueryOutput');
export type GetSearchByQueryOutput = t.TypeOf<typeof GetSearchByQueryOutput>;

export const GetQueryListOutput = t.type(
  {
    total: t.number,
    content: t.array(t.any),
  },
  'GetQueryListOutput',
);
export type GetQueryListOutput = t.TypeOf<typeof GetQueryListOutput>;
