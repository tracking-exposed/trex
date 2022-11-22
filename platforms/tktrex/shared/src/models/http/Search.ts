import * as t from 'io-ts';
import { What, Format } from '@shared/models/common';

export const GetSearchByQueryInputParams = t.type(
  {
    query: What,
    format: Format,
  },
  'GetSearchByQueryInputParams',
);

export type GetSearchByQueryInputParams = t.TypeOf<
  typeof GetSearchByQueryInputParams
>;

export const GetSearchByQueryOutput = t.type(
  {
    total: t.number,
    content: t.array(t.any),
  },
  'GetSearchByQueryOutput',
);
export type GetSearchByQueryOutput = t.TypeOf<typeof GetSearchByQueryOutput>;

export const GetQueryListOutput = t.type({}, 'GetQueryListOutput');
export type GetQueryListOutput = t.TypeOf<typeof GetQueryListOutput>;
