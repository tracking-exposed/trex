import { FollowingVideoMetadata } from '@tktrex/shared/models/metadata/FollowingMetadata';
import * as t from 'io-ts';

const { supporter, ...metadataBaseProps } =
  FollowingVideoMetadata.types[0].props;
export const FollowingVideoMetadataDB = t.strict(
  {
    ...metadataBaseProps,
    ...FollowingVideoMetadata.types[1].props,
    ...FollowingVideoMetadata.types[2].props,
    ...FollowingVideoMetadata.types[3].props,
    _id: t.any,
    publicKey: t.string,
  },
  'FollowingVideoMetadataDB'
);
export type FollowingVideoMetadataDB = t.TypeOf<
  typeof FollowingVideoMetadataDB
>;
