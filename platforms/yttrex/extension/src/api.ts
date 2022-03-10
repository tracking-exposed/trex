import config from '@shared/extension/config';
import { GetAPI } from '@shared/providers/api.provider';

// export an instance of the API client with proper endpoint
export default GetAPI({
  baseURL: config.API_ROOT,
  getAuth: async (req) => req,
  onUnauthorized: async (res) => res,
});
