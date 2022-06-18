import * as t from 'io-ts';

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
