import { Format } from '@shared/models/common';
import * as t from 'io-ts';
import { NumberFromString } from 'io-ts-types/lib/NumberFromString';
import { NatureType } from '../../models/Nature';
import { Endpoint } from 'ts-endpoint';
import { MetadataList } from '../../models/Metadata';

export const ListMetadataResponse = t.strict(
  {
    data: MetadataList,
    totals: t.record(NatureType, t.number),
  },
  'ListMetadataResponse'
);
export type ListMetadataResponse = t.TypeOf<typeof ListMetadataResponse>;

const ListMetadata = Endpoint({
  Method: 'GET',
  getPath: () => `/v2/metadata`,
  Input: {
    Query: t.type({
      publicKey: t.union([t.string, t.undefined]),
      nature: t.union([NatureType, t.undefined]),
      experimentId: t.union([t.string, t.undefined]),
      researchTag: t.union([t.string, t.undefined]),
      amount: t.union([NumberFromString, t.undefined]),
      skip: t.union([NumberFromString, t.undefined]),
      format: t.union([Format, t.undefined]),
    }),
  },
  Output: ListMetadataResponse,
});

export default {
  ListMetadata,
};
