<template>
  <div>
    <h2><a :href="userURL" target="_blank">{{userName}}</a>的个人网页</h2>
    <p>使用<strong>Vue2</strong>+<strong>express</strong>+<strong>mongodb</strong>+<strong>element-ui</strong></p>
    <p>仍在创作中，<a :href="repURL" target="_blank">项目首页</a></p>
    <h3>使用说明</h3>
    <ul>
      <li>长按头像用户名区域（或者按住CTRL/shift键点击）：登录/退出登录</li>
      <li>我的网盘：存储各种奇奇怪怪的文件</li>
      <li>头像编辑：裁剪图片，预览和保存裁剪后的图片</li>
    </ul>
  </div>
</template>

<script>
import {userName, userAvatar, userURL, repURL} from '../../config/config'

export default {
    name: 'MyHome',
    data() {
      return {
        userName, userAvatar, userURL, repURL, //用户信息

      }
    },
}
</script>

<style>

</style>