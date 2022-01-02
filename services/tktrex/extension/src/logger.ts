// The standard Logger doesn't display anything,
// so I use the console.log instead for now.
// I think it is due to the localStorage, which is not
// available in the content script and upon which debug relies.
export default {
  debug: (msg: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.log(
      `%c(tktrex:debug)%c ${msg}`,
      [
        'color: #00f',
        'background: #F58040',
        'padding: 3px',
        'font-weight: bold',
        'border-radius: 3px',
      ].join(';'),
      'color: #222',
      ...args,
    );
  },
  info: (msg: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(
        `%c(tktrex:info) %c${msg}`,
        'color: #22F',
        'color: #000',
        ...args,
      );
    }
  },
  error: (msg: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.log(
      `%c(tktrex:error)%c ${msg}`,
      [
        'color: #FFF',
        'background: #F44',
        'padding: 3px',
        'font-weight: bold',
        'border-radius: 3px',
      ].join(';'),
      'font-weight: bold',
      ...args,
    );
  },
};
