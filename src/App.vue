<template>
  <div id="app">
    <!-- 遮罩层 -->
    <transition name="showMask">
      <div 
        v-show="showSidebar && !isDesktop"
        class="mask"
        @click="showSidebar = false"
        @mouseover="hover_sidebar"
      ></div>
    </transition>
    <!-- 固定侧边栏切换按钮 -->
    <i 
      @click="toggleSidebar" 
      @mouseover="hover_btn"
      class="sidebar-toggle el-icon-s-operation"
      ref="SidebarBtn"
    ></i>
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
    <!-- 侧边栏 -->
    <el-aside 
      class="sidebar"
      :class="{ 'sidebar-show': showSidebar }"
      width="200px"
      ref="aside"
    >
      <div 
        ref="sidebar"
      >
        <el-menu
          :default-active="$route.path"
          @select="handleSelect"
          menu-trigger="hover"
          class="el-menu-vertical"
          :style="{
            'margin-top': `${sidebarTop + 20*2}px`
          }"
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
      </div>
    </el-aside>
    <!-- 页面主体 -->
    <div 
      class="content-wrapper"
      :style="{
        'margin-left': `${mainLeft}px`
      }"
    >
      <!-- 顶部导航栏 -->
      <el-header 
        class="header" 
        v-show="!isMobile"
      >
        <div :class="['header-content', { 'container': isDesktop }]">
          <!-- 用户信息 -->
          <div 
            class="userInfo" 
            @click="clickUsername" 
            v-longpress="handleLog"
          >
            <el-avatar 
              v-show="userAvatar" 
              :size="36" 
              shape="square"
              :src="userAvatar" 
            ></el-avatar>
            <span class="user-name">{{isLoggedIn ? `${userName}（已登录）` : `${userName}`}}</span>
          </div>
          <!-- 顶部导航栏内容 -->
          <el-menu
            :default-active="$route.path"
            @select="handleSelect"
            menu-trigger="hover"
            class="el-menu"
            mode="horizontal"
          >
            <el-menu-item index="/">首页</el-menu-item>
            <el-menu-item index="/file">我的网盘</el-menu-item>
            <el-menu-item index="/avatar">头像编辑</el-menu-item>
          </el-menu>
        </div>
      </el-header>
      <!-- 页面内容 -->
      <main 
        class="main-content"
        :class="[{ 
          'container': isDesktop,  
        }]"
        ref="mainContent"
        @mouseover="hover_sidebar"
      >
        <div class="content">
          <keep-alive>
            <router-view></router-view>
          </keep-alive>
        </div>
      </main>
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
      showSidebar: false, //是否展示侧边栏
      sidebarTop: 0, //侧边栏顶部留白
      mainLeft: 0, //内容部分右移距离
      isDesktop: true, //是否宽屏
      isMobile: false, //是否窄屏
      isKeydown: false, //是否按下shift/CTRL键（按下同时点击头像用户名登录）
      timeOutEvent: 0, //记录触摸时长（长按头像用户名登录）
      visible: false, //登录弹窗是否弹出
      loading: false, //是否正在登录状态
      form: { //登录的表单数据
        username: '',
        password: ''
      }
    }
  },
  computed:{
    ...mapState('auth', {isLoggedIn: 'token'}),
    ...mapState('base', ['isMobileAgent', ]),
  },
  mounted(){
    window.addEventListener('keydown', e => {
      if(e.keyCode === 16 || e.keyCode === 17) {
        this.isKeydown = true;
      }
    });
    window.addEventListener('keyup', e => {
      if(e.keyCode === 16 || e.keyCode === 17) {
        this.isKeydown = false;
      }
    });
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  },
  methods: {
    ...mapMutations('auth', ['LOGOUT', 'SET_TOKEN', ]),
    handleLog(){ //根据是否处于登录状态，弹出登录/退出登录窗口
      if(!this.isLoggedIn) this.visible = true;
      else {
        this.$confirm('退出登录?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(this.handleLogout).catch(()=>{});
      }
    },
    clickUsername(){
      if(!this.isKeydown && this.userURL) {
        window.open(this.userURL);
      }
      else {
        this.handleLog();
      }
    },
    async handleLogin() { //登录
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
    async handleLogout() { //退出登录
      this.LOGOUT();
      // window.location.reload();
    },
    handleSelect(key) { //点击导航栏跳转
      if(this.showSidebar) this.toggleSidebar(); //关闭侧边导航
      document.documentElement.scrollTop = 0; //滚动到顶部
      this.$router.push({
        path: key,
      });
    },
    toggleSidebar() { //隐藏/显示侧面导航
      this.showSidebar = !this.showSidebar
      if(this.showSidebar) this.sidebarTop = this.$refs.SidebarBtn.offsetHeight;
      if(!this.showSidebar) this.mainLeft = 0;
      if(this.showSidebar && this.isDesktop) {
        const sidebarWidth = this.$refs.sidebar.offsetWidth;
        const mainLeft = this.$refs.mainContent.offsetLeft;
        if(sidebarWidth > mainLeft) {
          const diff = sidebarWidth - mainLeft;
          if(diff <= mainLeft) {
            this.mainLeft = diff;
          }
        }
      }
    },
    handleResize() { //页面尺寸变化
      const width = window.innerWidth
      this.isDesktop = width >= 1456
      // this.isMobile = width < 768
      this.isMobile = false
    },
    hover_btn(){ //鼠标移至显示隐藏侧面导航的按钮
      if(this.isMobileAgent) return;
      if(!this.showSidebar) this.toggleSidebar();
    },
    hover_sidebar(){ //鼠标移至侧面导航
      if(this.showSidebar) this.toggleSidebar();
    }
  }
}
</script>

<style>
html{
  overflow-x: hidden;
}
body{
  padding-right: 0 !important; /* 防止弹窗出现时页面移动 */
  margin: 0 !important;
}
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
  margin: 0 !important;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  max-height: calc(100% - 30px);
  max-width: calc(100% - 30px);
}
::v-deep  .el-dialog .el-dialog__body{
  flex: 1;
  overflow: auto;
}
.el-dialog__wrapper{
  overflow: hidden;
}
/* 基础样式-版心居中 */
.container {
  max-width: 1200px;
  margin: 0 auto;
}
/* 遮罩层动画 */
.showMask-leave-to, .showMask-enter {
  opacity: 0;
}
.showMask-enter-to, .showMask-leave {
  opacity: 1
}
.showMask-enter-active, .showMask-leave-active {
  transition: opacity 0.3s
}
/* 头部样式 */
.header {
  padding: 0;
  background-color: #FFF;
  height: 70px !important;
  transition: margin-left 0.3s;
}
.header-content {
  display: flex;
  justify-content: space-between;
  height: 70px;
}
/* 顶部导航栏 */
.header .el-menu{
  display: flex;
  justify-content: end;
  height: 100%;
  line-height: 70px;
  margin-right: 8px;
}
.header .el-menu li{
  font-size: 16px;
  height: 70px;
  line-height: 70px;
}
/* 用户名区域 */
.header .userInfo{
  display: flex;
  cursor: pointer;
  align-items: center;
  margin-left: 28px;
  /* 颜色和渐变 */
  color: #909399;
  transition: color .3s;
}
.header .userInfo .user-name{
  margin-left: 8px;
}
.header .userInfo:hover{
  color: #303133;
}
/* 侧边栏和侧边栏按钮 */
.sidebar-toggle {
  cursor: pointer;
  font-size: 28px;
  color: #858585;
  position: fixed;
  left: 20px;
  top: 20px;
  z-index: 2000;
}
.sidebar {
  overflow-x: hidden !important;
  position: fixed;
  left: -200px;
  top: 0;
  bottom: 0;
  z-index: 1999;
  transition: left 0.3s;
  background-color: #FFF;
}
.sidebar-show {
  left: 0;
}
/* 主要内容 */
.content-wrapper{
  width: 100%;
  transition: margin-left 0.3s;
}
.main-content {
  min-height: calc(100vh - 60px);
  padding: 20px;
}
/* 遮罩层 */
.mask {
  position: fixed;
  top: 0;
  left: 0; 
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1998;
}
/* 响应式 */
@media (max-width: 1456px) {
  /* 宽度<1456px：取消版心居中 */
  .container {
    max-width: 100%;
    margin: 0;
    padding: 0 15px;
  }
  .content-shift {
    margin-left: 0;
  }
}
@media (max-width: 768px) {
  /* 宽度<768px：隐藏顶部导航栏，只留用户名头像，且靠右 */
  .header .el-menu {
    display: none !important;
  }
  .header .header-content {
    justify-content: end;
  }
}
</style>
