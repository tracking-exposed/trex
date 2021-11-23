process.env.NODE_ENV = 'development';

const fs = require('fs-extra');
const path = require('path');
const paths = require('react-scripts/config/paths');
const webpack = require('webpack');
const config = require('react-scripts/config/webpack.config.js');
const configOverrides = require('../config-overrides');
const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const webpackConfig = configOverrides.webpack(config('development'));

for (const rule of webpackConfig.module.rules) {
  if (!rule.oneOf) continue;

  for (const one of rule.oneOf) {
    if (
      one.loader &&
      one.loader.includes('babel-loader') &&
      one.options &&
      one.options.plugins
    ) {
      one.options.plugins = one.options.plugins.filter(
        (plugin) =>
          typeof plugin !== 'string' || !plugin.includes('react-refresh')
      );
    }
  }
}

// remove HotModuleReplacementPlugin and ReactRefreshPlugin
webpackConfig.plugins.splice(4, 2);
// console.log(webpackConfig.plugins);

webpack(webpackConfig).watch({}, (err, stats) => {
  if (err) {
    console.error(err);
  } else {
    copyPublicFolder();
  }
  console.error(
    stats.toString({
      chunks: false,
      colors: true,
    })
  );
});

function copyPublicFolder() {
  fs.copySync(paths.appPublic, paths.appBuild, {
    dereference: true,
    filter: (file) => {
      // let webpack handle .html and .json files
      return !['.html', '.json'].some((s) => path.extname(file) === s);
    },
  });
}
