import { DocumentedEndpoint } from '@shared/endpoints';
import { ListOutput } from '@shared/models/http/Output';
import * as apiModel from '../../models';

const GETAPIRequests = DocumentedEndpoint({
  Method: 'GET',
  getPath: () => '/v2/apiRequests',
  Input: {
    Query: apiModel.http.Query.ListAPIRequestQuery,
  },
  Output: ListOutput(apiModel.APIRequest.APIRequest, 'APIRequestList'),
  title: 'GET API Request List',
  description: '',
  tags: ['events'],
});

export default {
  GETAPIRequests,
};
