import * as t from 'io-ts';
import * as path from 'path';
import { getConfig } from '../shared/src/webpack/config';
import { CopyWebpackPlugin } from '../shared/src/webpack/plugins';

// process.env.VERSION = packageJson.version;

const { buildENV, ...config } = getConfig({
  cwd: __dirname,
  outputDir: path.resolve(__dirname, 'build/desktop'),
  env: t.strict({}),
  hot: false,
  entry: { main: path.resolve(__dirname, './src/desktop/main.ts') },
});

config.plugins.push(
  new CopyWebpackPlugin({
    patterns: [
      {
        from: path.resolve(__dirname, '../extension/build'),
        to: path.resolve(__dirname, 'extension'),
      },
      {
        from: path.resolve(__dirname, 'extension'),
        to: path.resolve(__dirname, 'build/extension'),
      },
    ],
  })
);

// renderer config
const { buildENV: rendererBuildENV, ...rendererConfig } = getConfig({
  cwd: __dirname,
  outputDir: path.resolve(__dirname, 'build/desktop/renderer'),
  env: t.strict({}),
  hot: true,
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
  entry: {
    guardoni: path.resolve(__dirname, 'src/guardoni.ts'),
  },
});

export default [
  {
    ...rendererConfig,
    devtool: 'source-map',
    target: 'electron-renderer',
  },
  {
    ...config,
    devtool: 'source-map',
    target: 'electron-main',
  },
  {
    ...guardoniConfig,
    output: {
      ...guardoniConfig.output,
      libraryTarget: 'commonjs',
    },
    target: 'node',
    devtool: 'source-map',
  },
];
