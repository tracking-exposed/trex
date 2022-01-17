import path from 'path';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';

const mode = process.env.NODE_ENV === 'production'
  ? 'production' : 'development';

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
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    plugins: [
      new TsconfigPathsPlugin({}),
    ],
  },
  target: 'node',
};
