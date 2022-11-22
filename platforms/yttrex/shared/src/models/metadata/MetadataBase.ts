import { MetadataBase } from '@shared/models/MetadataBase';
import * as t from 'io-ts';

export const YTMetadataBase = t.strict(
  {
    ...MetadataBase.props,
  },
  'MetadataBase'
);
export type YTMetadataBase = t.TypeOf<typeof YTMetadataBase>;
