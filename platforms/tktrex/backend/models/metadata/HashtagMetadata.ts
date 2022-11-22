import { HashtagMetadata } from '@tktrex/shared/models/metadata/HashtagMetadata';
import * as t from 'io-ts';

const { supporter, ...metadataBaseProps } = HashtagMetadata.types[0].props;
export const HashtagMetadataDB = t.strict(
  {
    ...metadataBaseProps,
    ...HashtagMetadata.types[1].props,
    ...HashtagMetadata.types[2].props,
    _id: t.any,
    publicKey: t.string,
  },
  'NativeMetadataDB'
);
export type HashtagMetadataDB = t.TypeOf<typeof HashtagMetadataDB>;
