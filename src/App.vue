<template>
  <div id="app">
    <!-- 回到顶部按钮 -->
    <el-backtop 
      v-if="!$route.path.startsWith('/viewFile')"
      :visibility-height="70"
    ></el-backtop>
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
      v-if="!$route.path.startsWith('/viewFile')"
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
      :append-to-body="true"
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
    <!-- 修改信息对话框 -->
    <el-dialog 
        title="修改信息" 
        :visible.sync="changeUserinfoVisible"
        class="changeArticle"
        :append-to-body="true"
    >
        <el-input 
            v-model="userInfoForm.userEmail"
            placeholder="邮箱"
        ></el-input>
        <el-input 
            v-model="userInfoForm.userURL"
            placeholder="作者主页"
        ></el-input>
        <el-input 
            v-model="userInfoForm.repURL"
            placeholder="仓库主页"
        ></el-input>
        <el-tooltip effect="light" :disabled="!(userInfoForm.userAvatar)">
            <div slot="content">
                <img 
                    :src="userInfoForm.userAvatar" 
                    alt="图片预览"
                    style="max-width:200px; max-height:200px;"
                >
            </div>
            <el-input 
                v-model="userInfoForm.userAvatar"
                placeholder="头像url"
            ></el-input>
        </el-tooltip>
        <el-input 
          type="number" 
          v-model.number="userInfoForm.bgiChangeTime"
          placeholder="背景图更换间隔(min)，为0则不更换"
        ></el-input>
        <p>宽屏背景图</p>
        <el-row 
            v-for="(row, index) in userInfoForm.bgi"
            :key="'kuanping'+index"
            type="flex" justify="center" align="middle"
        >
            <el-col :span="20" style="display: flex; justify-content: center;">
              <el-tooltip effect="light" :disabled="!row">
                <div slot="content">
                    <img 
                        :src="userInfoForm.bgi[index]" 
                        alt="图片预览"
                        style="max-width:600px; max-height:600px;"
                    >
                </div>
                <el-input 
                    v-model="userInfoForm.bgi[index]"
                    placeholder="宽屏背景图"
                ></el-input>
              </el-tooltip>
            </el-col>
            <el-col :span="4" style="display: flex; justify-content: center;">
                <el-button
                    :type="`${index !== (userInfoForm.bgi.length-1) ? 'danger': 'primary'}`"
                    size="small"
                    style="margin-bottom: 10px;"
                    :icon="`${index !== (userInfoForm.bgi.length-1) ? 'el-icon-delete': 'el-icon-plus'}`"
                    @click="`${index !== (userInfoForm.bgi.length-1) ? userInfoForm.bgi.splice(index, 1) : userInfoForm.bgi.push('')}`"
                ></el-button>
            </el-col>
        </el-row>
        <p>窄屏背景图</p>
        <el-row 
            v-for="(row, index) in userInfoForm.bgiM"
            :key="'zaiping'+index"
            type="flex" justify="center" align="middle"
        >
            <el-col :span="20" style="display: flex; justify-content: center;">
              <el-tooltip effect="light" :disabled="!row">
                <div slot="content">
                    <img 
                        :src="userInfoForm.bgiM[index]" 
                        alt="图片预览"
                        style="max-width:600px; max-height:600px;"
                    >
                </div>
                <el-input 
                    v-model="userInfoForm.bgiM[index]"
                    placeholder="窄屏背景图"
                ></el-input>
              </el-tooltip>
            </el-col>
            <el-col :span="4" style="display: flex; justify-content: center;">
                <el-button
                    :type="`${index !== (userInfoForm.bgiM.length-1) ? 'danger': 'primary'}`"
                    size="small"
                    style="margin-bottom: 10px;"
                    :icon="`${index !== (userInfoForm.bgiM.length-1) ? 'el-icon-delete': 'el-icon-plus'}`"
                    @click="`${index !== (userInfoForm.bgiM.length-1) ? userInfoForm.bgiM.splice(index, 1) : userInfoForm.bgiM.push('')}`"
                ></el-button>
            </el-col>
        </el-row>
        <div slot="footer" style="text-align: center;">
            <el-button 
                type="primary" 
                @click="changeUserinfo"
            >确认</el-button>
        </div>
    </el-dialog>
    <!-- 侧边栏 -->
    <el-aside 
      v-if="!$route.path.startsWith('/viewFile')"
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
          <el-menu-item 
            index="/article" 
            :style="`${$route.path.startsWith('/article') ? 'color: #409EFF': ''}`"
          >
            <i 
              class="el-icon-s-flag"
              :style="`${$route.path.startsWith('/article') ? 'color: #409EFF': ''}`"
            ></i>
            <span slot="title">个人空间</span>
          </el-menu-item>
          <el-menu-item index="/file">
            <i class="el-icon-folder-opened"></i>
            <span slot="title">我的网盘</span>
          </el-menu-item>
          <el-submenu index="/tools">
            <template slot="title">
              <i class="el-icon-s-tools"></i>
              <span slot="title">小工具</span>
            </template>
            <el-menu-item index="/avatar">
              <i class="el-icon-picture"></i>
              <span slot="title">头像编辑</span>
            </el-menu-item>
            <el-menu-item index="/markdown">
              <i class="el-icon-edit"></i>
              <span slot="title">markdown更改</span>
            </el-menu-item>
          </el-submenu>
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
        v-if="!$route.path.startsWith('/viewFile')"
        class="header" 
        ref="header"
      >
        <div :class="['header-content', { 'container': isDesktop }]">
          <!-- 用户信息 -->
          <div 
            class="userInfo" 
            :style="`margin-left: ${isDesktop ? 2 : 28}px;`"
            @click="clickUsername" 
            v-longpress="handleLog"
          >
            <el-avatar 
              class="user-avatar"
              v-show="userInfo.userAvatar" 
              :size="36" 
              shape="square"
              :src="userInfo.userAvatar" 
            ></el-avatar>
            <span class="user-name">{{isLoggedIn ? `${userName}（已登录${userRole}）` : `${userName}`}}</span>
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
            <el-menu-item 
              index="/article"
              :style="`${$route.path.startsWith('/article') ? 'border-bottom: 2px solid #409EFF !important; color: #303133 !important;': ''}`"
            >个人空间</el-menu-item>
            <el-menu-item index="/file">我的网盘</el-menu-item>
            <el-submenu index="/tools">
              <template slot="title">小工具</template>
              <el-menu-item index="/avatar">头像编辑</el-menu-item>
              <el-menu-item index="/markdown">markdown更改</el-menu-item>
            </el-submenu>
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
import _ from 'lodash';
import {mapState, mapActions, mapMutations} from 'vuex';
import {encryptPassword} from './utils/crypto'
import {changeBgi} from './utils/animate'
// import {getMetaInfo} from './utils/seo'
import request from './api/request';
import {userName} from '../config/config'

