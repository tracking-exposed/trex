const { teardown: teardownServer } = require('jest-dev-server');

module.exports = async function globalSetup() {
  await teardownServer();
};
