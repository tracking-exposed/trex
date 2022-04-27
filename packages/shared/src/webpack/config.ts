import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import D from 'debug';
import dotenv from 'dotenv';
import { pipe } from 'fp-ts/lib/function';
import * as R from 'fp-ts/lib/Record';
import * as S from 'fp-ts/lib/string';
import * as t from 'io-ts';
import { BooleanFromString } from 'io-ts-types/lib/BooleanFromString';
import { PathReporter } from 'io-ts/lib/PathReporter';
import path from 'path';
import ReactRefreshTypescript from 'react-refresh-typescript';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { trexLogger } from '../logger';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import format from 'date-fns/format';

const webpackLogger = trexLogger.extend('webpack');

// TODO: browserlist, auto-prefixing, ...?

const NODE_ENV = t.union(
  [t.literal('development'), t.literal('test'), t.literal('production')],
  'NODE_ENV'
);

const BUILD_ENV = t.strict(
  {
    NODE_ENV,
    BUNDLE_TARGET: t.union([t.literal('firefox'), t.literal('chrome')]),
    BUNDLE_STATS: BooleanFromString,
    DEBUG: t.union([t.undefined, t.string]),
  },
  'processENV'
);

type BUILD_ENV = t.TypeOf<typeof BUILD_ENV>;
export interface WebpackConfig extends webpack.Configuration {
  buildENV: BUILD_ENV;
  plugins: any[]; // webpack.WebpackPluginInstance[]
}

export interface GetConfigParams<E extends t.Props> {
  cwd: string;
  outputDir: string;
  env: t.ExactC<t.TypeC<E>>;
  entry: {
    [key: string]: string;
  };
  hot: boolean;
  target: WebpackConfig['target'];
}

const getConfig = <E extends t.Props>(
  opts: GetConfigParams<E>
): WebpackConfig => {
  const DOTENV_CONFIG_PATH =
    process.env.DOTENV_CONFIG_PATH ??
    path.resolve(
      opts.cwd,
      process.env.NODE_ENV === 'production' ? '.env' : '.env.development'
    );

  // eslint-disable-next-line
  console.log(
    `Reading process.env from %s for %s (%s)`,
    DOTENV_CONFIG_PATH,
    path.basename(opts.cwd),
    Object.keys(opts.entry).join(', ')
  );

  dotenv.config({ path: DOTENV_CONFIG_PATH, override: true });

  D.enable(process.env.DEBUG ?? '');

  const mode =
    process.env.NODE_ENV === 'production' ? 'production' : 'development';

  const buildENV = pipe(
    {
      BUNDLE_TARGET: 'chrome',
      BUNDLE_STATS: 'false',
      NODE_ENV: mode,
      ...process.env,
    },
    BUILD_ENV.decode,
    (validation) => {
      if (validation._tag === 'Left') {
        // eslint-disable-next-line
        console.log(PathReporter.report(validation).join('\n'));
        // eslint-disable-next-line
        console.log('\n');
        throw new Error('process.env decoding failed.');
      }
      return validation.right;
    }
  );

  webpackLogger.debug('Build ENV %O', buildENV);

  const buildDate = new Date();
  const appEnv = pipe(
    {
      ...process.env,
      NODE_ENV: mode,
      BUILD_DATE: buildDate.toISOString(),
      BUILD: `On ${format(buildDate, 'PPPPpppp')}`,
    },
    opts.env.decode,
    (validation) => {
      if (validation._tag === 'Left') {
        // eslint-disable-next-line
        console.error(PathReporter.report(validation).join('\n'));
        throw new Error(`${opts.env.name} decoding failed.`);
      }
      return validation.right;
    }
  );

  webpackLogger.debug('App ENV %O', appEnv);

  const stringifiedAppEnv = pipe(
    appEnv as any,
    R.reduceWithIndex(S.Ord)(
      {
        NODE_ENV: JSON.stringify(mode),
      },
      (key, acc, v) => {
        // this is cause DefinePlugin to complain when we override
        // process.env vars
        // (process.env as any)[key] = v;
        return {
          ...acc,
          [key]: JSON.stringify(v),
        };
      }
    )
  );

  // eslint-disable-next-line
  webpackLogger.debug(`Process env %O`, stringifiedAppEnv);

  const plugins: any[] = [
    new webpack.ProgressPlugin({
      entries: true,
      dependencies: false,
      percentBy: 'entries',
    }),
  ];

  if (opts.target === 'web' || opts.target === 'electron-renderer') {
    plugins.push(
      new webpack.DefinePlugin({ 'process.env': stringifiedAppEnv }),
      new MiniCssExtractPlugin()
    );
  }

  if (opts.hot && opts.target === 'web' && mode === 'development') {
    plugins.push(new webpack.HotModuleReplacementPlugin());
    plugins.push(new ReactRefreshWebpackPlugin());
  }

  if (buildENV.BUNDLE_STATS) {
    plugins.push(
      new BundleAnalyzerPlugin({
        generateStatsFile: true,
        analyzerMode: 'json',
      })
    );
  }

  return {
    mode,

    context: opts.cwd,

    entry: opts.entry,
    target: opts.target,

    output: {
      path: opts.outputDir,
      filename: '[name].js',
    },
    module: {
      rules: [
        {
          test: /\.(t|j)sx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                context: opts.cwd,
                projectReferences: true,
                transpileOnly: true,
                getCustomTransformers: () => ({
                  before: [
                    mode === 'development' &&
                      opts.hot &&
                      ReactRefreshTypescript(),
                  ].filter(Boolean),
                }),
              },
            },
          ],
        },
        {
          test: /\.(png)$/,
          use: [{ loader: 'file-loader' }],
        },
        {
          test: /\.(ttf|svg)$/,
          type: 'asset/inline',
        },
        {
          test: /\.css$/,
          use: [
            mode === 'production'
              ? MiniCssExtractPlugin.loader
              : {
                  loader: 'style-loader',
                },

            {
              loader: 'css-loader',
            },
            // { loader: 'postcss-loader' },
            {
              loader: 'sass-loader',
              options: {
                sassOptions: {
                  precision: '8', // If you use bootstrap, must be >= 8. See https://github.com/twbs/bootstrap-sass#sass-number-precision
                  outputStyle: 'expanded',
                  sourceMap: true,
                },
              },
            },
          ],
        },
      ],
    },

    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      plugins: [
        new TsconfigPathsPlugin({
          // configFile: tsConfigFile,
          // context: opts.cwd,
        }),
      ],
      modules: ['node_modules', path.resolve(opts.cwd)],
    },

    devtool: mode === 'development' ? 'inline-source-map' : 'source-map',

    plugins,
    // custom options
    buildENV,
  };
};

export { getConfig };
