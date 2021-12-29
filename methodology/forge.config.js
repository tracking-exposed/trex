module.exports = {
  packagerConfig: {
    // platform: "linux",
  },
  makers: [
    { name: "@electron-forge/maker-zip" },
    // {
    //   name: "@electron-forge/maker-deb",
    //   config: {
    //     name: "guardoni",
    //     dir: "./out/guardoni-linux-x64",
    //     maintainer: "TrackingExposed",
    //     homepage: "https://tracking.exposed",
    //     arch: "arm64",
    //     platform: ["linux"],
    //   },
    // },
    // {
    //   "name": "@electron-forge/maker-rpm",
    //   "config": {}
    // }
    {
      "name": "@electron-forge/maker-squirrel",
      "config": {
        "name": "guardoni"
      }
    },
  ],
  plugins: [
    // [
    //   "@electron-forge/plugin-auto-unpack-natives",
    //   {
    //     asar: true,
    //   },
    // ],
    // [
    //   "@electron-forge/plugin-webpack",
    //   {
    //     // devContentSecurityPolicy: `default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-eval' 'unsafe-inline' data:`,
    //     mainConfig: "./webpack.config.js",
    //     renderer: {
    //       nodeIntegration: true,
    //       config: "./webpack.renderer.config.js",
    //       entryPoints: [
    //         {
    //           name: "renderer",
    //           html: "./static/guardoni.html",
    //           js: "./src/desktop/renderer.tsx",
    //           preload: {
    //             js: "./src/desktop/preload.ts",
    //           },
    //         },
    //       ],
    //     }
    //   },
    // ],
  ],
};
