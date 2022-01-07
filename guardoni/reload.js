/* eslint-disable no-console */
const electronReloader = require('electron-reloader');
require('./build/desktop/main');

const env = process.env.NODE_ENV ?? 'development';

if (env === 'development') {
  try {
    electronReloader(module, {
      watchRenderer: true,
      ignore: [
        'bin',
        'config',
        'data',
        'dist',
        'executions',
        'experiments',
        'extension',
        'node_modules',
        'profiles',
        'screenshots',
        '.*',
        '*.map',
        '*.json',
        '*.ts',
      ],
    });
  } catch (err) {
    console.error('Error', err);
  }
}
