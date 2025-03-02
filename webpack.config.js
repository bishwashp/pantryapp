const path = require('path');

module.exports = [
  // Main process
  {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: './main.js',
    target: 'electron-main',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'main.bundle.js'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.json']
    },
    node: {
      __dirname: false,
      __filename: false
    }
  },
  // Renderer process
  {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: './renderer.js',
    target: 'electron-renderer',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'renderer.bundle.js'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.json', '.css']
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        name: 'vendor',
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all'
          }
        }
      }
    },
    performance: {
      hints: process.env.NODE_ENV === 'production' ? 'warning' : false
    }
  }
]; 