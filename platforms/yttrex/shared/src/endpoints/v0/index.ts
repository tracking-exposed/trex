import { DocumentedEndpoint } from '@shared/endpoints/DocumentedEndpoint';
import { HealthResponse } from '../../models/Health';

const GetHealth = DocumentedEndpoint({
  title: 'GET health',
  description: 'Check server health',
  tags: ['health'],
  Method: 'GET',
  getPath: () => `/v0/health`,
  Output: HealthResponse,
});

export default {
  Public: {
    GetHealth,
  },
};
