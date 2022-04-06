// global-setup.js
const { setup: setupDevServer } = require('jest-dev-server');
const { basename } = require('path');

module.exports = async function globalSetup() {
  const currentDir = basename(process.cwd());
  const currentDirCommand = currentDir === 'guardoni' ? '../../' : './';

  await setupDevServer({
    command: `cd ${currentDirCommand} && yarn yt:backend start --key test`,
    launchTimeout: 20000,
    port: 9000,
    usedPortAction: 'ignore',
  });

  // Your global setup
};
