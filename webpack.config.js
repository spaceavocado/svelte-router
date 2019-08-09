const path = require('path');

const libraryName = 'svelte-router';
const extensions = ['.mjs', '.js', '.json', '.svelte', '.html'];
const mainFields = ['svelte', 'browser', 'module', 'main'];

module.exports = (env, options) => {
  return {
    entry: './src/index.js',
    resolve: {
      mainFields,
      extensions,
      alias: {
        svelte: path.resolve('node_modules', 'svelte'),
      },
    },
    module: {
      rules: [
        {
          test: /\.svelte$/,
          exclude: /(node_modules)/,
          use: {
            loader: 'svelte-loader',
          },
        },
        {
          test: /\.js$/,
          exclude: /(node_modules)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  useBuiltIns: 'usage',
                  corejs: 3,
                }],
              ],
            },
          },
        },
      ],
    },
    devtool: '',
    output: {
      path: __dirname + '/lib',
      filename: libraryName + '.js',
      library: libraryName,
      libraryTarget: 'umd',
    },
    externals: {
      history: 'history',
    },
  };
};
