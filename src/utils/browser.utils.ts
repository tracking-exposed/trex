
const getBO = (): typeof chrome => {
  if (typeof browser !== 'undefined') {
    console.log('browser available', browser);
    return browser;
  }
  console.log('chrome available', chrome);
  return chrome;
};

export const bo = getBO();
