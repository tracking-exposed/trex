const yt = require('./yttrex/backend/ecosystem.config');
const tk = require('./tktrex/backend/ecosystem.config');

module.exports = {
  apps: [
    // yt.ecosystem
    ...yt.apps,
    // tk ecosystem
    ...tk.apps,
  ],
};
