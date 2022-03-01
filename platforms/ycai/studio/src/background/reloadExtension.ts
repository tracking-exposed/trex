import { bo } from '@shared/utils/browser.utils';

export const reloadExtension = (): void => {
  bo.runtime.reload();
};
