import { APIClient } from '../../../providers/api.provider';
import { bo } from '../../utils/browser.utils';
import log from '../../logger';
export interface SyncReq {
  userId: string;
  payload: any;
  headers?: any;
}

export interface LoadOpts {
  api: APIClient;
  getHeadersForDataDonation: (req: SyncReq) => Promise<any>;
}

export const handleAPISyncMessage =
  ({ api, getHeadersForDataDonation }: LoadOpts) =>
  (request: any, sender: any, sendResponse: any): void => {
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
  };

export const handleSyncMessage =
  ({ api, getHeadersForDataDonation }: LoadOpts) =>
  (request: any, sender: any, sendResponse: any): void => {
    // log.debug('Sync request %O', request.payload);
    void getHeadersForDataDonation(request)
      .then((headers) => {
        log.info('Headers %O', headers);
        return api.v2.Public.AddEvents({
          Headers: headers,
          Body: request.payload,
        })();
      })
      .then((response) => {
        log.debug('Sync response %O', response);

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
  };

export const load = ({ api, getHeadersForDataDonation }: LoadOpts): void => {
  bo.runtime.onMessage.addListener((request, sender, sendResponse) => {
    log.info('Sync event received %O', request);
    if (request.type === 'apiSync') {
      handleAPISyncMessage({ api, getHeadersForDataDonation })(
        request,
        sender,
        sendResponse
      );
      return true;
    }

    if (request.type === 'sync') {
      handleSyncMessage({ api, getHeadersForDataDonation })(
        request,
        sender,
        sendResponse
      );
      return true;
    }
  });
};
