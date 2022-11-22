import * as t from 'io-ts';
import { ForYouN } from '../Nature';
import { Author } from './Author';
import { TKMetadataBase } from './MetadataBase';
import { Metrics } from './Metrics';
import { Music } from './Music';

export const ForYouMetadata = t.intersection(
  [
    TKMetadataBase,
    ForYouN,
    t.type({ nature: ForYouN }),
    t.type(
      {
        // baretext is the smallest part of the description,
        // not including the tags
        baretext: t.union([t.string, t.undefined]),

        // description is the whole text written below the video,
        // including the tags
        description: t.union([t.string, t.undefined]),

        author: t.union([Author, t.undefined]),
        music: t.union([Music, t.undefined]),
        // the hashtags, with their leading #
        // note: they do not seem to be cleaned at the moment,
        // some have trailing whitespace
        hashtags: t.array(t.string),
        metrics: Metrics,
      },
      'foryou',
    ),
  ],
  'ForYouMetadata',
);

export type ForYouMetadata = t.TypeOf<typeof ForYouMetadata>;
