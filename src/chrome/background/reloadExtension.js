import { bo } from '../../utils/browser.utils';

export const reloadExtension = () => {
  bo.runtime.reload();
};
