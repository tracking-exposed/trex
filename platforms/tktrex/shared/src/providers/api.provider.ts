import {
  APIClient,
  GetAPIOptions,
  MakeAPIClient,
  HTTPClient,
} from '@shared/providers/api.provider';
import * as Endpoints from '../endpoints';

export const GetAPIClient = (
  opts: GetAPIOptions,
): {
  API: APIClient<typeof Endpoints>;
  HTTPClient: HTTPClient;
} => {
  return MakeAPIClient(opts, Endpoints);
};
