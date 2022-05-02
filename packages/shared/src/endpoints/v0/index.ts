import * as t from 'io-ts';
import { DocumentedEndpoint } from '../utils';

const GetHealth = DocumentedEndpoint({
  title: 'GET health',
  description: 'Check server health',
  tags: ['health'],
  Method: 'GET',
  getPath: () => `/v0/health`,
  Output: t.any,
});

export default {
  Public: {
    GetHealth,
  },
};
