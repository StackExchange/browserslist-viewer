const path = require('path');
const glob = require('glob');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const PurgecssPlugin = require('purgecss-webpack-plugin');
const webpack = require("webpack");

const PATHS = {
  src: path.join(__dirname, 'public')
}

module.exports = (_, options) => {
    const isProd = options.mode === 'production';

    return {
        entry: './src/index.ts',
        mode: isProd ? 'production' : 'development',
        devtool: isProd ? false : 'inline-source-map',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/i,
                    use: [MiniCssExtractPlugin.loader, 'css-loader'],
                },
                {
                    test: /\.png$/i,
                    use: [{
                        loader: 'url-loader',
                        options: {
                            limit: 8192,
                        }
                    }],
                }
            ],
        },
        optimization: {
            minimize: true,
            minimizer: [
                new CssMinimizerPlugin(),
            ],
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'dist'),
        },
        devServer: {
            contentBase: './dist',
        },
        plugins: [
            new MiniCssExtractPlugin(),
            new PurgecssPlugin({
                paths: glob.sync(`${PATHS.src}/**/*`, { nodir: true }),
                defaultExtractor: content => {
                    // Capture as liberally as possible, including things like `sm:d-none`
                    const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || []

                    return broadMatches
                }
            }),
            new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
            new HtmlWebpackPlugin({ template: './public/index.html' }),
            new webpack.EnvironmentPlugin({
                BROWSERSLIST_DISABLE_CACHE: false
            }),
        ]
    };
};