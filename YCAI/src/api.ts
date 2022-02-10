import { GetAPI } from '@trex/shared/providers/api.provider';
import { config } from './config';

const { API, HTTPClient } = GetAPI({
  baseURL: config.API_URL,
});

export { API, HTTPClient };
