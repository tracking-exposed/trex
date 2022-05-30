import * as t from 'io-ts';

export const ComparisonDirectiveType = t.literal('comparison');

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
