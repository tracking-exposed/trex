import { NativeMetadata } from '@tktrex/shared/models/metadata/NativeMetadata';
import * as t from 'io-ts';

const { supporter, ...metadataBaseProps } = NativeMetadata.types[0].props;
export const NativeMetadataDB = t.strict(
  {
    ...metadataBaseProps,
    ...NativeMetadata.types[1].type.props,
    ...NativeMetadata.types[2].props,
    ...NativeMetadata.types[3].props,
    _id: t.any,
    publicKey: t.string,
  },
  'NativeMetadataDB'
);
export type NativeMetadataDB = t.TypeOf<typeof NativeMetadataDB>;
