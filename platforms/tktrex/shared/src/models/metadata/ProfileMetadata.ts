import * as t from 'io-ts';
import { NativeVideoN, ProfileN } from '../Nature';
import { MetadataBase } from './MetadataBase';

export const ProfileResult = t.type(
  {
    order: t.number,
    video: NativeVideoN,
    views: t.union([t.string, t.undefined]),
    textdesc: t.union([t.string, t.undefined]),
    thumbnail: t.union([t.string, t.undefined]),
    publishingDate: t.union([t.string, t.undefined]),
    title: t.union([t.string, t.undefined]),
  },
  'SearchMetadataResult',
);

export type ProfileResult = t.TypeOf<typeof ProfileResult>;

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
