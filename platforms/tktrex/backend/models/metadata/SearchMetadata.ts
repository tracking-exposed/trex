import { SearchMetadata } from '@tktrex/shared/models/metadata/SearchMetadata';
import * as t from 'io-ts';

const { supporter, ...metadataBaseProps } = SearchMetadata.types[0].props;
export const SearchMetadataDB = t.strict(
  {
    ...metadataBaseProps,
    ...SearchMetadata.types[1].type.props,
    ...SearchMetadata.types[2].props,
    ...SearchMetadata.types[3].props,
    _id: t.any,
    publicKey: t.string,
  },
  'SearchMetadataDB'
);
export type SearchMetadataDB = t.TypeOf<typeof SearchMetadataDB>;
