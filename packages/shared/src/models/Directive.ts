import { pipe } from 'fp-ts/lib/function';
import * as R from 'fp-ts/lib/Record';
import * as t from 'io-ts';
import { DateFromISOString, nonEmptyArray } from 'io-ts-types';

export const ComparisonDirectiveType = t.literal('comparison');
export const SearchDirectiveType = t.literal('search');

export const DirectiveType = t.union(
  [ComparisonDirectiveType, SearchDirectiveType],
  'DirectiveType'
);
export type DirectiveType = t.TypeOf<typeof DirectiveType>;

export const ComparisonDirectiveRow = t.type(
  {
    title: t.string,
    url: t.string,
    urltag: t.string,
    watchFor: t.union([t.number, t.string, t.undefined]),
  },
  'ComparisonDirectiveRow'
);

export type ComparisonDirectiveRow = t.TypeOf<typeof ComparisonDirectiveRow>;

export const SearchDirectiveRow = t.type(
  {
    videoURL: t.string,
    title: t.string,
  },
  'SearchRow'
);
// todo: this should be named CreateExperimentBody
export const CreateDirectiveBody = t.union(
  [
    t.type({ parsedCSV: nonEmptyArray(ComparisonDirectiveRow) }),
    nonEmptyArray(SearchDirectiveRow),
  ],
  'CreateDirectiveBody'
);

const directiveKeysMap = pipe(
  { search: SearchDirectiveRow, comparison: ComparisonDirectiveRow },
  R.map((type) => nonEmptyArray(type))
);

export const DirectiveKeysMap = t.type(directiveKeysMap, 'DirectiveKeysMap');

export const PostDirectiveSuccessResponse = t.strict(
  {
    status: t.union([t.literal('exist'), t.literal('created')]),
    experimentId: t.string,
    since: t.union([DateFromISOString, t.undefined]),
  },
  'PostDirectiveSuccessResponse'
);

export type PostDirectiveSuccessResponse = t.TypeOf<
  typeof PostDirectiveResponse
>;

export const PostDirectiveResponse = t.union(
  [
    t.type({ error: t.type({ message: t.string }) }),
    PostDirectiveSuccessResponse,
  ],
  'PostDirectiveResponse'
);

export const ComparisonDirective = t.strict(
  {
    title: t.union([t.string, t.undefined]),
    url: t.string,
    urltag: t.union([t.string, t.undefined]),
    watchFor: t.union([t.number, t.string, t.undefined, t.null]),
  },
  'ComparisonDirective'
);
export type ComparisonDirective = t.TypeOf<typeof ComparisonDirective>;

export const SearchDirective = t.strict(
  {
    title: t.number,
    videoURL: t.string,
  },
  'SearchDirective'
);

export const Directive = t.union(
  [SearchDirective, ComparisonDirective],
  'Directive'
);

export type Directive = t.TypeOf<typeof Directive>;
