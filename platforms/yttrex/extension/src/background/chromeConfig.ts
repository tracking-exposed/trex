import db from '@shared/extension/db';
import { bo } from '@shared/extension/utils/browser.utils';

bo.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'chromeConfig') {
    void db.get('/settings').then((_settings: any) => {
      const settings = _settings
        ? {
            ..._settings,
            isNew: false,
          }
        : {
            isNew: true,
            lessInfo: false,
            tagId: null,
            isStudyGroup: false,
          };
      sendResponse({
        // Expose only what we need
        ...settings,
        ui: {
          logo16: bo.extension.getURL('yttrex16.png'),
          logo48: bo.extension.getURL('yttrex48.png'),
          logo128: bo.extension.getURL('yttrex128.png'),
        },
      });
    });
    return true;
  }
});
