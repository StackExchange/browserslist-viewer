const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const webpack = require("webpack");

module.exports = (_, options) => {
  const isProd = options.mode === "production";

  return {
    entry: "./src/index.ts",
    mode: isProd ? "production" : "development",
    devtool: isProd ? false : "inline-source-map",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.less$/i,
          use: [MiniCssExtractPlugin.loader, "css-loader", "less-loader"],
        },
        {
          test: /\.css$/i,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },
        {
          test: /\.png$/i,
          type: "asset/inline",
        },
        {
          test: /\.hbs$/,
          loader: "handlebars-loader",
          options: {
            helperDirs: path.join(__dirname, "helpers"),
          },
        },
      ],
    },
    optimization: {
      minimizer: ["...", new CssMinimizerPlugin()],
      splitChunks: {
        minChunks: 2,
      },
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    output: {
      filename: "[name].bundle.js",
      path: path.resolve(__dirname, "dist"),
    },
    devServer: {
      static: { directory: "./dist", watch: true },
    },
    plugins: [
      new MiniCssExtractPlugin(),
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: "./public/index.hbs",
      }),
      new webpack.EnvironmentPlugin({
        BROWSERSLIST_DISABLE_CACHE: false,
      }),
    ],
  };
};
