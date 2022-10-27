import { ProfileMetadata } from '@tktrex/shared/models/metadata/ProfileMetadata';
import * as t from 'io-ts';

const { supporter, ...metadataBaseProps } = ProfileMetadata.types[0].props;
export const ProfileMetadataDB = t.strict(
  {
    ...metadataBaseProps,
    ...ProfileMetadata.types[1].props,
    ...ProfileMetadata.types[2].props,
    ...ProfileMetadata.types[3].props,
    _id: t.any,
    publicKey: t.string,
  },
  'ProfileMetadataDB'
);
export type ProfileMetadataDB = t.TypeOf<typeof ProfileMetadataDB>;
