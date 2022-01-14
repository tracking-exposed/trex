import { pipe } from 'fp-ts/lib/function';
import * as R from 'fp-ts/lib/Record';
import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types';

export const ComparisonDirectiveType = t.literal('comparison');
export const ChiaroScuroDirectiveType = t.literal('chiaroscuro');

export const DirectiveType = t.union(
  [ComparisonDirectiveType, ChiaroScuroDirectiveType],
  'DirectiveType'
);
export type DirectiveType = t.TypeOf<typeof DirectiveType>;

export const ComparisonDirectiveRow = t.type(
  {
    title: t.string,
    url: t.string,
    urltag: t.string,
  },
  'ComparisonDirectiveRow'
);

export const ChiaroScuroDirectiveRow = t.type(
  {
    videoURL: t.string,
    title: t.string,
  },
  'ChiaroScuroDirectiveRow'
);
// todo: this should be named CreateExperimentBody
export const CreateDirectiveBody = t.type(
  {
    parsedCSV: t.union([
      t.array(ComparisonDirectiveRow),
      t.array(ChiaroScuroDirectiveRow),
    ]),
  },
  'CreateDirectiveBody'
);

const directiveKeysMap = pipe(
  { chiaroscuro: ChiaroScuroDirectiveRow, comparison: ComparisonDirectiveRow },
  R.map((type) => t.array(type))
);

export const DirectiveKeysMap = t.type(directiveKeysMap, 'DirectiveKeysMap');

export const PostDirectiveSuccessResponse = t.strict(
  {
    status: t.union([t.literal('exist'), t.literal('created')]),
    experimentId: t.string,
    since: DateFromISOString,
  },
  'PostDirectiveSuccessResponse'
);

export type PostDirectiveSuccessResponse = t.TypeOf<
  typeof PostDirectiveResponse
>;

export const PostDirectiveResponse = t.union([
  t.type({ error: t.type({ message: t.string }) }),
  PostDirectiveSuccessResponse,
]);

export const ComparisonDirective = t.strict(
  {
    title: t.union([t.string, t.undefined]),
    url: t.string,
  },
  'ComparisonDirective'
);

export const ChiaroScuroDirective = t.strict(
  {
    loadFor: t.number,
    url: t.string,
    watchFor: t.union([t.number, t.string, t.undefined]),
    name: t.string,
    targetVideoId: t.string,
  },
  'ChiaroScuroDirective'
);

export const Directive = t.union(
  [ComparisonDirective, ChiaroScuroDirective],
  'Directive'
);

export type Directive = t.TypeOf<typeof Directive>;
