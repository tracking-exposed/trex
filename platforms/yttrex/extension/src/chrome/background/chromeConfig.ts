import db from '@shared/extension/chrome/db';
import { bo } from '@shared/extension/utils/browser.utils';

bo.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'chromeConfig') {
    void db.get('/settings').then((settings: any) => {
      sendResponse({
        // Expose only what we need
        settings: settings
          ? {
              ...settings,
              isNew: false,
            }
          : {
              isNew: true,
              lessInfo: false,
              tagId: null,
              isStudyGroup: false,
            },

        logo16: bo.extension.getURL('yttrex16.png'),
        logo48: bo.extension.getURL('yttrex48.png'),
        logo128: bo.extension.getURL('yttrex128.png'),
      });
    });
    return true;
  }
});
