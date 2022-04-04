const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { apps } = require('./ecosystem.config');

module.exports = {
  apps: [
    {
      ...apps[0],
      env: {
        mongoDb: 'yttrex-test',
        mongoPort: 27019
      },
    },
    {
      ...apps[1],
    },
    {
      ...apps[2],
    },
  ],
};
