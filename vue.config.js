const { defineConfig } = require('@vue/cli-service')
const TerserPlugin = require('terser-webpack-plugin')
let productionGzipExtensions = /\.(js|css|json|txt|html|ico|svg)(\?.*)?$/i;
module.exports = defineConfig({
  transpileDependencies: true,
  // runtimeCompiler: true,
  chainWebpack: config => {
    config.plugin("CompressionPlugin").use('compression-webpack-plugin', [{
      filename: '[path][base].gz',
      algorithm: 'gzip',
      // 要压缩的文件（正则）
      test: productionGzipExtensions,
      // 最小文件开启压缩
      threshold: 10240,
      minRatio: 0.8
    }])
  },
  configureWebpack: (config) => {
    let optimization = {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            ecma: undefined,
            warnings: false,
            parse: {},
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log'] // 移除console
            }
          }
        })
      ],
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 20000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/
          }
        }
      }
    }
    Object.assign(config, {
      optimization
    })
  },
})
