import * as t from 'io-ts';
import { HashtagType } from '../Ad';
import { HashtagNatureType } from '../Nature';
import { MetadataBase } from './MetadataBase';

export const HashtagMetadata = t.strict(
  {
    ...MetadataBase.type.props,
    type: HashtagType,
    nature: HashtagNatureType,
  },
  'HashtagMetadata'
);

export type HashtagMetadata = t.TypeOf<typeof HashtagMetadata>;
