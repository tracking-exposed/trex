import * as t from 'io-ts';
import { DocumentedEndpoint } from '@shared/endpoints/DocumentedEndpoint';

const GetHealth = DocumentedEndpoint({
  title: 'GET health',
  description: 'Check server health',
  tags: ['health'],
  Method: 'GET',
  getPath: () => `/v0/health`,
  Output: t.strict({ data: t.literal('OK') }),
});

export default {
  Public: {
    GetHealth,
  },
};
