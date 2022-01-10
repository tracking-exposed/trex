import api from '../api';
const bo = chrome;

bo.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'sync') {
    api
      .postEvents(request.payload, request.userId)
      .then((response) => sendResponse({
        type: 'Success',
        response,
      }))
      .catch((error) => sendResponse({
        type: 'Error',
        error,
      }));

    return true;
  }
});
