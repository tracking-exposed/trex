const path = require('path');
const TSConfigPathsWebpackPlugin = require('tsconfig-paths-webpack-plugin');
const version = require('../package.json').version;

module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-controls',
  ],
  framework: '@storybook/react',
  core: {
    builder: 'webpack5',
  },
  features: {
    emotionAlias: false,
  },
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
  webpackFinal: async (config) => {
    config.module.rules.push({
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', 'sass-loader'],
      include: path.resolve(__dirname, '../'),
    });

    config.resolve.plugins = [];

    const sharedTSConfig = path.resolve(
      process.cwd(),
      '../../packages/shared/tsconfig.json'
    );

    // console.log({ sharedTSConfig });

    config.resolve.plugins.push(
      new TSConfigPathsWebpackPlugin({
        configFile: sharedTSConfig,
      })
    );

    const tabouleTSConfig = path.resolve(
      process.cwd(),
      '../../packages/taboule/tsconfig.json'
    );

    // console.log({ sharedTSConfig });

    config.resolve.plugins.push(
      new TSConfigPathsWebpackPlugin({
        configFile: tabouleTSConfig,
      })
    );

    config.resolve.plugins.push(new TSConfigPathsWebpackPlugin());

    // console.log("config", config.module.rules);
    // console.log("config", config.resolve.plugins);
    // console.log("config", config);

    return config;
  },
  env: (config) => ({
    ...config,
    BUILD: 'BUILD env variable',
    BUILD_DATE: new Date().toISOString().replace(/\.\d+/, ''),
    DEVELOPMENT: true,
    FLUSH_INTERVAL: 9000,
    API_ROOT: 'API_ROOT env variable',
    VERSION: version,
    WEB_ROOT: 'WEB_ROOT env variable',
  }),
};
