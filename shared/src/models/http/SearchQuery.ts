import * as t from "io-ts";
import { DateFromISOString } from "io-ts-types/lib/DateFromISOString";

export const SearchQuery = t.partial(
  {
    amount: t.number,
    skip: t.number,
    date: DateFromISOString,
    endDate: DateFromISOString,
  },
  "SearchQuery"
);
export type SearchQuery = t.TypeOf<typeof SearchQuery>;
