<template>
  <div id="app">
    <div class="header-menu">
      <!-- 顶部导航栏 -->
      <el-menu
        :default-active="$route.path"
        @select="handleSelect"
        menu-trigger="hover"
        class="el-menu"
        mode="horizontal"
        background-color="#545c64"
        text-color="#fff"
        active-text-color="#ffd04b"
      >
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/file">我的网盘</el-menu-item>
        <el-menu-item index="/avatar">头像编辑</el-menu-item>
      </el-menu>

      <!-- 右侧用户信息 -->
      <div class="right-section">
        <div @click.prevent.stop="clickUsername" @keydown.shift="isKeydown = true" @keydown.ctrl="isKeydown = true" @keyup="isKeydown = false">
          <el-avatar :size="36" :src="userAvatar" v-show="userAvatar"></el-avatar>
          <span class="user-name">{{ userName }}<span v-show="isLoggedIn">（已登录）</span></span>
        </div>
      </div>
      <!-- 登录弹窗 -->
      <el-dialog
        title="用户登录"
        :visible.sync="visible"
        width="400px"
        :show-close="false"
      >
        <el-form :model="form" @submit.native.prevent="handleLogin">
          <el-form-item>
            <el-input
              v-model="form.username"
              placeholder="用户名"
              prefix-icon="el-icon-user"
            ></el-input>
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="form.password"
              type="password"
              placeholder="密码"
              prefix-icon="el-icon-lock"
              show-password
            ></el-input>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              native-type="submit"
              :loading="loading"
              style="width: 100%"
            >登录</el-button>
          </el-form-item>
        </el-form>
      </el-dialog>
      </div>
    <div class="main-container">
      <div class="left-menu"></div>
      <el-button 
        @click="isCollapse = !isCollapse" 
        icon="el-icon-s-operation"
        style="background: #FFF"
      ></el-button>
      <!-- 侧边栏 -->
      <el-menu
        :default-active="$route.path"
        @select="handleSelect"
        menu-trigger="hover"
        class="el-menu-vertical"
        :collapse="isCollapse"
      >
        <el-menu-item index="/">
          <i class="el-icon-s-home"></i>
          <span slot="title">首页</span>
        </el-menu-item>
        <el-menu-item index="/file">
          <i class="el-icon-folder-opened"></i>
          <span slot="title">我的网盘</span>
        </el-menu-item>
        <el-menu-item index="/avatar">
          <i class="el-icon-picture"></i>
          <span slot="title">头像编辑</span>
        </el-menu-item>
      </el-menu>

      <!-- 页面内容 -->
      <div class="content">
        <keep-alive>
          <router-view></router-view>
        </keep-alive>
      </div>
    </div>
  </div>
</template>

<script>
import {mapState, mapGetters, mapActions, mapMutations} from 'vuex';
import {encryptPassword} from './utils/crypto'
import request from './api/request';
import {userName, userAvatar, userURL, repURL} from '../config/config'

export default {
  data() {
    return {
      userName, userAvatar, userURL, repURL, //用户信息
      list: [], //路由列表
      isCollapse: false, //是否显示侧边栏
      isKeydown: false, //是否按下shift/CTRL键（按下同时点击头像用户名登录）
      visible: false, //登录弹窗相关数据
      loading: false,
      form: {
        username: '',
        password: ''
      }
    }
  },
  computed:{
    ...mapState('auth', {isLoggedIn: 'token'}),
  },
  mounted(){
    document.addEventListener('keydown', e => {
      if(e.keyCode === 16 || e.keyCode === 17) {
        this.isKeydown = true;
      }
    });
    document.addEventListener('keyup', e => {
      this.isKeydown = false;
    });
  },
  methods: {
    ...mapMutations('auth', ['LOGOUT', 'SET_TOKEN', ]),
    clickUsername(){
      if(!this.isKeydown && this.userURL) {
        window.open(this.userURL);
      }
      else{
        if(!this.isLoggedIn) this.visible = true;
        else {
          this.$confirm('退出登录?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(this.logout).catch(()=>{});
        }
      }
    },
    async handleLogin() {
      if(!(this.form.username && this.form.password)) return this.$message.error('输入不能为空');
      try {
        this.loading = true;
        const res = await request.post('/auth/login', {
            username: this.form.username,
            password: encryptPassword(this.form.password) // 前端加密
        });
        this.SET_TOKEN(res.data.token);
        this.$router.push('/file');
        // window.location.reload(); // 强制刷新页面
        this.visible = false;
      } catch (err) {
        this.$message.error('登录失败');
      } finally {
        this.loading = false;
      }
    },
    async logout() {
      this.LOGOUT();
      // window.location.reload();
    },
    handleSelect(key) { //点击导航栏跳转
      this.$router.push({
        path: key,
      });
    },
  }
}
</script>

<style>
/* 解决控制台多选框报错 */
input[aria-hidden="true"] {
    display: none !important;
}
.el-radio:focus:not(.is-focus):not(:active):not(.is-disabled) .el-radio__inner {
    box-shadow: none;
}
/* 登录弹窗居中 */
::v-deep .el-dialog{
    display: flex;
    flex-direction: column;
    margin:0 !important;
    position:absolute;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%);
    max-height:calc(100% - 30px);
    max-width:calc(100% - 30px);
}
::v-deep  .el-dialog .el-dialog__body{
    flex:1;
    overflow: auto;
}
/* 侧边栏 */
.el-menu-vertical:not(.el-menu--collapse) {
  width: 200px;
  min-height: 400px;
}
/* 其它样式 */
/* .app-container {
  height: 100vh;
  overflow: hidden;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 20px;
}
.left-section {
  display: flex;
  align-items: center;
}
.center-section {
  width: 400px;
}
.right-section {
  display: flex;
  align-items: center;
  gap: 15px;
}
.user-name {
  font-size: 14px;
}
.main-container {
  display: flex;
  margin-top: 60px;
}
.sidebar-menu {
  height: calc(100vh - 60px);
  position: fixed;
  left: 0;
  transition: width 0.3s;
}
.main-container .content {
  flex: 1;
  padding: 20px;
  transition: margin-left 0.3s;
  overflow-y: auto;
  height: calc(100vh - 60px);
}
.collapse-btn {
  margin-right: 10px;
  font-size: 20px;
}
.el-menu--collapse {
  width: 64px;
}
.el-menu:not(.el-menu--collapse) {
  width: 200px;
} */
</style>
