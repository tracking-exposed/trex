import * as t from 'io-ts';
import { HashtagsN } from '../Nature';
import { TKMetadataBase } from './MetadataBase';

export const HashtagMetadata = t.intersection(
  [TKMetadataBase, HashtagsN, t.type({ nature: HashtagsN })],
  'HashtagMetadata',
);
export type HashtagMetadata = t.TypeOf<typeof HashtagMetadata>;
