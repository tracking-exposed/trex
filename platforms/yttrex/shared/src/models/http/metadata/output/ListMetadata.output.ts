import * as t from 'io-ts';
import { MetadataList } from '../../../metadata/Metadata';
import { NatureType } from '../../../Nature';

export const ListMetadataResponse = t.strict(
  {
    data: MetadataList,
    totals: t.record(NatureType, t.number),
  },
  'ListMetadataResponse'
);
export type ListMetadataResponse = t.TypeOf<typeof ListMetadataResponse>;
