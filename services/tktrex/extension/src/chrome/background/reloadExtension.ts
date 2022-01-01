const bo = chrome;

bo.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ReloadExtension') {
    bo.runtime.reload();
  }
});
