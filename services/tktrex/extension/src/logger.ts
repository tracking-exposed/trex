// The standard Logger doesn't display anything,
// so I use the console.log instead for now.
// I think it is due to the localStorage, which is not
// available in the content script and upon which debug relies.
export default {
  debug: (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.log('tktrex:debug:', ...args);
  },
  info: (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.log('tktrex:info:', ...args);
  },
  error: (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.error('tktrex:error:', ...args);
  },
};
