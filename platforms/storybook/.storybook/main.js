const path = require('path');
const TSConfigPathsWebpackPlugin = require('tsconfig-paths-webpack-plugin');
const version = require('../package.json').version;
const dotenv = require('dotenv');

const DOTENV_CONFIG_PATH = process.env.DOTENV_CONFIG_PATH
  ? process.env.DOTENV_CONFIG_PATH
  : process.env.NODE_ENV === 'production'
  ? '.env'
  : '.env.development';

const env = dotenv.config({
  path: path.resolve(process.cwd(), DOTENV_CONFIG_PATH),
}).parsed;

function injectEnv(definitions) {
  const env = 'process.env';

  if (!definitions[env]) {
    return {
      ...definitions,
      [env]: JSON.stringify(
        Object.fromEntries(
          Object.entries(definitions)
            .filter(([key]) => key.startsWith(env))
            .map(([key, value]) => [
              key.substring(env.length + 1),
              JSON.parse(value),
            ])
        )
      ),
    };
  }
  return definitions;
}

module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-actions',
    '@storybook/addon-controls',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
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
  env: (config) => {
    return {
      ...config,
      ...env,
    };
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

    config.module.rules.push({
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: [
        {
          loader: require.resolve('babel-loader'),
          options: {
            presets: [
              require('@babel/preset-typescript').default,
              [
                require('@babel/preset-react').default,
                { runtime: 'automatic' },
              ],
              require('@babel/preset-env').default,
            ],
          },
        },
      ],
    });

    config.resolve.extensions.push('.ts', '.tsx');

    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    config.resolve.extensions.push('.mjs');

    const definePlugin = config.plugins.find(
      ({ constructor }) => constructor && constructor.name === 'DefinePlugin'
    );
    if (definePlugin) {
      definePlugin.definitions = injectEnv(definePlugin.definitions);
    }

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
