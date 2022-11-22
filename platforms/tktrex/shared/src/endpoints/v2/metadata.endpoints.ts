import { DocumentedEndpoint } from '@shared/endpoints';
import { ListMetadataOutput } from '../../models/http/metadata/output/ListMetadata.output';
import { ListMetadataQuery } from '../../models/http/metadata/query/ListMetadata.query';

const ListMetadata = DocumentedEndpoint({
  title: 'List metadata by given filters',
  description: '',
  tags: ['public', 'metadata'],
  Method: 'GET',
  getPath: () => '/v2/metadata',
  Input: {
    Query: ListMetadataQuery,
  },
  Output: ListMetadataOutput,
});

export default {
  ListMetadata,
};
