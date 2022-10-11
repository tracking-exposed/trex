import * as t from 'io-ts';
import { NativeVideoN } from '../Nature';
import { Author } from './Author';
import { MetadataBase } from './MetadataBase';
import { Metrics } from './Metrics';
import { Music } from './Music';

export const NativeMetadata = t.intersection(
  [
    MetadataBase,
    NativeVideoN,
    t.type({ nature: NativeVideoN }, 'NativeMetadataType'),
    t.type(
      {
        description: t.union([t.string, t.undefined]),
        music: t.union([Music, t.undefined, t.null]),
        author: t.union([Author, t.undefined, t.null]),
        metrics: t.union([Metrics, t.undefined, t.null]),
        hashtags: t.union([t.array(t.string), t.null]),
      },
      'NativeMetadataProps',
    ),
  ],
  'NativeMetadata',
);

export type NativeMetadata = t.TypeOf<typeof NativeMetadata>;
