<template>
  <div>
    <h2><a :href="userInfo.userURL" target="_blank">{{userName}}</a>的个人网页</h2>
    <p>使用<strong>Vue2</strong>+<strong>express</strong>+<strong>mongodb</strong>+<strong>element-ui</strong></p>
    <p>仍在创作中，<a :href="userInfo.repURL" target="_blank">项目首页</a></p>
    <h3>使用说明</h3>
    <ul>
      <li>长按头像用户名区域：登录/退出登录</li>
      <li>按住CTRL/shift键点击头像用户名区域（或者同时按CTRL+shift）：更改头像/背景图链接</li>
      <li>我的网盘：存储各种奇奇怪怪的文件</li>
      <li>头像编辑：裁剪图片，预览和保存裁剪后的图片</li>
      <li>笔记格式修改：修改md格式（换行/图片格式/标题级数...）</li>
    </ul>
  </div>
</template>

<script>
import {mapState, } from 'vuex';
import {userName} from '../../config/config'

export default {
    name: 'MyHome',
    data() {
      return {
        userName, //用户信息

      }
    },
    computed:{
      ...mapState('base', ['userInfo', ]),
    },
}
</script>

<style>

</style>