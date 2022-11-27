import { DocumentedEndpoint } from '@shared/endpoints';
import http from '../../models/http';

const ListMetadata = DocumentedEndpoint({
  title: 'List metadata by given filters',
  description: '',
  tags: ['public', 'metadata'],
  Method: 'GET',
  getPath: () => '/v2/metadata',
  Input: {
    Query: http.Query.ListMetadataQuery,
  },
  Output: http.Output.ListMetadataOutput,
});

export default {
  ListMetadata,
};
