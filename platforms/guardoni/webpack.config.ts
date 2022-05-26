import * as t from 'io-ts';
import * as path from 'path';
import { getConfig } from '../../packages/shared/src/webpack/config';
import { CopyWebpackPlugin } from '../../packages/shared/src/webpack/plugins';
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
config.module?.rules?.push(
  {
    // this is a hack to get webpack to be able to bundle
    // puppeteer-extra, found here:
    // https://github.com/berstend/puppeteer-extra/issues/93
    // this also requires the TypeScript to emit import / export statements
    // i.e. ES6+ nodules to work
    test: /node_modules\/puppeteer-extra\/dist\/index\.esm\.js/,
    loader: 'string-replace-loader',
    options: {
      // match a require function call where the argument isn't a string
      // also capture the first character of the args so we can ignore it later
      search: 'require[(]([^\'"])',
      // replace the 'require(' with a '__non_webpack_require__(', meaning it will require the files at runtime
      // $1 grabs the first capture group from the regex, the one character we matched and don't want to lose
      replace: '__non_webpack_require__($1',
      flags: 'g',
    },
  },
  {
    // also part of the puppeteer-extra hack
    test: /\.js$/,
    use: 'unlazy-loader',
  },
  {
    // this is required by canvas, part of linkedom
    test: /\.node$/,
    use: 'node-loader',
  }
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

// rendererConfig.module?.rules?.push(
//   {
//     // this is a hack to get webpack to be able to bundle
//     // puppeteer-extra, found here:
//     // https://github.com/berstend/puppeteer-extra/issues/93
//     // this also requires the TypeScript to emit import / export statements
//     // i.e. ES6+ nodules to work
//     test: /node_modules\/puppeteer-extra\/dist\/index\.esm\.js/,
//     loader: 'string-replace-loader',
//     options: {
//       // match a require function call where the argument isn't a string
//       // also capture the first character of the args so we can ignore it later
//       search: 'require[(]([^\'"])',
//       // replace the 'require(' with a '__non_webpack_require__(', meaning it will require the files at runtime
//       // $1 grabs the first capture group from the regex, the one character we matched and don't want to lose
//       replace: '__non_webpack_require__($1',
//       flags: 'g',
//     },
//   },
//   {
//     // also part of the puppeteer-extra hack
//     test: /\.js$/,
//     use: 'unlazy-loader',
//   },
//   {
//     // this is required by canvas, part of linkedom
//     test: /\.node$/,
//     use: 'node-loader',
//   }
// );

const { buildENV: guardoniBuildEnv, ...guardoniConfig } = getConfig({
  cwd: __dirname,
  outputDir: path.resolve(__dirname, 'build/guardoni'),
  env: t.strict({}),
  hot: false,
  target: 'node16',
  entry: {
    cli: path.resolve(__dirname, 'src/guardoni/cli.ts'),
  },
});

guardoniConfig.module?.rules?.push(
  {
    // this is a hack to get webpack to be able to bundle
    // puppeteer-extra, found here:
    // https://github.com/berstend/puppeteer-extra/issues/93
    // this also requires the TypeScript to emit import / export statements
    // i.e. ES6+ nodules to work
    test: /node_modules\/puppeteer-extra\/dist\/index\.esm\.js/,
    loader: 'string-replace-loader',
    options: {
      // match a require function call where the argument isn't a string
      // also capture the first character of the args so we can ignore it later
      search: 'require[(]([^\'"])',
      // replace the 'require(' with a '__non_webpack_require__(', meaning it will require the files at runtime
      // $1 grabs the first capture group from the regex, the one character we matched and don't want to lose
      replace: '__non_webpack_require__($1',
      flags: 'g',
    },
  },
  {
    // also part of the puppeteer-extra hack
    test: /\.js$/,
    use: 'unlazy-loader',
  },
  {
    // this is required by canvas, part of linkedom
    test: /\.node$/,
    use: 'node-loader',
  }
);

const { buildENV: guardoniTkBuildEnv, ...guardoniTKConfig } = getConfig({
  cwd: __dirname,
  outputDir: path.resolve(__dirname, 'build/guardoni'),
  env: t.strict({}),
  hot: false,
  target: 'node16',
  entry: {
    'tk-cli': path.resolve(__dirname, 'src/guardoni/tx-automate/index.ts'),
  },
});

guardoniTKConfig.module?.rules?.push(
  {
    // this is a hack to get webpack to be able to bundle
    // puppeteer-extra, found here:
    // https://github.com/berstend/puppeteer-extra/issues/93
    // this also requires the TypeScript to emit import / export statements
    // i.e. ES6+ nodules to work
    test: /node_modules\/puppeteer-extra\/dist\/index\.esm\.js/,
    loader: 'string-replace-loader',
    options: {
      // match a require function call where the argument isn't a string
      // also capture the first character of the args so we can ignore it later
      search: 'require[(]([^\'"])',
      // replace the 'require(' with a '__non_webpack_require__(', meaning it will require the files at runtime
      // $1 grabs the first capture group from the regex, the one character we matched and don't want to lose
      replace: '__non_webpack_require__($1',
      flags: 'g',
    },
  },
  {
    // also part of the puppeteer-extra hack
    test: /\.js$/,
    use: 'unlazy-loader',
  },
  {
    // this is required by canvas, part of linkedom
    test: /\.node$/,
    use: 'node-loader',
  }
);

export default [
  {
    ...rendererConfig,
    mode: 'development',
    devtool: 'source-map',
  },
  {
    ...config,
    devtool: 'source-map',
  },
  // guardoni cli
  {
    ...guardoniConfig,
    output: {
      ...guardoniConfig.output,
      libraryTarget: 'commonjs',
    },
    node: {
      __dirname: false,
    },
    devtool: 'source-map',
  },
  // guardoni TK cli
  {
    ...guardoniTKConfig,
    output: {
      ...guardoniTKConfig.output,
      libraryTarget: 'commonjs',
    },
    node: {
      __dirname: false,
    },
    devtool: 'source-map',
  },
];
