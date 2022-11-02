import * as t from 'io-ts';
import { SearchN } from '../Nature';
import { MetadataBase } from './MetadataBase';

export const SearchMetadata = t.strict(
  {
    ...MetadataBase.type.props,
    ...SearchN.type.props,
    correction: t.union([t.array(t.string), t.undefined]),
    results: t.array(
      t.strict({
        position: t.number,
        title: t.string,
      })
    ),
  },
  'SearchMetadata'
);
export type SearchMetadata = t.TypeOf<typeof SearchMetadata>;
