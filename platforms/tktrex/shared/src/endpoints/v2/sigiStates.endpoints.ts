import { DocumentedEndpoint } from '@shared/endpoints';
import * as apiModel from '../../models';

const ListSIGIState = DocumentedEndpoint({
  Method: 'GET',
  getPath: () => '/v2/sigiStates',
  Input: {
    // query for 'apiRequest' is compatible (for now)
    // with the one we're using for 'sigiState'
    Query: apiModel.http.Query.ListAPIRequestQuery,
  },
  Output: apiModel.http.Output.ListSigiStateOutput,
  title: 'GET API Request List',
  description: '',
  tags: ['events'],
});

export default {
  ListSIGIState,
};
