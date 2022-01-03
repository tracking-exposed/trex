#!/usr/bin/env node

/* eslint-disable no-console */
require('ts-node').register();

const guardoni = require('../src/guardoni.js');

const run = async () => {
  try {
    // eslint-disable-next-line no-console
    const manifest = guardoni.initialSetup();
    if (!manifest) {
      process.exit(1);
    }
    await guardoni.validateAndStart(manifest);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Guardoni failed with', e);
    console.error('⬆️ Unhandled error! =( ⬆️');
    process.exit(1);
  }
};

run();
