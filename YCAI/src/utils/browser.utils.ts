import { config } from '../config';

const getBO = (): typeof chrome => {
  if (config.NODE_ENV === 'development') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  }

  if (typeof browser !== 'undefined') {
    return browser;
  }
  return chrome;
};

export const bo = getBO();
