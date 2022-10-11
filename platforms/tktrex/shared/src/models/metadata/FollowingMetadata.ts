import * as t from 'io-ts';
import { FollowingN } from '../Nature';
import { Author } from './Author';
import { MetadataBase } from './MetadataBase';
import { Music } from './Music';

export const FollowingVideoMetadata = t.intersection(
  [
    MetadataBase,
    FollowingN,
    t.type({ nature: FollowingN }),
    t.type(
      {
        author: Author,
        music: Music,
      },
      'following',
    ),
  ],
  'FollowingVideoMetaData',
);

export type FollowingVideoMetadata = t.TypeOf<typeof FollowingVideoMetadata>;
