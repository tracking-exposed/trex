import * as t from 'io-ts';
import { HashtagType } from '../Ad';
import { HashtagNatureType } from '../Nature';
import { YTMetadataBase } from './MetadataBase';

export const HashtagMetadata = t.strict(
  {
    ...YTMetadataBase.type.props,
    type: HashtagType,
    nature: HashtagNatureType,
  },
  'HashtagMetadata'
);

export type HashtagMetadata = t.TypeOf<typeof HashtagMetadata>;
