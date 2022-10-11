import * as t from 'io-ts';
import { NativeVideoN, ProfileN } from '../Nature';
import { MetadataBase } from './MetadataBase';

export const ProfileResult = t.type(
  {
    order: t.number,
    video: NativeVideoN,
    views: t.string,
    title: t.string,
  },
  'SearchMetadataResult',
);

export const ProfileMetadata = t.intersection(
  [
    MetadataBase,
    ProfileN,
    t.type({ nature: ProfileN }),
    t.type({
      results: t.array(ProfileResult),
    }),
  ],
  'ProfileMetadata',
);
export type ProfileMetadata = t.TypeOf<typeof ProfileMetadata>;
