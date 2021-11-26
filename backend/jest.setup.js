const nconf = require("nconf");

nconf.argv().env().file({ file: "config/settings.json" }).overrides({
  mongoPort: 27019,
});

process.env.NODE_ENV = "test";
