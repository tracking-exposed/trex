import { bo } from '@shared/extension/utils/browser.utils';

export const reloadExtension = (): void => {
  bo.runtime.reload();
};
