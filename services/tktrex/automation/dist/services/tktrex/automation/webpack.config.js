import path from 'path';
const mode = process.env.NODE_ENV === 'production'
    ? 'production' : 'development';
export default {
    entry: './src/index.ts',
    mode,
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    target: 'node',
};
