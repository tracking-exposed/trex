const { configPaths, aliasJest } = require('react-app-rewire-alias');
const { aliasDangerous } = require('react-app-rewire-alias/lib/aliasDangerous');
const { pipe } = require('fp-ts/lib/function');
const A = require('fp-ts/lib/Array');
const R = require('fp-ts/lib/Record');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const WebpackNotifierPlugin = require('webpack-notifier');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const { BrowserExtensionPlugin } = require('webpack-browser-extension-plugin');
const pkgJson = require('./package.json');
const t = require('io-ts');
const { BooleanFromString } = require('io-ts-types/lib/BooleanFromString');
const { PathReporter } = require('io-ts/lib/PathReporter');
const { DefinePlugin } = require('webpack');

const NODE_ENV = t.union(
  [t.literal('development'), t.literal('test'), t.literal('production')],
  'NODE_ENV'
);

const BUILD_ENV = t.strict(
  {
    NODE_ENV,
    BUNDLE_TARGET: t.union([t.literal('firefox'), t.literal('chrome')]),
    BUNDLE_STATS: BooleanFromString,
    BUNDLE_ENABLE_NOTIFY: BooleanFromString,
  },
  'processENV'
);

const APP_ENV = t.strict(
  {
    NODE_ENV: t.union(NODE_ENV.types.map((v) => t.literal(`"${v.value}"`))),
    PUBLIC_URL: t.string,
    REACT_APP_API_URL: t.string,
    REACT_APP_WEB_URL: t.string,
    REACT_APP_BUILD_DATE: t.string,
    REACT_APP_VERSION: t.string,
    REACT_APP_LOGGER: t.string,
  },
  'Config'
);

// add ts paths as aliases
const webPaths = pipe(
  configPaths('tsconfig.paths.json'),
  R.map((p) => path.join('./src', p))
);

const paths = {
  ...webPaths,
};

module.exports = {
  webpack: function (config) {
    const buildENV = pipe(
      { ...process.env },
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

    console.log('Build ENV', buildENV);

    const produceBundleStats = buildENV.BUNDLE_STATS;
    const isProduction = buildENV.NODE_ENV === 'production';
    const enableNotification = buildENV.BUNDLE_ENABLE_NOTIFY;

    aliasDangerous(paths)(config);

    config.entry = {
      main: path.resolve(__dirname, 'src/index.tsx'),
      app: path.resolve(__dirname, 'src/app.tsx'),
      popup: path.resolve(__dirname, 'src/popup.tsx'),
      background: path.resolve(__dirname, 'src/background/index.ts'),
    };

    // override default html-webpack-plugin for 'all' chunks
    config.plugins[0] = new HtmlWebpackPlugin({
      chunks: ['main'],
      template: path.resolve(__dirname, 'public/index.html'),
      inject: true,
      filename: 'index.html',
    });

    // console.log(process.env, config.plugins[4].definitions['process.env']);

    const definePluginIndex = config.plugins.findIndex(
      (p) => p.definitions && p.definitions['process.env'] !== undefined
    );

    const appEnv = pipe(
      {
        ...config.plugins[definePluginIndex].definitions['process.env'],
        REACT_APP_VERSION: `"${pkgJson.version}"`,
        REACT_APP_BUILD_DATE: `"${new Date().toISOString()}"`,
      },
      APP_ENV.decode,
      (validation) => {
        if (validation._tag === 'Left') {
          console.error(PathReporter.report(validation).join('\n'));
          console.log('\n');
          throw new Error('process.env decoding failed.');
        }
        return validation.right;
      }
    );
    console.log('App ENV', appEnv);
    // override define plugin
    config.plugins[definePluginIndex] = new DefinePlugin({
      'process.env': appEnv,
    });

    config.plugins = config.plugins.concat(
      new HtmlWebpackPlugin({
        chunks: ['popup'],
        template: path.resolve(__dirname, 'public/popup.html'),
        inject: true,
        filename: 'popup.html',
      }),
      new BrowserExtensionPlugin({
        // todo: it fails due to a webpack-inject-plugin-loader error
        autoReload: false,
        backgroundEntry: 'background',
        ignoreEntries: [],
        manifestFilePath: 'public/manifest.json',
        onCompileManifest: (manifest) => {
          const content_scripts = isProduction
            ? [
                {
                  ...manifest.content_scripts[0],
                  matches: pipe(
                    manifest.content_scripts[0].matches,
                    A.takeRight(2)
                  ),
                },
              ]
            : manifest.content_scripts;

          const buildManifest = {
            ...manifest,
            ...(buildENV.BUNDLE_TARGET === 'chrome'
              ? {
                  cross_origin_embedder_policy: {
                    value: 'require-corp',
                  },
                  cross_origin_opener_policy: {
                    value: 'same-origin',
                  },
                }
              : {}),
            content_scripts,
            version: isProduction ? pkgJson.version : `${pkgJson.version}.88`,
          };

          return buildManifest;
        },
      })
    );

    config.output.path = path.resolve(__dirname, 'build');
    config.output.filename = '[name].js';

    // produce bundle stats if needed
    if (produceBundleStats) {
      config.plugins = config.plugins.concat(
        new BundleAnalyzerPlugin({
          generateStatsFile: true,
          analyzerMode: 'json',
        })
      );
    }

    if (!isProduction) {
      config.plugins = config.plugins
        .concat(
          new webpack.LoaderOptionsPlugin({
            debug: true,
          })
        )
        .concat(
          enableNotification
            ? [
                new WebpackNotifierPlugin({
                  // My notification daemon displays "critical" messages only.
                  // Dunno if this is the case for every Ubuntu machine.
                  urgency: 'critical',
                  alwaysNotify: false,
                  title: 'ycai',
                  contentImage: path.join(__dirname, 'icons', 'ycai128.png'),
                  timeout: 2,
                  excludeWarnings: true,
                }),
              ]
            : []
        );
    } else {
      config.plugins = config.plugins.concat(
        new FileManagerPlugin({
          events: {
            onEnd: {
              archive: isProduction
                ? [
                    {
                      source: './build',
                      destination: './build/extension.zip',
                    },
                  ]
                : [],
            },
          },
        })
      );
    }

    // Disable bundle splitting,
    // a single bundle file has to loaded as `content_script`.
    config.optimization.splitChunks = {
      cacheGroups: {
        default: false,
      },
    };

    // `false`: each entry chunk embeds runtime.
    // The extension is built with a single entry including all JS.
    // https://symfonycasts.com/screencast/webpack-encore/single-runtime-chunk
    config.optimization.runtimeChunk = false;

    // `MiniCssExtractPlugin` is used by the default CRA webpack configuration for
    // extracting CSS into separate files. The plugin has to be removed because it
    // uses `[contenthash]` in filenames of the separate CSS files.
    config.plugins = config.plugins
      .filter((plugin) => !(plugin instanceof MiniCssExtractPlugin))
      .concat(
        // `MiniCssExtractPlugin` is used with its default config instead,
        // which doesn't contain `[contenthash]`.
        new MiniCssExtractPlugin()
      );
    config.module.rules[1] = {
      oneOf: config.module.rules[1].oneOf.concat({
        test: /\.wasm$/,
        type: 'javascript/auto',
        loader: 'file-loader',
        options: {
          name: '[name]-[hash].[ext]',
        },
      }),
    };

    return config;
  },
  jest: (config) => {
    config.setupFilesAfterEnv = ['./jest.setup.js'];
    return aliasJest(paths)(config);
  },
};
