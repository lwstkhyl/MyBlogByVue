<template>
  <div class="file-manager">
    <!-- 新建文件夹组件 -->
    <el-dialog title="新建文件夹" :visible.sync="visible">
      <el-input v-model="folderName" placeholder="输入文件夹名称" @keyup.enter.native="createFolder"></el-input>
      <div slot="footer" style="text-align: center;">
        <el-button 
          type="primary" 
          @click="createFolder"
          :loading="loadingStates.createFolder"
          :disabled="loadingStates.createFolder" 
        >确认</el-button>
      </div>
    </el-dialog>

    <!-- 上传文件区域 -->
    <el-upload
      v-show="isLoggedIn"
      class="upload-demo"
      drag
      action="#"
      :show-file-list="false"
      :multiple="true"
      :before-upload="beforeUpload"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">拖拽或<em>点击上传文件</em></div>
    </el-upload>

    <!-- 上传文件列表 -->
    <el-dialog 
      title="上传文件列表" 
      @close="uploadFilesListVisible = false"
      :visible="uploadFilesListVisible" 
    >
      <el-table :data="uploadFilesList" style="width: 100%" max-height="450" >
        <el-table-column prop="name" :show-overflow-tooltip="true" label="名称">
          <template v-slot="{ row }">
              <i class='el-icon-document'></i>
              {{ row.name }}
          </template>
        </el-table-column>
        <el-table-column width="300" prop="name" label="是否成功">
          <template v-slot="{ row }">
            <template v-if="row.status==='success'">上传成功！</template>
            <template v-else-if="row.status==='error'">上传失败!</template>
            <el-progress v-else :percentage="row.progress" />
          </template>
        </el-table-column>
        <el-table-column width="120" prop="size" label="大小">
          <template v-slot="{ row }">
            {{ formatSize(row.size) }}
          </template>
        </el-table-column>
        <el-table-column width="120" prop="speed" label="上传速度">
          <template v-slot="{ row }">
            {{ formatSpeed(row.speed) }}
          </template>
        </el-table-column>
        <el-table-column width="120" prop="time" label="剩余时间">
          <template v-slot="{ row }">
            {{ formatTime_hms(row.time) }}
          </template>
        </el-table-column>
        <el-table-column width="120" prop="handle" label="操作">
          <template v-slot="{ row, $index }">
            <el-button 
              v-if="row.status !== 'uploading'"
              type="danger" plain
              size="mini"
              @click="uploadFilesList.splice($index, 1)"
            >隐藏该文件</el-button>
            <el-button
              v-else
              type="danger" 
              size="mini"
              @click="try{row.cancel();uploadFilesList.splice($index, 1)}catch{Message({ message: '取消上传失败', type: 'error' })}"
            >取消上传</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" style="text-align: center;">
        <el-button 
          type="danger" 
          size="mini"
          @click="uploadFilesList = []"
        >清空列表</el-button>
      </div>
    </el-dialog>

    <!-- 刷新/新建文件夹/上传列表/下载和删除选中/总占用空间 -->
    <el-row 
      type="flex" 
      class="row-bg" 
      justify="space-between" 
      align="middle" 
      :gutter="20"
      style="margin-top:5px;"
    >
      <el-col :span="16">
        <!-- 刷新 -->
        <el-button 
          icon="el-icon-refresh" 
          :loading="loadingStates.refresh"
          :disabled="loadingStates.refresh"
          @click="handleRefresh"
        ></el-button>
        <!-- 新建文件夹 -->
        <el-button 
          v-show="isLoggedIn" 
          type="primary"
          @click="visible = true"
        >新建文件夹</el-button>
        <!-- 显示上传列表 -->
        <el-button 
          v-show="isLoggedIn && uploadFilesList.length" 
          type="info" plain
          @click="uploadFilesListVisible = true"
        >显示上传列表</el-button>
        <!-- 下载选中文件 -->
        <el-button 
          v-show="selectedFiles.length" 
          type="primary" plain
          :disabled="loadingStates.delete || loadingStates.download"
          :loading="loadingStates.download"
          @click="downloadSelected"
        >下载选中文件</el-button>
        <!-- 删除选中文件 -->
        <el-button 
          v-show="selectedFiles.length && isLoggedIn"
          type="danger" plain
          :loading="loadingStates.delete"
          :disabled="loadingStates.delete"
          @click="handleDelete"
        >删除选中文件</el-button>
      </el-col>
      <el-col :span="8">
        <div class="stat" v-show="isLoggedIn">
          总占用空间：<i>{{ !loadingStates.storage ? formatSize(totalSize) : '计算中...' }}</i>
        </div>
      </el-col>
    </el-row>

    <!-- 文件展示区域 -->
    <div class="fileShow">
      <!-- 路径导航 -->
        <el-breadcrumb 
          separator="|"
          class="path-navigation"
        >
          <el-breadcrumb-item 
            v-show="loadingStates.fileList" 
          ><p class="loading">加载中...</p></el-breadcrumb-item>
          <template v-if="!loadingStates.fileList">
            <el-breadcrumb-item 
              v-show="pathParts.length && !loadingStates.fileList" 
              @click.native="navigateTo(pathParts.length-2)" 
              class="click-a"
            >返回上一级</el-breadcrumb-item>
            <el-breadcrumb separator=">">
              <el-breadcrumb-item 
                @click.native="navigateTo(-1)"
                :class="pathParts.length ? 'click-a' : ''" 
              >全部文件</el-breadcrumb-item>
              <el-breadcrumb-item 
                v-for="(part, index) in pathParts" 
                :key="index"
                @click.native="navigateTo(index)"
                :class="(index === pathParts.length-1) ? '' : 'click-a'"
              >{{ part || '全部文件' }}</el-breadcrumb-item>
            </el-breadcrumb>
          </template>
        </el-breadcrumb>

      <!-- 文件列表 -->
      <el-table 
        :data="files"
        ref="fileTable"
        @selection-change="handleSelectionChange"
        style="width: 100%"
        @row-click="rowClick"  
        :row-style="rowStyle" 
        :row-class-name="rowClassName"
      >
        <div slot="empty">
          <p v-if="loadingStates.fileList" class="loading">加载中<i>...</i></p>
          <p v-else>{{emptyText}}</p>
        </div>
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="name" label="名称">
          <template v-slot="{ row }">
            <span 
              class="file-item"
              :class="row.type === 'directory' ? 'file-item-folder' : 'file-item-document'"
              @click="handleItemClick(row, $event)"
            >
              <i :class="row.type === 'directory' ? 'el-icon-folder' : 'el-icon-document'"></i>
              {{ row.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="大小" width="120">
          <template v-slot="{ row }">
            {{ row.type === 'directory' ? '-' : formatSize(row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="ctimeMs" label="修改时间" width="240">
          <template v-slot="{ row }">
            {{ formatTime(row.ctimeMs) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template v-slot="{ row }">
            <el-button 
              size="mini"
              :disabled="loadingStates.delete || loadingStates.download"
              :loading="loadingStates.download"
              @click.stop="downloadFile(row.path, row.type)"
            >下载</el-button>
            <el-button 
              v-show="isLoggedIn"
              type="danger" 
              size="mini"
              :loading="loadingStates.delete"
              :disabled="loadingStates.delete"
              @click.stop="deleteFile(row.path)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import {mapState, mapGetters, mapActions, mapMutations} from 'vuex';
import { Message } from 'element-ui';
import {baseURL, timeout} from '../../config/config'
import request from '../api/request';
import {encodeFileName} from '../utils/crypto';
import {formatSize, formatTime, formatSpeed, formatTime_hms} from '../utils/formatters';
// import FileUpload from './FileUpload.vue'

export default {
  name: 'FileManager',
  props: ['currentPath'],
  data() {
    return {
      files: [], //文件列表
      emptyText: '加载中...', //文件列表为空/加载失败时显示的文本
      currentDir: this.currentPath, //当前目录
      totalSize: null, //总占用空间
      selectedFiles: [], //表格中已选中的文件
      visible: false, //新建文件夹窗口
      folderName: '', //新建文件夹名称
      uploadFilesList: [], //上传文件列表
      uploadFilesListVisible: false, //上传文件列表可见性
      formatSize, formatTime, formatSpeed, formatTime_hms, //格式化函数
    }
  },

  computed: {
    ...mapState('auth', {isLoggedIn: 'token'}),
    ...mapState('pan', ['loadingStates']),
    pathParts() { //分隔目录
      return this.currentDir.split('/').filter(p => p) //过滤掉空字符串
    },
  },

  watch:{
    isLoggedIn(newVal){
      if(newVal){
        this.updateTotalSize();
      }
    },
    uploadFilesList:{
      deep: true,
      // immediate: true, 
      handler(newVal){
        if(!newVal.filter(file=>file.status!=='success').length){ //全部成功
          this.uploadFilesListVisible = false; //隐藏上传列表
          if(newVal.length) this.uploadFilesList.length = 0; //如果上传列表不空则清空
        }
        if(!newVal.filter(file=>file.status==='uploading').length){ //没有处于正在上传状态的
          this.handleRefresh(); //刷新
        }
      }
    }
  },

  async mounted() {
    this.handleRefresh();
  },

  methods: {
    ...mapActions('pan', ['withLoading']),

    //加载文件列表
    async loadFiles() {
      this.files = [];
      await this.withLoading({
        type: 'fileList',
        fn: async () => {
          try {
            const res = await request.get('/files', {
              params: { path: this.currentDir }
            })
            this.files = res.data.files
            this.emptyText = '此目录中无文件';
            this.$router.push({ // 更新URL
              query: { path: this.currentDir } 
            })
          } catch (err) {
            this.files = [];
            this.emptyText = '加载失败，请重试';
            this.$message.error('加载文件列表失败')
          }
        }
      });
    },

    //更新总占用空间
    async updateTotalSize() {
      if(!this.isLoggedIn) return;
      this.totalSize = null;
      await this.withLoading({
        type: 'storage',
        fn: async () => {
          try {
            const res = await request.get('/stats');
            this.totalSize = res.data.totalSize;
          } catch (err) {
            this.totalSize = null;
            this.$message.error('计算总占用空间失败');
          }
        }
      });
    },

    //刷新
    async handleRefresh(){
      await this.withLoading({
        type: 'refresh',
        fn: async () => {
          await Promise.all([
            this.loadFiles(),
            this.updateTotalSize()
          ]);
        }
      });
    },

    //点击表格中文件夹时更改当前目录
    handleItemClick(item, e) {
      if (item.type === 'directory') {
        e.stopPropagation();
        this.currentDir = item.path
        this.loadFiles()
      }
    },

    //点击文件导航栏时更改当前目录
    navigateTo(index) {
      const parts = this.pathParts.slice(0, index + 1)
      this.currentDir = parts.join('/')
      this.loadFiles()
    },
    
    //上传文件
    beforeUpload(file) {
      const fileList = {}
      for (const key in file) {
        fileList[key] = file[key]
      }
      this.uploadFilesList.push({ ...fileList, progress: 0, status: 'uploading' }) // 文件上传状态status:uploading、success、error 
      this.uploadFilesListVisible = true; //显示上传列表
      this.httpRequest(file, parms => { 
        this.showProgress(fileList, parms)
      })
      return false// 阻止 el-upload的默认上传
    },
    showProgress(file, parms) {
      const { progress, status, time, speed, cancel } = parms
      const arr = [...this.uploadFilesList].map(items => {
        if (items.uid === file.uid) {
          items.progress = progress
          items.status = status
          items.time = time
          items.speed = speed
          items.cancel = cancel
        }
        return items
      })
      this.uploadFilesList = [...arr]
    },
    async httpRequest(file, callback) {
      // 编码文件名
      const encodedFile = new File([file], encodeFileName(file.name), {
        type: file.type,
        lastModified: file.lastModified
      });
      const formData = new FormData();
      formData.append('files', encodedFile);
      formData.append('path', encodeURIComponent(this.currentDir));
      // 声明计算进度/速度/剩余时间的变量
      let progress = 0; //初始进度
      let lastLoaded = 0; //上一时刻已上传的大小
      let lastTime = Date.now(); //上一时刻的时间
      let cancel = null;
      request.post('/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data;charset=UTF-8',
          'Authorization': `Bearer ${this.token}`
        },
        timeout: 0, //取消超时限制
        cancelToken: new axios.CancelToken(c => cancel = c),
        onUploadProgress: progressEvent => {
          const { loaded, total } = progressEvent; //当前已上传的大小、文件总大小
          const currentTime = Date.now(); //当前时间
          const timeDiff = (currentTime - lastTime) / 1000; //时间差
          const speed = (loaded - lastLoaded) / timeDiff; //速度
          lastLoaded = loaded; 
          lastTime = currentTime; //更新当前时间和已上传大小
          const time = (total - loaded) / speed; //剩余时间
          progress = (loaded / total * 100) | 0; //进度
          callback({ 
            progress, 
            status: 'uploading', 
            speed, 
            time: parseInt(time), 
            cancel,
          })
        }
      }).then(() => { // 成功状态
        callback({ progress, status: 'success' })
      }).catch(() => { // 失败状态
        callback({ progress, status: 'error' })
      });
    },
    
    //创建文件夹
    async createFolder(){
      if (!this.folderName.trim()) return this.$message.error('文件夹名不能为空');
      await this.withLoading({
        type: 'createFolder',
        fn: async () => {
          let isSuccess = true;
          try{
            await request.post('/create', {
              folderPath: this.currentPath,
              folderName: this.folderName.trim()
            });
            this.folderName = '';
            this.visible = false;
            this.$message.success('创建成功');
          } catch (err) {
            isSuccess = false;
            this.$message.error(`创建失败${err.response?'：'+err.response.data.error: ''}`);
          }
          if(!isSuccess) return;
          this.handleRefresh();
        }
      });
    },

    //删除单个文件
    async deleteFile(path) {
      await this.withLoading({
        type: 'delete',
        fn: async () => {
          let isSuccess = true;
          try {
            await request.delete(`/files/${encodeURIComponent(path)}`);
            this.$message.success('删除成功');
          } catch (err) {
            isSuccess = false;
            this.$message.error('删除失败');
          }
          if(!isSuccess) return;
          this.handleRefresh();
        }
      });
    },

    //删除多个文件
    async handleDelete() {
      await this.withLoading({
        type: 'delete',
        fn: async () => {
          let isSuccess = true;
          await Promise.all(
            this.selectedFiles.map(async ({path}) => {
              try {
                await request.delete(`/files/${encodeURIComponent(path)}`);
              } catch (err) {
                isSuccess = false;
                this.$message.error(`删除失败：${path}`);
              }
            }
          ));
          if(isSuccess) this.$message.success('删除成功');
          else return this.$message.error(`删除选中文件失败`); 
          this.handleRefresh();
        }
      });
    },

    //表格处理（点击行时选中该行）
    handleSelectionChange(files){
      this.selectedFiles = files; 
    },
    rowStyle({row,rowIndex}) {
      Object.defineProperty(row, 'rowIndex', {
          value: rowIndex, 
          writable: true,
          enumerable: false
          })
      },
    rowClick(row, column, event) {
          let refsElTable = this.$refs.fileTable;
          let findRow = this.selectedFiles.find(c => c.rowIndex == row.rowIndex);
          if (findRow) {
              refsElTable.toggleRowSelection(row, false);
              return;
          }
          refsElTable.toggleRowSelection(row,true);
      },
    rowClassName({ row,  rowIndex }) {
          let rowName = "",
          findRow = this.selectedFiles.find(c => c.rowIndex === row.rowIndex);
          if (findRow) {
              rowName = "current-row "; 
          }
          return rowName;
      },

    //单选下载
    async downloadFile(path, type) {
      await this.withLoading({
        type: 'download',
        fn: () => {
          try{
            if(type === 'directory'){ //如果要下载的是目录
              window.open(
                `${baseURL}/api/download/?files=${encodeURIComponent(JSON.stringify(path))}`
              );
            } else { //如果是普通单一文件
              window.open(
                `${baseURL}/api/download/${encodeURIComponent(path)}`,
              );
            }
          } catch(err) {
            this.$message.error('下载失败');
          }
        }
      });
    },

    // 多选下载
    async downloadSelected() {
      await this.withLoading({
        type: 'download',
        fn: () => {
          try{
            if (this.selectedFiles.length === 1 && this.selectedFiles[0].type !== 'directory') {
              return this.downloadFile(this.selectedFiles[0].path);
            }
            const paths = this.selectedFiles.map(f => f.path);
            window.open(
              `${baseURL}/api/download/?files=${encodeURIComponent(JSON.stringify(paths))}`
            );
          } catch(err) {
            this.$message.error('下载失败');
          }
        }
      });
    },
  }
}
</script>
<style>
/* 上传区域100%宽度 */
.upload-demo, .el-upload, .el-upload-dragger{
  width: 100% !important;
}
/* 文件列表 */
.file-item {
  padding: 5px;
}
.file-item-folder{
  cursor: pointer;
}
/* 路径导航 */
.path-navigation{
  margin: 10px;
}
/* 路径导航链接可点击 */
.el-breadcrumb__inner {
  cursor: pointer;
}
.click-a .el-breadcrumb__inner:hover{
  text-decoration: underline
}
.click-a .el-breadcrumb__inner{
  color: #09AAFF;
}
/* 总占用空间文字 */
.stat{
  font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif;
  font-size: 16px;
  color: #606266;
  font-weight: 500;
  text-align: right;
}
.stat i{
  color: #909399;
  font-weight: bold;
  font-style: normal;
}
/* 表格加载中文字 */
p.loading{
  margin: 0 !important;
}
.loading i {
    display: inline-block; 
    height: 1em;
    line-height: 1;
    text-align: left;
    vertical-align: -.25em;
    overflow: hidden;
}
.loading i::before {
    display: block;
    content: '...\A..\A.';
    white-space: pre-wrap;
    animation: dot 1s infinite step-start both;
}
@keyframes dot {
    33% { transform: translateY(-2em); }
    66% { transform: translateY(-1em); }
}
/* 表格单元格hover */
.el-table__body tr:hover>td{
    background-color: hsla(201, 100%, 66%, 0.356) !important;
}
/* 取消多选框选中动画 */
.el-checkbox__inner, .el-checkbox__inner::after{
  transition: transform 0s !important;
}
</style>
