const yt = require('./yttrex/backend/ecosystem.dev.config');
const tk = require('./tktrex/backend/ecosystem.dev.config');

module.exports = {
  apps: [
    // yt.ecosystem
    ...yt.apps,
    // tk ecosystem
    ...tk.apps,
  ],
};
