<template>
      <div class="main-container">
      <!-- 侧边栏 -->
      <el-menu
        :default-active="$route.path"
        @select="handleSelect"
        menu-trigger="hover"
        class="el-menu-vertical"
        :collapse="isCollapse"
      >
        <el-button 
          @click="toggleCollapse" 
          icon="el-icon-s-operation"
          class="collapse-menu-btn"
        ></el-button>
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
      <div class="router-content">
        <keep-alive>
          <router-view></router-view>
        </keep-alive>
      </div>
      </div>
</template>

<script>
export default {

}
</script>

<style>
.main-container {
  display: flex;
  margin-top: 60px;
}

.router-content {
  flex: 1;
  padding: 20px;
  transition: margin-left 0.3s;
  height: calc(100vh - 60px);
}
</style>