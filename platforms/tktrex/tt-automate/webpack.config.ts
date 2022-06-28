import * as t from 'io-ts';
import * as path from 'path';
import { getConfig } from '../../../packages/shared/src/webpack/config';
import packageJson from './package.json';

process.env.VERSION = packageJson.version;

const { buildENV: env, ...config } = getConfig({
  cwd: __dirname,
  outputDir: path.resolve(__dirname, 'build'),
  env: t.strict({}),
  hot: false,
  target: 'node16',
  entry: {
    cli: path.resolve(__dirname, 'src/index.ts'),
  },
});

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
  },
);

export default [
  // guardoni TK cli
  {
    ...config,
    output: {
      ...config.output,
      libraryTarget: 'commonjs',
    },
    node: {
      __dirname: false,
    },
    devtool: 'source-map',
  },
];
