const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Fix for webpack 5 polyfill issues
      webpackConfig.resolve.fallback = {
        "fs": false,
        "net": false,
        "tls": false,
        "child_process": false,
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "os": require.resolve("os-browserify/browser"),
        "stream": require.resolve("stream-browserify"),
        "tty": require.resolve("tty-browserify"),
        "zlib": require.resolve("browserify-zlib"),
        "crypto": require.resolve("crypto-browserify"),
        "path": require.resolve("path-browserify"),
        "util": require.resolve("util"),
        "buffer": require.resolve("buffer"),
        "url": require.resolve("url"),
        "assert": require.resolve("assert"),
        "querystring": require.resolve("querystring-es3"),
        "vm": require.resolve("vm-browserify"),
        "constants": require.resolve("constants-browserify"),
        "domain": require.resolve("domain-browser"),
        "timers": require.resolve("timers-browserify"),
        "events": require.resolve("events"),
        "string_decoder": require.resolve("string_decoder"),
        "punycode": require.resolve("punycode")
      };

      // Handle process module resolution for ES modules
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        "process/browser": require.resolve("process/browser.js"),
      };

      // Ensure module resolution extensions include .js for ES modules
      webpackConfig.resolve.extensions = [
        ...webpackConfig.resolve.extensions,
        '.js',
        '.jsx',
        '.ts',
        '.tsx'
      ];

      // Add plugins for global variables
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
          global: 'global'
        }),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
          'process.env.PUBLIC_URL': JSON.stringify(process.env.PUBLIC_URL || ''),
          'global': 'globalThis'
        })
      ];

      // Handle module resolution for Node.js modules in browser
      webpackConfig.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false, // disable the behaviour for .js files
        },
      });

      // Ignore warnings for critical dependencies
      webpackConfig.ignoreWarnings = [
        {
          module: /node_modules\/@aptos-labs/,
          message: /Critical dependency/,
        },
        {
          module: /node_modules\/axios/,
          message: /Critical dependency/,
        },
        {
          module: /node_modules\/@pinata/,
          message: /Critical dependency/,
        }
      ];

      return webpackConfig;
    }
  },
  devServer: {
    // Add dev server configuration to handle client-side routing
    historyApiFallback: true,
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  }
};