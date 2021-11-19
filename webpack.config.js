/* eslint-disable no-console */

// TODO: babel, browserlist, auto-prefixing, ...?

const path = require('path');

const t = require('io-ts');
const { pipe } = require('fp-ts/lib/function');
const { PathReporter } = require('io-ts/lib/PathReporter');
const { BooleanFromString } = require('io-ts-types/lib/BooleanFromString');

const { DefinePlugin } = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const DotenvPlugin = require('dotenv-webpack');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const {
  generateWebpackAliasesFromTSConfig,
} = require('./webpackConfigUtils');

const dotEnvConfigPath = process.env.DOTENV_CONFIG_PATH || (
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env'
);

const mode = process.env.NODE_ENV === 'production'
  ? 'production'
  : 'development';

const NODE_ENV = t.union(
  [t.literal('development'), t.literal('test'), t.literal('production')],
  'NODE_ENV'
);

const BUILD_ENV = t.strict(
  {
    NODE_ENV,
    BUNDLE_TARGET: t.union([t.literal('firefox'), t.literal('chrome')]),
    BUNDLE_STATS: BooleanFromString,
  },
  'processENV'
);

const buildENV = pipe(
  {
    BUNDLE_TARGET: 'chrome',
    BUNDLE_STATS: 'false',
    NODE_ENV: mode,
    ...process.env
  },
  BUILD_ENV.decode,
  (validation) => {
    if (validation._tag === 'Left') {
      console.error(PathReporter.report(validation).join('\n'));
      console.log('\n');
      throw new Error('process.env decoding failed.');
    }
    return validation.right;
  }
);

const pkgJson = require('./package.json');
const manifestVersion = process.env.MANIFEST_VERSION || pkgJson.version.replace('-beta', '');

const plugins = [
  new DefinePlugin({
    'process.env.REACT_APP_BUILD_DATE': JSON.stringify(new Date().toISOString()),
    'process.env.REACT_APP_VERSION': JSON.stringify(manifestVersion),
    'process.env.NODE_ENV': JSON.stringify(mode),
  }),

  new DotenvPlugin({
    path: dotEnvConfigPath,
  }),

  new CopyWebpackPlugin({
    patterns: [{
      from: 'public',
      filter: (file) => {
        const { base } = path.parse(file);

        if (base === 'manifest.json') {
          return false;
        }

        return true;
      }
    }, {
      from: 'public/manifest.json',
      transform: (content) => {
        const manifest = JSON.parse(content);

        if (buildENV.BUNDLE_TARGET === 'chrome') {
          manifest.cross_origin_embedder_policy = {
            value: 'require-corp',
          };

          manifest.cross_origin_opener_policy = {
            value: 'same-origin',
          };
        }

        manifest.version = manifestVersion;

        return JSON.stringify(manifest, null, 2);
      }
    }],
  }),
];

if (mode === 'production') {
  plugins.push(new FileManagerPlugin({
    events: {
      onEnd: {
        archive: [{
          source: './build',
          destination: './build/extension.zip',
        }],
      },
    },
  }));
}

if (buildENV.BUNDLE_STATS) {
  plugins.push(new BundleAnalyzerPlugin({
    generateStatsFile: true,
    analyzerMode: 'json',
  }));
}

module.exports = {
  mode,

  entry: {
    dashboard: path.resolve(__dirname, 'src/dashboard.tsx'),
    app: path.resolve(__dirname, 'src/app.tsx'),
    popup: path.resolve(__dirname, 'src/popup.tsx'),
    background: path.resolve(__dirname, 'src/background/index.ts'),
  },

  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
  },

  module: {
    rules: [{
      test: /\.tsx?$/,
      use: [{
        loader: 'ts-loader',
        options: {
          compilerOptions: {
            noEmit: false,
            sourceMap: true,
          },
          transpileOnly: true,
        },
      }],
    }, {
      test: /\.(ttf|svg)$/,
      type: 'asset/inline',
    }, {
      test: /\.css$/,
      use: [{
        loader: 'style-loader',
      }, {
        loader: 'css-loader',
      }],
    }],
  },

  devtool: (mode === 'development') ? 'inline-source-map' : false,

  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: generateWebpackAliasesFromTSConfig(),
  },

  plugins,
};
