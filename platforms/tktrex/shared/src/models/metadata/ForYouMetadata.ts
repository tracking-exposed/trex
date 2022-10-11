import * as t from 'io-ts';
import { ForYouN } from '../Nature';
import { Author } from './Author';
import { MetadataBase } from './MetadataBase';
import { Metrics } from './Metrics';
import { Music } from './Music';

export const ForYouVideoMetadata = t.intersection(
  [
    MetadataBase,
    ForYouN,
    t.type({ nature: ForYouN }),
    t.type(
      {
        // baretext is the smallest part of the description,
        // not including the tags
        baretext: t.string,

        // description is the whole text written below the video,
        // including the tags
        description: t.string,

        author: Author,
        music: Music,
        // the hashtags, with their leading #
        // note: they do not seem to be cleaned at the moment,
        // some have trailing whitespace
        hashtags: t.array(t.string),
        metrics: Metrics,
      },
      'foryou',
    ),
  ],
  'ForYouVideoMetadata',
);

export type ForYouVideoMetadata = t.TypeOf<typeof ForYouVideoMetadata>;
