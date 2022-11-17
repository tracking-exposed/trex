import { Endpoint } from 'ts-endpoint';
import { ListMetadataResponse } from '../../models/http/metadata/output/ListMetadata.output';
import { ListMetadataQuery } from '../../models/http/metadata/query/ListMetadata.query';

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
