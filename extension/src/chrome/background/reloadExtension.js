const bo = chrome || browser;

bo.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'reloadExtension') {
        bo.runtime.reload();
    }
});
