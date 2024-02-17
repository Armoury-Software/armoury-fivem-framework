const path = require('path');
const fs = require('fs');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: './src/ambient.declarations.d.ts',
                    to: ''
                }
            ]
        }),
        function () {
            this.hooks.done.tap('SaveFileNamePlugin', (stats) => {
                const indexFilePath = './lib/index.d.ts';
                const data = fs.readFileSync(indexFilePath, 'utf8').replace('"../src/ambient.declarations.d.ts"', '"./ambient.declarations.d.ts"');
                fs.writeFileSync(indexFilePath, data);
            });
        },
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        modules: [
            path.resolve(__dirname, './lib')
        ],
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'lib'),
    },
    // optimization: {
    //     splitChunks: {
    //         chunks: 'all',
    //     },
    // },
};
