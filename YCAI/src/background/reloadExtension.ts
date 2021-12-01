import { bo } from '../utils/browser.utils';

export const reloadExtension = (): void => {
  bo.runtime.reload();
};
