import * as path from 'path';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';

const mode =
  process.env.NODE_ENV === 'production' ? 'production' : 'development';

export default {
  entry: './src/index.ts',
  mode,
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          compilerOptions: {
            noEmit: false,
          },
        },
      },
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
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    plugins: [new TsconfigPathsPlugin({})],
  },
  target: 'node16',
  devtool: 'source-map',
  node: {
    __dirname: true,
  },
};
