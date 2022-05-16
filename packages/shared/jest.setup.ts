process.env.DEBUG = '@trex*';

// eslint-disable-next-line @typescript-eslint/no-var-requires
Object.assign(global, require('jest-chrome'));
