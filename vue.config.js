const { defineConfig } = require('@vue/cli-service')
const { baseURL } = require('./config/config')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/api': {
        target: baseURL,  // node后台接口域名
        // secure: true,  // 如果是https接口，需要配置这个参数
        ws: true,
        changeOrigin: true,  //是否跨域
        pathRewrite: {
          '^/api': ''   //需要rewrite的
        }
      }
    }
  }
})
