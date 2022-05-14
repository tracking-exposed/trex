export interface Window {
  browser: typeof chrome;
}

const getBO = (): typeof chrome => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  }

  if (typeof window.browser !== 'undefined') {
    return window.browser;
  }
  return chrome;
};

export const bo = getBO();
