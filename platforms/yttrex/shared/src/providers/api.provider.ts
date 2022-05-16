import {
  APIClient,
  GetAPIOptions,
  MakeAPIClient,
  HTTPClient,
} from '@shared/providers/api.provider';
import * as Endpoints from '@shared/endpoints';

type YTAPIClient = APIClient<typeof Endpoints>;

export const GetAPIClient = (
  opts: GetAPIOptions
): {
  API: YTAPIClient;
  HTTPClient: HTTPClient;
} => {
  return MakeAPIClient(opts, Endpoints);
};
