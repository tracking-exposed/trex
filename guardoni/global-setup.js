// global-setup.js
const { setup: setupDevServer } = require('jest-dev-server');

module.exports = async function globalSetup() {
  await setupDevServer({
    command: `cd ../ && yarn backend watch`,
    launchTimeout: 50000,
    port: 9000,
  });
  // Your global setup
};
