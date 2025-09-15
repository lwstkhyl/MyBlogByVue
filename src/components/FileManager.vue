<template>
  <div class="file-manager">
    <!-- 新建文件夹组件 -->
    <el-dialog title="新建文件夹" :visible.sync="visible" :append-to-body="true">
      <el-input 
        ref="newFolderInput"
        v-model="folderName" 
        placeholder="输入文件夹名称" 
        @keyup.enter.native="createFolder"
      ></el-input>
      <div slot="footer" style="text-align: center;">
        <el-button 
          type="primary" 
          @click="createFolder"
          :loading="loadingStates.createFolder"
          :disabled="loadingStates.createFolder" 
        >确认</el-button>
      </div>
    </el-dialog>

    <!-- 重命名文件夹组件 -->
    <el-dialog title="重命名文件夹" :visible.sync="renameVisible" :append-to-body="true">
      <el-input 
        ref="renameDirInput"
        v-model="renameName" 
        placeholder="输入文件夹名称" 
        @keyup.enter.native="renameDir"
      ></el-input>
      <div slot="footer" style="text-align: center;">
        <el-button 
          type="primary" 
          @click="renameDir"
          :loading="loadingStates.rename"
          :disabled="loadingStates.rename" 
        >确认</el-button>
      </div>
    </el-dialog>

    <!-- 上传文件区域 -->
    <div
      v-show="isShowToUser"
      class="el-upload-dragger"
      @drop="dropFile($event)"
      @dragover="dragOverHandler($event)"
    >
      <div class="el-upload__text">
      <p>点击<em
          type="primary"
          @click="uploadFile"
        >上传文件</em>
        /
        <em
          type="primary"
          @click="uploadDir"
        >上传文件夹</em>或直接拖拽上传</p>
        <p class="small">文件夹同名则追加添加文件，文件同名则覆盖</p>
        <p class="small">空文件夹不会被上传，如需创建空文件夹请点“新建文件夹”</p>
        <p class="small">文件名不能包含\、/、..等字符</p>
        <p class="small">user用户只在public文件夹下有权限</p>
      </div>
    </div>
    <!-- 上传文件列表 -->
    <el-dialog 
      title="上传文件列表" 
      @close="uploadFilesListVisible = false"
      :visible="uploadFilesListVisible" 
      :append-to-body="true"
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
        <el-button 
          type="info" 
          size="mini"
          @click="uploadFilesList = uploadFilesList.filter(file=>file.status!=='success')"
        >只保留失败</el-button>
      </div>
    </el-dialog>

    <!-- 刷新/新建文件夹/上传列表/下载和删除选中/总占用空间 -->
    <el-row 
      type="flex" 
      justify="space-between" 
      align="middle" 
      :gutter="20"
      style="margin-top:10px;"
    >
      <el-col :span="18" class="top-btn">
        <!-- 刷新 -->
        <el-button 
          size="medium"
          icon="el-icon-refresh" 
          :loading="loadingStates.refresh"
          :disabled="loadingStates.refresh"
          @click="handleRefresh"
        ></el-button>
        <!-- 新建文件夹 -->
        <el-button 
          v-show="isShowToUser" 
          type="primary" size="medium"
          @click="visible = true; $nextTick(() => $refs.newFolderInput.focus())"
        >新建文件夹</el-button>
        <!-- 显示上传列表 -->
        <el-button 
          v-show="isShowToUser && uploadFilesList.length" 
          type="info" plain size="medium"
          @click="uploadFilesListVisible = true"
        >显示上传列表</el-button>
        <!-- 下载选中文件 -->
        <el-button 
          v-show="selectedFiles.length" 
          type="primary" plain size="medium"
          :disabled="loadingStates.delete || loadingStates.download || loadingStates.rename"
          :loading="loadingStates.download"
          @click="downloadSelected"
        >下载选中文件</el-button>
        <!-- 删除选中文件 -->
        <el-button 
          v-show="selectedFiles.length && isShowToUser"
          type="danger" plain size="medium"
          :disabled="loadingStates.delete || loadingStates.rename"
          :loading="loadingStates.delete"
          @click="handleDelete"
        >删除选中文件</el-button>
        <!-- 删除选中文件 -->
        <el-button 
          v-show="selectedFiles.length && this.userRole === 'admin'"
          type="warning" plain size="medium"
          @click="handleChangeFilePrivate"
        >切换隐藏/显示</el-button>
      </el-col>
      <el-col :span="6">
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
        <el-table-column type="selection" width="45"></el-table-column>
        <el-table-column prop="name" label="名称" sortable>
          <template v-slot="{ row }">
            <span 
              class="file-item"
              :class="[
                row.type === 'directory' ? 'file-item-folder' : 'file-item-document',
                row.private ? 'hide-file' : ''
              ]"
              @click="handleItemClick(row, $event)"
            >
              <i :class="row.type === 'directory' ? 'el-icon-folder' : 'el-icon-document'"></i>
              {{ row.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="大小" width="100" sortable>
          <template v-slot="{ row }">
            {{ row.type === 'directory' ? '-' : formatSize(row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="ctimeMs" label="修改时间" width="160" sortable>
          <template v-slot="{ row }">
            {{ formatTime(row.ctimeMs) }}
          </template>
        </el-table-column>
        <el-table-column :width="`${isShowToUser?290:200}`">
          <template slot="header">
            <span>操作  </span>
            <el-tooltip :open-delay="0">
              <div slot="content">
                下载失败的可能原因：<br/>
                1. 文件不存在/发生改变，请刷新页面<br/>
                2. 权限不足，请刷新页面<br/>
                3. 下载的文件夹中包含权限不足的子文件/文件夹，请分别下载<br/>
              </div>
              <i class="el-icon-question download-tooltip"></i>
            </el-tooltip>
          </template>  
          <template v-slot="{ row }">
              <el-tooltip effect="dark" :open-delay="500">
                <div slot="content">长按复制下载链接</div>
                <el-button 
                  size="mini"
                  :disabled="loadingStates.delete || loadingStates.download || loadingStates.rename"
                  :loading="loadingStates.download"
                  @click.stop.prevent="downloadFile(row.path, row.type)"
                  v-longpress.stop.prevent="() => copyDownloadPath(row.path, row.type, row.private)"
                >下载</el-button>
              </el-tooltip>
            <el-button 
              v-show="isShowToUser"
              type="danger" 
              size="mini"
              :disabled="loadingStates.delete || loadingStates.rename"
              :loading="loadingStates.delete"
              @click.stop="deleteFile(row.path)"
            >删除</el-button>
            <el-button 
              v-show="isShowToUser"
              type="warning" 
              size="mini"
              :disabled="loadingStates.rename"
              @click.stop="clickRename(row.name, row.type)"
            >重命名</el-button>
            <el-tooltip effect="dark" :open-delay="500" v-if="can_view(row.path, row.type)==='img'">
              <div slot="content">长按复制图片链接</div>
              <el-button 
                type="info" 
                size="mini"
                :disabled="loadingStates.delete || loadingStates.rename"
                @click.stop.prevent="viewFile(row.path)"
                v-longpress.stop.prevent="() => copyImgPath(row.path, row.private)"
              >预览</el-button>
            </el-tooltip>
            <el-button 
              v-else-if="can_view(row.path, row.type)"
              type="info" 
              size="mini"
              :disabled="loadingStates.delete || loadingStates.rename"
              @click.stop.prevent="viewFile(row.path, row.name)"
            >预览</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <!-- 图片预览 -->
    <el-image-viewer
      v-if="visibleImg"
      :url-list="[viewImgSrc]"
      :on-close="closeImgViewer"
    />
    <!-- txt预览 -->
    <el-dialog title="txt预览" :visible.sync="visibleTxt" class="txt-viewer" :append-to-body="true">
      <h3>文件名：{{viewTxtSrc.title}}</h3>
      <div style="white-space: pre-wrap;">{{ viewTxtSrc.content }}</div>
      <div slot="footer" style="text-align: center;">
        <el-button 
          type="primary" 
          @click="closeTxtViewer"
        >关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import {mapState, mapActions, } from 'vuex';
import {baseURL, } from '../../config/config'
import request from '../api/request';
import {can_view, getFileName} from '../utils/fileType';
import {encodeFileName} from '../utils/crypto';
import {disableWindowScroll, enableWindowScroll} from '../utils/pageScroll';
import {formatSize, formatTime, formatSpeed, formatTime_hms} from '../utils/formatters';
import {getUuiD} from '../utils/utils';
import {copy} from '../utils/copyPaste'
import {openNewTag} from '../utils/openNewTag'

export default {
  name: 'FileManager',
  props: ['currentPath'],
  components: {
    'el-image-viewer': () => import('element-ui/packages/image/src/image-viewer')
  },
  data() {
    return {
      files: [], //文件列表
      emptyText: '加载中...', //文件列表为空/加载失败时显示的文本
      currentDir: this.currentPath, //当前目录
      totalSize: null, //总占用空间
      selectedFiles: [], //表格中已选中的文件
      visible: false, //新建文件夹窗口
      folderName: '', //新建文件夹名称
      renameVisible: false, //重命名文件窗口
      renameName: '', //重命名文件名称
      renameOldName: '', //重命名前文件名称
      renameFileType: '', //重命名的文件类型
      uploadFilesList: [], //上传文件列表
      uploadFilesListVisible: false, //上传文件列表可见性
      isDownload: true, //下载/复制下载链接
      isPreview: true, //下载/复制预览链接
      viewImgSrc: '', //预览的图片url
      viewTxtSrc: {title:'', content:"", }, //预览的txt文件内容和标题
      visibleImg: false, //预览img
      visibleTxt: false, //预览txt
      formatSize, formatTime, formatSpeed, formatTime_hms, //格式化函数
      can_view,
    }
  },
  computed: {
    ...mapState('auth', {isLoggedIn: 'token', userRole: 'userRole'}),
    ...mapState('pan', ['loadingStates']),
    pathParts() { //分隔目录
      return this.currentDir.split('/').filter(p => p) //过滤掉空字符串
    },
    isPublicDir(){
      return this.currentPath.startsWith('public');
    },
    isShowToUser(){
      return (this.isPublicDir && this.isLoggedIn) || this.userRole === 'admin';
    },
  },

  watch:{
    userRole(newVal){
        this.handleRefresh();
    },
    currentPath(newVal){
        this.currentDir = newVal;
    },
    currentDir(newVal){
        this.handleRefresh();
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

  // mounted() {
  //   this.handleRefresh();
  // },

  activated(){
    this.handleRefresh();
  },

  methods: {
    ...mapActions('pan', ['withLoading']),
    ...mapActions('auth', ['isLogin', ]),
    
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
      await this.isLogin();
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
        if (window.event.ctrlKey) openNewTag(this.$route.fullPath);
        this.currentDir = item.path
      }
    },

    //点击文件导航栏时更改当前目录
    navigateTo(index) {
      if (window.event.ctrlKey) openNewTag(this.$route.fullPath);
      const parts = this.pathParts.slice(0, index + 1)
      this.currentDir = parts.join('/')
    },
    
    //上传
    uploadOneFile(file, relativePath) { //上传单个文件
      file['uid'] = getUuiD()
      const fileList = {}
      for (const key in file) {
        fileList[key] = file[key]
      }
      this.uploadFilesList.push({ ...fileList, progress: 0, status: 'uploading' }) // 文件上传状态status:uploading、success、error 
      this.uploadFilesListVisible = true; //显示上传列表
      this.httpRequest(file, parms => { 
        this.showProgress(fileList, parms)
      }, relativePath)
    },
    showProgress(file, parms,) { //显示进度条
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
    async httpRequest(file, callback, relativePath) { //发送请求
      if(!relativePath) relativePath = file.webkitRelativePath;
      // 编码文件名
      const encodedFile = new File([file], encodeFileName(file.name), {
        type: file.type,
        lastModified: file.lastModified,
      });
      const formData = new FormData();
      const filePath = relativePath ?
        ((this.currentDir?this.currentDir+'/':'')+relativePath.split('/').slice(0, -1).join('/')) :
        this.currentDir;
      formData.append('files', encodedFile);
      formData.append('path', encodeURIComponent(filePath));
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
    //上传文件
    uploadFile(){
      try{
        const input = document.createElement("input");
        input.type = "file";
        input.setAttribute("allowdirs", "true");
        input.setAttribute("directory", "true");
        input.style.cssText = "display:none";
        input.multiple = true;
        document.querySelector("body").appendChild(input);
        input.click();
        const _this = this;
        input.onchange = async function (e) {
          const files = e.target["files"];
          for(const key in files){
            if(files[key] instanceof File){
              _this.uploadOneFile(files[key])
            }
          }
          document.querySelector("body").removeChild(input);
        }
      } catch(err) {
        this.$message.error('上传失败')
      }
    },
    //上传文件夹
    uploadDir(){
      try{
        const input = document.createElement("input");
        input.type = "file";
        input.setAttribute("allowdirs", "true");
        input.setAttribute("directory", "true");
        input.style.cssText = "display:none";
        input.setAttribute("webkitdirectory", "true");
        input.multiple = true;
        document.querySelector("body").appendChild(input);
        input.click();
        const _this = this;
        input.onchange = async function (e) {
          const files = e.target["files"];
          for(const key in files){
            if(files[key] instanceof File){
              _this.uploadOneFile(files[key])
            }
          }
          document.querySelector("body").removeChild(input);
        }
      } catch(err) {
        this.$message.error('上传失败')
      }
    },
    //拖动上传
    dropFile(ev){
      ev.preventDefault();
      if (ev.dataTransfer.items) {
        for (let i = 0; i < ev.dataTransfer.items.length; i++) {
          const fileItems = ev.dataTransfer.items[i].webkitGetAsEntry();
          this.fileTypeLoop(fileItems);
        }
      }
    },
    fileTypeLoop(fileItem) { //根据文件类型，如果是文件就上传，文件夹则递归调用
      let dirReader = null;
      if (fileItem.isFile) { //文件
        const relativePath = fileItem.fullPath.slice(1);
        fileItem.file((file) => {
          this.uploadOneFile(file, relativePath);
        });
      } else if (fileItem.isDirectory) { //文件夹
        dirReader = fileItem.createReader();
        dirReader.readEntries(this.onReadEntries);
      }
    },
    onReadEntries (entries) { //读取文件夹内文件
      for (let i = 0; i < entries.length; i++) {
        this.fileTypeLoop(entries[i]);
      }
    },
    dragOverHandler(ev){
      ev.preventDefault();
    },
    
    //创建文件夹
    async createFolder(){
      this.folderName = this.folderName.trim();
      if (!this.folderName) return this.$message.error('文件夹名不能为空');
      await this.withLoading({
        type: 'createFolder',
        fn: async () => {
          let isSuccess = true;
          try{
            await request.post('/create', {
              folderPath: this.currentPath,
              folderName: this.folderName,
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

    //点击重命名按钮
    clickRename(name, type){
      this.renameOldName = name;
      this.renameName = name;
      this.renameFileType = type;
      this.renameVisible = true; 
      this.$nextTick(() => this.$refs.renameDirInput.focus());
    },

    //重命名文件夹
    async renameDir(){
      this.renameName = this.renameName.trim()
      if (!this.renameName) return this.$message.error('文件夹名不能为空');
      await this.withLoading({
        type: 'rename',
        fn: async () => {
          let isSuccess = true;
          try{
            await request.post('/rename', {
              currentPath: this.currentPath,
              oldName: this.renameOldName,
              newName: this.renameName,
              type: this.renameFileType,
            });
            this.renameVisible = false;
            this.$message.success('重命名成功');
          } catch (err) {
            isSuccess = false;
            this.$message.error(`重命名失败${err.response?'：'+err.response.data.error: ''}`);
          }
          if(!isSuccess) return;
          this.handleRefresh();
        }
      });
    },

    //删除单个文件
    async deleteFile(path) {
      try{
        await this.$confirm('确认删除', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
      } catch (err){
        return;
      }
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
      try{
        await this.$confirm('确认删除', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
      } catch (err){
        return;
      }
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

    //更改文件显示/隐藏
    async handleChangeFilePrivate() {
      try{
        const pathList = [];
        this.selectedFiles.forEach(({path, type}) => {
          pathList.push({
            path: encodeURIComponent(path),
            type: type
          });
        });
        await request.post(`/changeFilePrivate`,{
          data: pathList
        });
        this.$message.success('更改成功');
      }catch{
        this.$message.error(`更改选中文件失败`); 
      }
      this.handleRefresh();

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
      });
    },
    RowIsSelected(row){
      return this.selectedFiles.find(c => c.rowIndex == row.rowIndex);
    },
    rowClick(row, column, event) {
      let refsElTable = this.$refs.fileTable;
      if(window.event.shiftKey){
        let startRowIndex; //第一个选中的行
        if(!this.selectedFiles[0]){
          startRowIndex = 0;
        }else{
          startRowIndex = this.selectedFiles[0].rowIndex;
          this.selectedFiles.forEach(c=>{
            if(c.rowIndex<startRowIndex) startRowIndex = c.rowIndex;
          });
        }
        const endRowIndex = row.rowIndex; //按住shift时点击的行
        const isSelected = this.RowIsSelected(this.files[endRowIndex]); //按住shift时点击的行是否被选中
        if(startRowIndex<endRowIndex){
          for(let i=startRowIndex;i<=endRowIndex;i++) refsElTable.toggleRowSelection(this.files[i], !isSelected);
        }else{
          for(let i=endRowIndex;i<=startRowIndex;i++) refsElTable.toggleRowSelection(this.files[i], !isSelected);
        }
      }else{
        refsElTable.toggleRowSelection(row, !this.RowIsSelected(row));
      }
    },
    rowClassName({ row,  rowIndex }) {
      let rowName = "",
      findRow = this.selectedFiles.find(c => c.rowIndex === row.rowIndex);
      if (findRow) {
          rowName = "current-row "; 
      }
      return rowName;
    },

    //预览
    async viewFile(path, name) {
      if(!this.isPreview){
        this.isPreview = true;
        return;
      }
      const fileType = can_view(path);
      if(fileType === 'open'){ //在新窗口打开
        const url = this.$router.resolve({
            path: '/viewFile',
            query: {
                fileName: name,
                src: `${baseURL}/api/download/${encodeURIComponent(path)}?token=${this.isLoggedIn}`,
            }
        });
        window.open(url.href, '_blank');
      } else if(fileType === 'img'){ //图片
        this.viewImgSrc = `${baseURL}/api/viewFile/${encodeURIComponent(path)}?time=${Date.now()}&token=${this.isLoggedIn}`;
        this.visibleImg = true;
        disableWindowScroll();
      } else if(fileType === 'txt'){ //txt
        try{
          const res = await request.get(`${baseURL}/api/viewFile/${encodeURIComponent(path)}?time=${Date.now()}&token=${this.isLoggedIn}`);
          this.viewTxtSrc.content = res.data;
          this.viewTxtSrc.title = getFileName(path);
          this.visibleTxt = true;
        }catch(err){
          this.$message.error('无法获取该文件');
        }
      } else {
        this.$message.error('该类型文件不可预览');
      }
    },
    //关闭图片预览窗口
    closeImgViewer(){
      this.visibleImg = false;
      enableWindowScroll();
    },
    //关闭txt预览窗口
    closeTxtViewer(){
      this.visibleTxt = false;
    },

    //单选下载
    async downloadFile(path, type) {
      if(!this.isDownload){
        this.isDownload = true;
        return;
      }
      await this.withLoading({
        type: 'download',
        fn: () => {
          try{
            if(type === 'directory'){ //如果要下载的是目录
              window.open(
                `${baseURL}/api/download/?files=${encodeURIComponent(JSON.stringify(path))}&token=${this.isLoggedIn}`
              );
            } else { //如果是普通单一文件
              window.open(
                `${baseURL}/api/download/${encodeURIComponent(path)}?token=${this.isLoggedIn}`,
              );
            }
          } catch(err) {
            this.$message.error('下载失败');
          }
        }
      });
    },

    //复制下载链接
    copyDownloadPath(path, type, isPrivate){
      this.isDownload = false;
      const token = isPrivate ? `token=${this.isLoggedIn}` : '';
      const url = (type === 'directory') ?
        `${baseURL}/api/download/?files=${encodeURIComponent(JSON.stringify(path))}&token=${this.isLoggedIn}` :
        `${baseURL}/api/download/${encodeURIComponent(path)}?${token}`;
      copy(url);
    },
    //复制图片链接
    copyImgPath(path, isPrivate){
      this.isPreview = false;
      const token = isPrivate ? `token=${this.isLoggedIn}` : '';
      copy(`${baseURL}/api/viewFile/${encodeURIComponent(path)}?time=${Date.now()}&${token}`);
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
              `${baseURL}/api/download/?files=${encodeURIComponent(JSON.stringify(paths))}&token=${this.isLoggedIn}`
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
.file-manager .el-upload-dragger{
  cursor: default !important;
  height: 180px !important;
  border: 2px dashed #d9d9d9 !important;
  background-color: transparent;
}
.file-manager .el-upload-dragger:hover{
  border-color: #409EFF !important;
}
.el-upload__text{
  padding-top: 20px;
}
.el-upload__text em{
  cursor: pointer !important;
}
.el-upload__text .small{
  margin: 0 !important;
  font-size: 12px !important;
  color: #606266;
}
/* 上方按钮区 */
.file-manager .top-btn{
  display: flex;
  flex-wrap: nowrap;
  overflow: hidden;
}
.file-manager .top-btn:hover{
  z-index: 1;
  overflow: visible;
}
/* 文件列表 */
.file-item {
  padding: 5px;
}
.file-item-folder{
  cursor: pointer;
}
.hide-file{
  background-color: rgba(211, 211, 211, 0.4);
}
/* 路径导航 */
.path-navigation{
  margin: 10px;
}
.path-navigation .el-breadcrumb__separator{
  color: #d9d9d9;
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
  color: #606266;
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
/* 表头操作的说明 */
.file-manager .download-tooltip{
  cursor: pointer;
}
.file-manager .download-tooltip:hover{
  color: #409EFF;
}
/* 表格单元格hover */
.file-manager .el-table__body tr:hover>td{
  background-color: rgba(255, 255, 255, 0.2) !important;
}
.file-manager .el-table__body tr.current-row>td.el-table__cell, .file-manager .el-table__body tr.selection-row>td.el-table__cell {
  background-color: hsla(201, 100%, 66%, 0.356) !important;
}
/* 表格背景透明 */
.file-manager .el-table, .file-manager .el-table th.el-table__cell, .file-manager .el-table tr, .file-manager .el-table td.el-table__cell, .file-manager .el-table::before {
  background-color: transparent !important;
  border: none !important;
}
/* 表头字体颜色 */
.file-manager .el-table thead .cell{
  color: #606266;
}
.file-manager .sort-caret.ascending{
  border-bottom-color: #909399;
}
.file-manager .sort-caret.descending{
  border-top-color: #909399;
}
/* 取消多选框选中动画 */
.el-checkbox__inner, .el-checkbox__inner::after{
  transition: transform 0s !important;
}
/* txt预览对话框 */
.txt-viewer .el-dialog__body{
  height: 50vh;
  overflow: auto;
}
.txt-viewer .el-dialog__body{
  padding-top: 0;
}
</style>
