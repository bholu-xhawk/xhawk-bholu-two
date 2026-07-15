import fs from 'fs';
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  const isDev = argv.mode === 'development';

  return {
    entry: './src/main.jsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isDev ? '[name].js' : '[name].[contenthash].js',
      assetModuleFilename: 'assets/[hash][ext][query]',
      clean: true,
      publicPath: '/',
    },
    mode: argv.mode || 'production',
    devtool: isDev ? 'source-map' : false,
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg|woff2?|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.jsx'],
    },
    plugins: [
      new HtmlWebpackPlugin({
        templateContent: fs
          .readFileSync(path.resolve(__dirname, 'index.html'), 'utf8')
          .replace(/<script type="module" src="\/src\/main\.jsx"><\/script>/, ''),
      }),
    ],
    devServer: {
      static: {
        directory: path.resolve(__dirname, 'public'),
      },
      historyApiFallback: true,
      port: 5174,
      open: false,
      hot: true,
    },
  };
};
