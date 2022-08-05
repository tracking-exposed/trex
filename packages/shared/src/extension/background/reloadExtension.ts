import config from '../config';
import { bo } from '../utils/browser.utils';

export const load = (): void => {
  if (config.DEVELOPMENT) {
    bo.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'ReloadExtension') {
        bo.runtime.reload();
      }
    });
  }
};
