const { apps } = require('./ecosystem.config');

const env = {
  mongoDb: 'yttrex-test',
  mongoPort: 27019,
};

module.exports = {
  apps: [
    {
      name: 'yt-backend-test',
      ...apps[0],
      env,
    },
    {
      name: 'yt-parser-test',
      ...apps[1],
      env,
    },
    {
      name: 'yt-leaves-parser-test',
      ...apps[2],
      env,
    },
  ],
};
