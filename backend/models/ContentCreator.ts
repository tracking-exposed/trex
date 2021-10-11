import * as t from 'io-ts';

export const ContentCreator = t.strict(
  {
    id: t.string,
    channelId: t.string,
    username: t.string,
    avatar: t.string,
    verified: t.boolean
  },
  'ContentCreator'
);

export type ContentCreator = t.TypeOf<typeof ContentCreator>;
