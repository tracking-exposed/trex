import { MetadataBase } from '@shared/models/MetadataBase';
import * as t from 'io-ts';

export const TKMetadataBase = t.type(
  {
    ...MetadataBase.props,
    timelineId: t.string,
  },
  'TKMetadataBase',
);

export type TKMetadataBase = t.TypeOf<typeof TKMetadataBase>;
