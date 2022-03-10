import { APIClient } from '../../../providers/api.provider';
import { bo } from '../../utils/browser.utils';

interface SyncReq {
  userId: string;
  payload: any;
  headers?: any;
}

export interface LoadOpts {
  api: APIClient;
  getHeadersForDataDonation: (req: SyncReq) => Promise<any>;
}

export const load = ({ api, getHeadersForDataDonation }: LoadOpts): void => {
  bo.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.type === 'apiSync') {
      void getHeadersForDataDonation(request)
        .then((headers) =>
          api.v2.Public.AddAPIEvents({
            Headers: headers,
            Body: request.payload,
          })()
        )
        .then((response) => {
          if (response._tag === 'Left') {
            sendResponse({
              type: 'Error',
              error: response.left,
            });
          } else {
            sendResponse({
              type: 'Success',
              response: response.right,
            });
          }
        });
      return true;
    }

    if (request.type === 'sync') {
      void getHeadersForDataDonation(request)
        .then((headers) =>
          api.v2.Public.AddEvents({
            Headers: headers,
            Body: request.payload,
          })()
        )
        .then((response) => {
          if (response._tag === 'Left') {
            sendResponse({
              type: 'Error',
              error: response.left,
            });
          } else {
            sendResponse({
              type: 'Success',
              response: response.right,
            });
          }
        });

      return true;
    }
  });
};
