import * as t from 'io-ts';
import { FollowingN } from '../Nature';
import { Author } from './Author';
import { TKMetadataBase } from './MetadataBase';
import { Metrics } from './Metrics';
import { Music } from './Music';

export const FollowingVideoMetadata = t.intersection(
  [
    TKMetadataBase,
    FollowingN,
    t.type({ nature: FollowingN }),
    t.type(
      {
        author: t.union([Author, t.undefined]),
        music: t.union([Music, t.undefined]),
        metrics: t.union([Metrics, t.undefined]),
      },
      'following',
    ),
  ],
  'FollowingVideoMetaData',
);

export type FollowingVideoMetadata = t.TypeOf<typeof FollowingVideoMetadata>;
