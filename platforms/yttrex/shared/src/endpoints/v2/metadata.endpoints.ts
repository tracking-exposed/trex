import { Format } from '@shared/models/common';
import * as t from 'io-ts';
import { NumberFromString } from 'io-ts-types/lib/NumberFromString';
import { NatureType } from '../../models/Nature';
import { Endpoint } from 'ts-endpoint';
import { MetadataList } from '../../models/Metadata';

export const ListMetadataQuery = t.type({
  publicKey: t.union([t.string, t.undefined]),
  nature: t.union([NatureType, t.undefined]),
  experimentId: t.union([t.string, t.undefined]),
  researchTag: t.union([t.string, t.undefined]),
  amount: t.union([NumberFromString, t.undefined]),
  skip: t.union([NumberFromString, t.undefined]),
  format: t.union([Format, t.undefined]),
});

export type ListMetadataQuery = t.TypeOf<typeof ListMetadataQuery>;

const ListMetadata = Endpoint({
  Method: 'GET',
  getPath: () => `/v2/metadata`,
  Input: {
    Query: ListMetadataQuery,
  },
  Output: MetadataList,
});

export default {
  ListMetadata,
};
