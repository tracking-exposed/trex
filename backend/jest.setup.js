const nconf = require("nconf");

nconf.argv().env().file({ file: "config/settings.json" });

process.env.NODE_ENV = 'test';