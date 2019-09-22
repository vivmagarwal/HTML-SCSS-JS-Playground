const path = require('path');

module.exports = {
  "entry" : path.resolve(__dirname, 'src/script-es6.js'),
  "output" : {
    "path" : path.resolve(__dirname, 'build'),
    "filename" : 'script.js',
  },
  "mode" : 'development',
  "module" : {
    rules : [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['@babel/preset-env']
        }
      }
    ]
  }
};

