import { propsOmit } from '@shared/utils/arbitrary.utils';
import { SearchMetadata } from '@yttrex/shared/models/Metadata';
import * as t from 'io-ts';
import { date } from 'io-ts-types/lib/date';

const searchMetadataProps = propsOmit(SearchMetadata, ['supporter']);
export const SearchMetadataDB = t.strict(
  {
    ...searchMetadataProps,
    publicKey: t.string,
    savingTime: date,
    clientTime: date,
  },
  'SearchMetadata'
);

export type SearchMetadataDB = t.TypeOf<typeof SearchMetadataDB>;
