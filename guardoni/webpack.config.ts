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
  outputDir: path.resolve(__dirname, 'build/desktop'),
  env: AppEnv,
  hot: false,
  entry: {
    main: path.resolve(__dirname, './src/desktop/main.ts'),
  },
});

config.plugins.push(
  new CopyWebpackPlugin({
    patterns: [
      {
        from: path.resolve(__dirname, '../extension/dist'),
        to: path.resolve(__dirname, 'extension'),
      },
      {
        from: path.resolve(__dirname, '../extension/dist'),
        to: path.resolve(__dirname, 'build/extension'),
      },
      {
        from: path.resolve(
          __dirname,
          process.env.NODE_ENV === 'development' ? '.env.development' : '.env'
        ),
        to: path.resolve(__dirname, 'build/desktop/.env'),
      },
    ],
  })
);

// renderer config
const { buildENV: rendererBuildENV, ...rendererConfig } = getConfig({
  cwd: __dirname,
  outputDir: path.resolve(__dirname, 'build/desktop/renderer'),
  env: AppEnv,
  hot: false,
  target: 'electron-renderer',
  entry: {
    renderer: path.resolve(__dirname, 'src/desktop/renderer.tsx'),
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
    guardoni: path.resolve(__dirname, 'src/guardoni.ts'),
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
