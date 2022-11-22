import { ForYouMetadata } from '@tktrex/shared/models/metadata/ForYouMetadata';
import * as t from 'io-ts';

const { supporter, ...metadataBaseProps } = ForYouMetadata.types[0].props;
export const ForYouMetadataDB = t.strict(
  {
    ...metadataBaseProps,
    ...ForYouMetadata.types[1].type.props,
    ...ForYouMetadata.types[2].props,
    ...ForYouMetadata.types[3].props,
    _id: t.any,
    publicKey: t.string,
  },
  'ForYouMetadataDB'
);
export type ForYouMetadataDB = t.TypeOf<typeof ForYouMetadataDB>;
