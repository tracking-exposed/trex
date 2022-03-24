// global-setup.js
const { setup: setupDevServer } = require('jest-dev-server');
const { basename } = require('path');

module.exports = async function globalSetup() {
  const currentDir = basename(process.cwd());
  const currentDirCommand = currentDir === 'guardoni' ? '../../' : './';
  console.log({ currentDir, currentDirCommand });

  await setupDevServer({
    command: `cd ${currentDirCommand} && yarn yt:backend start --key test`,
    launchTimeout: 20000,
    port: 9000,
  });

  // Your global setup
};
