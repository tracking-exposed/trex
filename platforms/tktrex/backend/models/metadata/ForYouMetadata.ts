import { ForYouVideoMetadata } from '@tktrex/shared/models/metadata/ForYouMetadata';
import * as t from 'io-ts';

const { supporter, ...metadataBaseProps } = ForYouVideoMetadata.types[0].props;
export const ForYouVideoMetadataDB = t.strict(
  {
    ...metadataBaseProps,
    ...ForYouVideoMetadata.types[1].type.props,
    ...ForYouVideoMetadata.types[2].props,
    ...ForYouVideoMetadata.types[3].props,
    _id: t.any,
    publicKey: t.string,
  },
  'ForYouVideoMetadataDB'
);
export type ForYouVideoMetadataDB = t.TypeOf<typeof ForYouVideoMetadataDB>;
