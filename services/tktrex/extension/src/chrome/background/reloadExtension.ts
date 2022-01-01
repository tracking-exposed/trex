import config from '../../config';

const bo = chrome;

if (config.DEVELOPMENT) {
  bo.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'ReloadExtension') {
      bo.runtime.reload();
    }
  });
}
