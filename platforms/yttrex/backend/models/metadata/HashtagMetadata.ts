import {
  HashtagMetadata
} from '@yttrex/shared/models/metadata/Metadata';
import * as t from 'io-ts';
import { date } from 'io-ts-types/lib/date';

const { supporter, ...homeMetadataProps } = HashtagMetadata.type.props;
export const HashtagMetadataDB = t.type(
  {
    ...homeMetadataProps,
    _id: t.any,
    publicKey: t.string,
    savingTime: date,
    clientTime: date,
  },
  'HashtagMetadataDB'
);
export type HashtagMetadataDB = t.TypeOf<typeof HashtagMetadataDB>;
