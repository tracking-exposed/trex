import * as t from 'io-ts';

/**
 * TikTok search directive
 */

export const SearchDirectiveType = t.literal('search');

export const SearchDirective = t.strict(
  {
    title: t.string,
    videoURL: t.string,
    url: t.string,
  },
  'SearchDirective',
);
export type SearchDirective = t.TypeOf<typeof SearchDirective>;
