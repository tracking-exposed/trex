import { MinimalEndpointInstance } from '../../endpoints/MinimalEndpoint';
import { APIClient } from '../../providers/api.provider';
import log from '../logger';
import { bo } from '../utils/browser.utils';

export interface SyncReq {
  userId: string;
  payload: any;
  headers?: any;
}

export interface LoadOpts {
  api: APIClient<{
    v2: {
      Public: {
        Handshake: MinimalEndpointInstance;
        AddEvents: MinimalEndpointInstance;
      };
    };
  }>;
  getHeadersForDataDonation: (req: SyncReq) => Promise<any>;
}

// export const handleAPISyncMessage =
//   ({ api, getHeadersForDataDonation }: LoadOpts) =>
//   (request: any, sender: any, sendResponse: any): boolean => {
//     void getHeadersForDataDonation(request)
//       .then((headers) =>
//         api.v2.Public.AddAPIEvents({
//           Headers: headers,
//           Body: request.payload,
//         } as any)()
//       )
//       .then((response) => {
//         if (response._tag === 'Left') {
//           sendResponse({
//             type: 'Error',
//             error: response.left,
//           });
//         } else {
//           sendResponse({
//             type: 'Success',
//             response: response.right,
//           });
//         }
//       })
//       .catch((e) =>
//         sendResponse({
//           type: 'Error',
//           error: e,
//         })
//       );
//     return true;
//   };

export const handleSyncMessage =
  ({ api, getHeadersForDataDonation }: LoadOpts) =>
  (request: any, sender: any, sendResponse: any): boolean => {
    // log.debug('Sync request %O', request.payload);
    void getHeadersForDataDonation(request)
      .then((headers) => {
        return api.v2.Public.AddEvents({
          Headers: headers,
          Body: request.payload,
        } as any)();
      })
      .then((response) => {
        log.info('Sync response %O', response);
        if (response._tag === 'Left') {
          sendResponse({
            type: 'Error',
            error: response.left,
          });
        } else if (response.right.errors) {
          sendResponse({
            type: 'Error',
            error: response.right.errors,
          });
        } else {
          sendResponse({
            type: 'Success',
            response: response.right,
          });
        }
      });
    return true;
  };

export const load = (opts: LoadOpts): void => {
  bo.runtime.onMessage.addListener((request, sender, sendResponse) => {
    log.info('Sync event received %O', request);
    // if (request.type === 'apiSync') {
    //   handleAPISyncMessage(opts)(request, sender, sendResponse);
    //   return true;
    // }

    if (request.type === 'sync') {
      handleSyncMessage(opts)(request, sender, sendResponse);
      return true;
    }
  });
};
