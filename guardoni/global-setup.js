// global-setup.js
const { setup: setupDevServer } = require('jest-dev-server');
const { basename } = require('path');

module.exports = async function globalSetup() {
  const currentDir = basename(process.cwd());
  const currentDirCommand = currentDir === 'guardoni' ? '../' : './';
  await setupDevServer({
    command: `cd ${currentDirCommand} && yarn backend watch`,
    launchTimeout: 50000,
    port: 9000,
  });

  // Your global setup
};
