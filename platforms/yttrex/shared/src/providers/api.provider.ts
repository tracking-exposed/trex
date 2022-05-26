import {
  APIClient,
  GetAPIOptions,
  MakeAPIClient,
  HTTPClient,
} from '@shared/providers/api.provider';
import * as Endpoints from '../endpoints';

/**
 * The API client for YT endpoints
 */
type YTAPIClient = APIClient<typeof Endpoints>;

/**
 *
 * @param opts - {@link GetAPIOptions}
 *
 * @returns An object with {@link YTAPIClient} to communicate with
 * YT endpoints and with {@link HTTPClient} for plain HTTP requests
 */
export const GetAPIClient = (
  opts: GetAPIOptions
): {
  API: YTAPIClient;
  HTTPClient: HTTPClient;
} => {
  return MakeAPIClient(opts, Endpoints);
};
