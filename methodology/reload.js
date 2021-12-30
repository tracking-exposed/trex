/* eslint-disable no-console */
const electronReloader = require("electron-reloader");
require("./build/desktop/main");

const env = process.env.NODE_ENV ?? "development";

if (env === "development") {
  try {
    console.log(module);
    electronReloader(module, {
      ignore: [
        'src',
        "data",
        'experiments',
        'node_modules',
        '.*',
        '*.map',
        'profiles',
        'dist',
        'extension',
        'screenshots'
      ],
      debug: true
    });
  } catch (err) {
    console.error("Error", err);
  }
}
