import api from '../api';
import { bo } from '../../utils/browser.utils';

bo.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'apiSync') {
    api
      .postAPIEvents(request.payload, request.userId)
      .then((response) =>
        sendResponse({
          type: 'Success',
          response,
        })
      )
      .catch((error) =>
        sendResponse({
          type: 'Error',
          error,
        })
      );
    return true;
  }

  if (request.type === 'sync') {
    api
      .postEvents(request.payload, request.userId)
      .then((response) =>
        sendResponse({
          type: 'Success',
          response,
        })
      )
      .catch((error) =>
        sendResponse({
          type: 'Error',
          error,
        })
      );

    return true;
  }
});
