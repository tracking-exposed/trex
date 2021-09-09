/* eslint-disable strict, no-console, object-shorthand */
/* eslint-disable import/no-extraneous-dependencies, import/newline-after-import */
'use strict';

const path = require('path');
const moment = require('moment');
const webpack = require('webpack');
const WebpackNotifierPlugin = require('webpack-notifier');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

require('dotenv').load({ silent: true });

const LAST_VERSION = 3;
const packageJSON = require('./package.json');
const { LoaderOptionsPlugin } = require('webpack');
const NODE_ENV = process.env.NODE_ENV || 'development';
const PRODUCTION = NODE_ENV === 'production';
const DEVELOPMENT = NODE_ENV === 'development';
const BUILDISODATE = new Date().toISOString();
console.log(
  'NODE_ENV [' + process.env.NODE_ENV + '] Prod:',
  PRODUCTION,
  'Devel: ',
  DEVELOPMENT
);

const PATHS = {
  APPS: {
    app: path.resolve(__dirname, 'src/app.js'),
    popup: path.resolve(__dirname, 'src/chrome/popup/index.js'),
    background: path.resolve(__dirname, 'src/chrome/background/index.js'),
    dashboard: path.resolve(__dirname, 'src/index.js'),
  },
  BUILD: path.resolve(__dirname, 'build'),
  DIST: path.resolve(__dirname, 'dist'),
  NODE_MODULES: path.resolve(__dirname, 'node_modules')
};

/** EXTERNAL DEFINITIONS INJECTED INTO APP **/
var DEV_SERVER = 'localhost';
var ENV_DEP_SERVER = DEVELOPMENT
  ? 'http://' + DEV_SERVER + ':9000'
  : 'https://youchoose.tracking.exposed';
var ENV_DEP_WEB = DEVELOPMENT
  ? 'http://' + DEV_SERVER + ':1313'
  : 'https://youchoose.tracking.exposed';

const DEFINITIONS = {
  'process.env': {
    DEVELOPMENT: JSON.stringify(DEVELOPMENT),
    NODE_ENV: JSON.stringify(NODE_ENV),
    API_ROOT: JSON.stringify(ENV_DEP_SERVER + '/api/v' + LAST_VERSION),
    WEB_ROOT: JSON.stringify(ENV_DEP_WEB),
    VERSION: JSON.stringify(packageJSON.version + (DEVELOPMENT ? '-dev' : '')),
    BUILD: JSON.stringify(`On the ${moment().format('DD of MMMM at HH:mm')}.`),
    BUILDISODATE: JSON.stringify(BUILDISODATE),
    FLUSH_INTERVAL: JSON.stringify(DEVELOPMENT ? 10000 : 20000),
  },
};

/** PLUGINS **/
const PLUGINS = [new webpack.DefinePlugin(DEFINITIONS)];

const PROD_PLUGINS = [
  new webpack.LoaderOptionsPlugin({
    debug: false,
    minimize: true,
  }),

  // Add additional production plugins
];

const DEV_PLUGINS = [
  new WebpackNotifierPlugin({
    // My notification daemon displays "critical" messages only.
    // Dunno if this is the case for every Ubuntu machine.
    urgency: 'critical',
    title: 'ycai',
    contentImage: path.join(__dirname, 'icons', 'ycai128.png'),
    timeout: 2,
    excludeWarnings: true,
  }),
];

const EXTRACT_CSS_PLUGIN = new MiniCssExtractPlugin({ filename: 'styles.css' });

PLUGINS.push(EXTRACT_CSS_PLUGIN);

if (PRODUCTION) {
  /* PLUGINS.push(...PROD_PLUGINS); firefox is giving me too many problem */
} else if (DEVELOPMENT) {
  console.log(
    'Development, using as environment variables: ' +
      JSON.stringify(DEFINITIONS['process.env'])
  );
  PLUGINS.push(...DEV_PLUGINS);
}

/** LOADERS **/
const JS_LOADER = [
  {
    loader: 'babel-loader',
    options: {
      // cacheDirectory: true,
    },
  },
];

const CSS_LOADER = [
  MiniCssExtractPlugin.loader,
  {
    loader: 'css-loader',
    options: {
      sourceMap: true,
    },
  },
  { loader: 'postcss-loader' },
  {
    loader: 'sass-loader',
    options: {
      precision: '8', // If you use bootstrap, must be >= 8. See https://github.com/twbs/bootstrap-sass#sass-number-precision
      outputStyle: 'expanded',
      sourceMap: true,
    },
  },
];

// Add additional loaders to handle other formats (ie. images, svg)

const LOADERS = [
  {
    test: /\.jsx?$/,
    exclude: [PATHS.NODE_MODULES],
    use: JS_LOADER,
  },
  {
    test: /\.s[ac]ss$/,
    exclude: [PATHS.NODE_MODULES],
    use: CSS_LOADER,
  },
  {
    test: /\.css$/,
    exclude: [PATHS.NODE_MODULES],
    use: [CSS_LOADER[0], CSS_LOADER[1]],
  },
];

/** EXPORTED WEBPACK CONFIG **/
const config = {
  mode: NODE_ENV,
  stats: {
    errorDetails: true,
  },
  entry: PATHS.APPS,
  output: {
    path: PRODUCTION ? PATHS.DIST : PATHS.BUILD,
    filename: '[name].js',
  },

  // devtool: PRODUCTION ? '#source-map' : '#inline-source-map',
  devtool: PRODUCTION ? null : 'inline-source-map',

  target: 'web',

  resolve: {
    extensions: ['.js', '.jsx'],
    modules: ['src', 'node_modules'], // Don't use absolute path here to allow recursive matching
  },

  plugins: PLUGINS,

  module: {
    rules: LOADERS,
  },

  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        cache: false,
        parallel: true,
        uglifyOptions: {
          compress: false,
        },
        extractComments: false,
        sourceMap: true,
      }),
    ],
  },
  //   postcss: [autoPrefixer()]
};

module.exports = config;
