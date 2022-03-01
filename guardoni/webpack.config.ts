import * as t from 'io-ts';
import * as path from 'path';
import { getConfig } from '../packages/shared/src/webpack/config';
import { CopyWebpackPlugin } from '../packages/shared/src/webpack/plugins';
import { AppEnv } from './src/AppEnv';
import packageJson from './package.json';

process.env.VERSION = packageJson.version;

const { buildENV, ...config } = getConfig({
  cwd: __dirname,
  target: 'electron-main',
  outputDir: path.resolve(__dirname, 'build/electron'),
  env: AppEnv,
  hot: false,
  entry: {
    main: path.resolve(__dirname, './src/electron/main.ts'),
  },
});

config.plugins.push(
  new CopyWebpackPlugin({
    patterns: [
      {
        from: path.resolve(__dirname, '../services/yttrex/extension/dist'),
        to: path.resolve(__dirname, 'build/extension'),
      },
      {
        from: path.resolve(
          __dirname,
          config.mode === 'development' ? '.env.development' : '.env'
        ),
        to: path.resolve(__dirname, 'build/electron/.env'),
        toType: 'file',
      },
    ],
  })
);

// renderer config
const { buildENV: rendererBuildENV, ...rendererConfig } = getConfig({
  cwd: __dirname,
  outputDir: path.resolve(__dirname, 'build/electron/renderer'),
  env: AppEnv,
  hot: false,
  target: 'electron-renderer',
  entry: {
    renderer: path.resolve(__dirname, 'src/electron/renderer.tsx'),
  },
});

rendererConfig.plugins.push(
  new CopyWebpackPlugin({
    patterns: [
      {
        from: 'static',
        filter: (file: string) => {
          const { base } = path.parse(file);
          return ['guardoni.html'].includes(base);
        },
      },
    ],
  })
);

const { buildENV: guardoniBuildEnv, ...guardoniConfig } = getConfig({
  cwd: __dirname,
  outputDir: path.resolve(__dirname, 'build/guardoni'),
  env: t.strict({}),
  hot: false,
  target: 'node',
  entry: {
    cli: path.resolve(__dirname, 'src/guardoni/cli.ts'),
  },
});

export default [
  {
    ...rendererConfig,
    devtool: 'source-map',
  },
  {
    ...config,
    devtool: 'source-map',
  },
  {
    ...guardoniConfig,
    output: {
      ...guardoniConfig.output,
      libraryTarget: 'commonjs',
    },
    devtool: 'source-map',
  },
];