export default {
  // metaInfo: getMetaInfo(),
  data() {
    return {
      userName: userName,
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
      changeUserinfoVisible: false, //修改信息对话框
      form: { //登录的表单数据
        username: '',
        password: ''
      },
      userInfoForm: {}, //信息表单
      bgiIndex: 0, //用哪张背景图
      bgiURL: '', //背景图链接
    }
  },
  computed:{
    ...mapState('auth', {isLoggedIn: 'token', userRole: 'userRole', }),
    ...mapState('base', ['isMobileAgent', 'userInfo', ]),
  },
  watch:{
    bgiURL:{
      handler(newVal, oldVal){
        changeBgi(newVal);
      },
      immediate: true
    }
  }, 
  async mounted(){
    window.addEventListener('keydown', e => {
      if(e.keyCode === 16 || e.keyCode === 17) {
        this.isKeydown = true;
      }
      if(e.ctrlKey && e.shiftKey && this.isLoggedIn){
        this.changeUserinfoVisible = true;
      }
    });
    window.addEventListener('keyup', e => {
      if(e.keyCode === 16 || e.keyCode === 17) {
        this.isKeydown = false;
      }
    });
    window.addEventListener('keyup', e => {
      if(e.keyCode === 16 || e.keyCode === 17) {
        this.isKeydown = false;
      }
    });
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
    this.isLogin();
    await this.getUserInfo();
    this.userInfoForm = _.cloneDeep(this.userInfo);
    const startTime = new Date(new Date().setHours(0, 0, 0, 0));
    this.updateBgi(startTime);
    setInterval(()=>{
      this.updateBgi(startTime);
    }, 1000);
  },
  methods: {
    ...mapMutations('auth', ['LOGOUT', 'SET_TOKEN', 'SET_USER', ]),
    ...mapActions('auth', ['isLogin', ]),
    ...mapActions('base', ['getUserInfo', 'updateUserInfo', ]),
    handleLog(){ //根据是否处于登录状态，弹出登录/退出登录窗口
      if(!this.isLoggedIn) this.visible = true;
      else {
        this.$confirm('退出登录？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(this.handleLogout).catch(()=>{});
      }
    },
    updateBgi(startTime){
      if(this.userInfo.bgiChangeTime){
        this.bgiIndex = parseInt((Date.now() - startTime) / (this.userInfo.bgiChangeTime * 60 * 1000));
      }
      if(this.isMobile) this.bgiURL = this.userInfo.bgiM[this.bgiIndex%this.userInfo.bgiM.length];
      else this.bgiURL = this.userInfo.bgi[this.bgiIndex%this.userInfo.bgi.length];
    },
    clickUsername(){
      if(!this.isKeydown && this.userInfo.userURL) {
        window.open(this.userInfo.userURL);
      }
      if(this.isKeydown && this.isLoggedIn){
        this.changeUserinfoVisible = true;
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
        this.SET_USER(res.data.role);
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
    async changeUserinfo(){
      try{
        this.userInfoForm.bgi = this.userInfoForm.bgi.filter(ele=>ele);
        this.userInfoForm.bgi = [...this.userInfoForm.bgi];
        await this.updateUserInfo(this.userInfoForm);
        this.changeUserinfoVisible = false;
        this.$message.success('更改成功');
      } catch(err) {
        this.$message.error('更改失败');
      }
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
      const width = window.innerWidth;
      this.isDesktop = (width >= 1456);
      this.isMobile = (width < 768) || this.isMobileAgent;
      // this.isMobile = false
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
#app{
  height: 100%;
  overflow-x: hidden;
}
/* 解决控制台多选框报错 */
input[aria-hidden="true"] {
    display: none !important;
}
.el-radio:focus:not(.is-focus):not(:active):not(.is-disabled) .el-radio__inner {
    box-shadow: none;
}
/* 背景图 */
#app::before{
  opacity: var(--opacity);
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-position: center;
  background-attachment: fixed;
  background-size: cover;
  background-repeat: no-repeat;
  background-image: var(--bgi);
  filter: blur(3px) brightness(0.7);
  z-index: 0;
}
/* 页面内容区域 */
#app .content, aside.el-aside, .header-content, i.sidebar-toggle, ul.el-menu.el-menu--popup{
  background-color: rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(5px) !important;
  border-radius: 5px;
}
aside.el-aside ul.el-menu-vertical.el-menu, aside.el-aside ul.el-menu.el-menu--inline{
  background-color: transparent !important;
}
#app .content{
  padding:10px;
}
/* 按钮样式 */
.el-button--default{
  background-color: rgba(255, 255, 255, 0.7) !important;
}
.el-button--default:hover{
  background-color: #ecf5ff !important;
}
.el-message-box .el-button--primary{
  background: #409EFF !important;
}
.el-message-box .el-button--primary:hover{
  background-color: #66b1ff !important;
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
::v-deep .el-dialog .el-dialog__body{
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
  padding: 0 20px;
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
  /* margin-right: 8px; */
  background-color: transparent;
}
.header .el-menu--horizontal>.el-menu-item, .header .el-menu--horizontal>.el-submenu .el-submenu__title, .el-menu--horizontal ul.el-menu li.el-menu-item{
  color: #606266;
}
.el-submenu__title:hover, ul.el-menu .el-menu-item{
  background-color: transparent !important;
}
.header .el-menu li, .header .el-menu li .el-submenu__title, .header .el-menu li .el-submenu__title i{
  font-size: 16px;
  height: 70px;
  line-height: 70px;
}
.header .el-menu li .el-submenu__title i{
  transition: all 0.3s;
}
.header .el-menu li .el-submenu__title:hover i{
  color: #303133;
}
.header .el-menu.el-menu--horizontal, aside.el-aside ul.el-menu-vertical{
  border: none;
}
.header .el-menu--horizontal>.el-menu-item:not(.is-disabled):hover, .el-menu--horizontal .el-menu-item:not(.is-disabled):hover, .el-menu--horizontal>.el-submenu .el-submenu__title:hover, aside.el-aside .el-menu-item:hover, aside.el-aside .el-submenu__title:hover {
  background-color: rgba(255, 255, 255, 0.5) !important;
}
.el-menu--horizontal .el-menu--popup{
  padding: 0;
  margin: 0;
}
/* 用户名区域 */
.header .userInfo{
  display: flex;
  cursor: pointer;
  align-items: center;
  /* 颜色和渐变 */
  color: #606266;
  transition: color .3s;
  padding: 0 10px;
  z-index: 1;
}
.header .userInfo .user-name{
  margin-left: 8px;
}
.header .userInfo .user-avatar{
  background-color: rgba(255, 255, 255, 0.7);
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
  padding: 5px;
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
}
.sidebar-show {
  left: 0;
}
aside.el-aside ul.el-menu li.el-menu-item i, aside.el-aside ul.el-menu li.el-submenu i{
  color: #606266;
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
.content-wrapper .content>div{
  margin: 10px; 
}
/* 回到顶部按钮 */
.el-backtop{
  background-color: rgba(255, 255, 255, 0.75) !important;
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
