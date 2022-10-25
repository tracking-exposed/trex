import { Endpoint } from 'ts-endpoint';
import { ListMetadataResponse } from '../../models/http/metadata/output/ListMetadata.output';
import { ListMetadataQuery } from '../../models/http/metadata/query/ListMetadata.query';

export const ListMetadataQuery = t.type(
  {
    publicKey: t.union([t.string, t.undefined]),
    nature: t.union([NatureType, t.undefined]),
    experimentId: t.union([t.string, t.undefined]),
    researchTag: t.union([t.string, t.undefined]),
    amount: t.union([NumberFromString, t.number, t.undefined]),
    skip: t.union([NumberFromString, t.number, t.undefined]),
    format: t.union([Format, t.undefined]),
  },
  'ListMetadataQuery'
);

export type ListMetadataQuery = t.TypeOf<typeof ListMetadataQuery>;

const ListMetadata = Endpoint({
  Method: 'GET',
  getPath: () => `/v2/metadata`,
  Input: {
    Query: ListMetadataQuery,
  },
  Output: ListMetadataResponse,
});

export default {
  ListMetadata,
};
