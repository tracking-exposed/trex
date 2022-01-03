import * as t from 'io-ts';

export const Nature = t.union([
  t.type({
    type: t.literal('foryou'),
  }),
  t.type({
    type: t.literal('following'),
  }),
  t.type({
    type: t.literal('video'),
    videoId: t.string,
    authorId: t.string,
  }),
  t.type({
    type: t.literal('creator'),
    creatorName: t.string,
  }),
  t.type({
    type: t.literal('search'),
    query: t.string,
    timestamp: t.string,
  }),
], 'Nature');

export type Nature = t.TypeOf<typeof Nature>;

export default Nature;
