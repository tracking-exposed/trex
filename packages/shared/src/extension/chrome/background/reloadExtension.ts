import config from '../../config';
import { bo } from '../../utils/browser.utils';

export const load = (): void => {
  if (config.DEVELOPMENT) {
    bo.runtime.reload();
  }
};
