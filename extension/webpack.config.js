/* eslint-disable strict, no-console, object-shorthand */
/* eslint-disable import/no-extraneous-dependencies, import/newline-after-import */
'use strict';

const path = require('path');
const moment = require('moment');

const webpack = require('webpack');
// const autoPrefixer = require('autoprefixer');
const combineLoaders = require('webpack-combine-loaders');
const WebpackNotifierPlugin = require('webpack-notifier');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {
  CopyWebpackPlugin,
  FileManagerPlugin,
} = require('../shared/build/webpack/plugins');

require('dotenv').load({ silent: true });

const LAST_VERSION = 2;
const packageJSON = require('./package.json');
const NODE_ENV = process.env.NODE_ENV || 'development';
const PRODUCTION = NODE_ENV === 'production';
const DEVELOPMENT = NODE_ENV === 'development';
const BUILDISODATE = new Date().toISOString();
const GUARDONI_TARGET = process.env.BUILD_TARGET === 'guardoni';
const APP_VERSION = GUARDONI_TARGET
  ? packageJSON.version
      .split('.')
      .filter((v, i) => i !== 2)
      .concat('99')
      .join('.')
  : packageJSON.version;

console.log(
  'NODE_ENV [' + process.env.NODE_ENV + '] Prod:',
  PRODUCTION,
  'Devel: ',
  DEVELOPMENT
);
// const BUILD = require('child_process').execSync('git rev-parse HEAD').toString().trim();

const PATHS = {
  APPS: {
    app: path.resolve(__dirname, 'src/app.js'),
    popup: path.resolve(__dirname, 'src/chrome/popup/index.js'),
    background: path.resolve(__dirname, 'src/chrome/background/index.js'),
  },
  BUILD: path.resolve(__dirname, 'build'),
  DIST: path.resolve(__dirname, 'dist'),
  NODE_MODULES: path.resolve(__dirname, 'node_modules'),
};

/** EXTERNAL DEFINITIONS INJECTED INTO APP **/
const DEV_SERVER = 'localhost';
const ENV_DEP_SERVER = DEVELOPMENT
  ? 'http://' + DEV_SERVER + ':9000'
  : 'https://youtube.tracking.exposed';
const ENV_DEP_WEB = DEVELOPMENT
  ? 'http://' + DEV_SERVER + ':1313'
  : 'https://youtube.tracking.exposed';

const DEFINITIONS = {
  'process.env': {
    DEVELOPMENT: JSON.stringify(DEVELOPMENT),
    NODE_ENV: JSON.stringify(NODE_ENV),
    API_ROOT: JSON.stringify(ENV_DEP_SERVER + '/api/v' + LAST_VERSION),
    WEB_ROOT: JSON.stringify(ENV_DEP_WEB),
    VERSION: JSON.stringify(APP_VERSION + (DEVELOPMENT ? '-dev' : '')),
    BUILD: JSON.stringify(`On the ${moment().format('DD of MMMM at HH:mm')}.`),
    BUILDISODATE: JSON.stringify(BUILDISODATE),
    FLUSH_INTERVAL: JSON.stringify(DEVELOPMENT ? 10000 : 20000),
    DATA_CONTRIBUTION_ENABLED: JSON.stringify(GUARDONI_TARGET),
  },
};

/** PLUGINS **/
const PLUGINS = [new webpack.DefinePlugin(DEFINITIONS)];

// const PROD_PLUGINS = [
//   new webpack.LoaderOptionsPlugin({
//     minimize: true,
//     postcss: [autoPrefixer()],
//     debug: !PRODUCTION,
//   }),
//   // Add additional production plugins
// ];

const DEV_PLUGINS = [
  new WebpackNotifierPlugin({
    // My notification daemon displays "critical" messages only.
    // Dunno if this is the case for every Ubuntu machine.
    urgency: 'critical',
    title: 'yttrex',
    contentImage: path.join(__dirname, 'icons', 'yttrex128.png'),
    timeout: 2,
    alwaysNotify: true,
  }),
  new MiniCssExtractPlugin(),
];

if (PRODUCTION) {
  /* firefox is giving me too many problem */
  // PLUGINS.push(...PROD_PLUGINS);
} else if (DEVELOPMENT) {
  console.log(
    'Development, using as environment variables: ' +
      JSON.stringify(DEFINITIONS['process.env'])
  );
  PLUGINS.push(...DEV_PLUGINS);
}

PLUGINS.push(
  new CopyWebpackPlugin({
    patterns: [
      {
        from: 'public',
        to: PRODUCTION ? PATHS.DIST : PATHS.BUILD,
        priority: 1,
        filter: (file) => {
          const { base } = path.parse(file);
          return !['manifest.json'].includes(base);
        },
      },
      {
        priority: 0,
        from: 'public/manifest.json',
        to: PRODUCTION ? PATHS.DIST : PATHS.BUILD,
        transform: (content) => {
          const manifest = JSON.parse(content.toString());

          manifest.version = APP_VERSION;

          if (PRODUCTION) {
            manifest.permissions = manifest.permissions.filter(
              (p) => !p.includes('localhost')
            );
          }

          return JSON.stringify(manifest, null, 2);
        },
      },
    ],
  })
);

if (NODE_ENV === 'production') {
  PLUGINS.push(
    new FileManagerPlugin({
      events: {
        onEnd: {
          archive: [
            {
              source: './build',
              destination: './extension.zip',
            },
          ],
        },
      },
    })
  );
}

/** LOADERS **/
const JS_LOADER = combineLoaders([
  {
    loader: 'ts-loader',
    options: {
      transpileOnly: true,
    },
  },

  // Add additional JS loaders
]);

const CSS_LOADER = combineLoaders([
  { loader: MiniCssExtractPlugin.loader },
  {
    loader: 'css',
    query: {
      sourceMap: true,
    },
  },

  { loader: 'postcss' },

  {
    loader: 'sass',
    query: {
      precision: '8', // If you use bootstrap, must be >= 8. See https://github.com/twbs/bootstrap-sass#sass-number-precision
      outputStyle: 'expanded',
      sourceMap: true,
    },
  },

  // Add additional style / CSS loaders
]);

// Add additional loaders to handle other formats (ie. images, svg)

const LOADERS = [
  {
    test: /\.jsx?$/,
    exclude: [PATHS.NODE_MODULES],
    use: [
      {
        loader: JS_LOADER,
      },
    ],
  },
  {
    test: /\.s[ac]ss$/,
    exclude: [PATHS.NODE_MODULES],
    use: [
      {
        loader: CSS_LOADER,
      },
    ],
  },

  // Add additional loader specifications
];

/** EXPORTED WEBPACK CONFIG **/
const config = {
  mode: NODE_ENV,
  entry: PATHS.APPS,

  output: {
    path: PRODUCTION ? PATHS.DIST : PATHS.BUILD,
    filename: '[name].js',
  },

  // devtool: PRODUCTION ? '#source-map' : '#inline-source-map',
  devtool: PRODUCTION ? false : 'inline-source-map',

  target: 'web',

  resolve: {
    extensions: ['', '.js', '.jsx'],
    modules: ['node_modules'], // Don't use absolute path here to allow recursive matching
  },

  plugins: PLUGINS,

  module: {
    rules: LOADERS,
  },
  optimization: {
    minimizer: PRODUCTION ? [new UglifyJsPlugin()] : [],
  },
};

module.exports = config;
