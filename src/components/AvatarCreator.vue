<template>
  <div class="container">
    <!-- 左侧操作区域 -->
    <div class="left-panel">
      <div>
        <div class="button-group" v-show="imageUrl">
          <!-- 重置选取框 -->
          <el-button 
            type="primary" plain
            @click="initCropBox"
            style="margin-right:5px"
          >重置选取框</el-button>
          <!-- 清除图片 -->
          <el-button 
            type="danger" plain
            @click="imageUrl=''"
            style="margin-right:5px; margin-left:0px;"
          >清除图片</el-button>
          <span 
            class="image-name"
          >{{imageName}}</span>
        </div>
        <div class="input-wrapper">
          <!-- 上传文件区域 -->
          <div
            class="el-upload-dragger"
            @drop="dropFile($event)"
            @dragover="dragOverHandler($event)"
          >
            <div class="el-upload__text">
            <p>点击<em
                type="primary"
                @click="handleFileUpload"
              >选择图片</em>
            </p>
            <p class="small">或直接CTRL+V粘贴剪切板图片</p>
            </div>
          </div>

        </div>
      </div>
      <div class="image-container" ref="imageContainer">
        <img :src="imageUrl" ref="image" @load="initCropBox">
        <div class="crop-box" :style="cropStyle" @mousedown.prevent="startDrag">
          <div class="resize-handle" @mousedown.prevent="startResize"></div>
        </div>
      </div>
    </div>

    <!-- 右侧预览区域 -->
    <div class="right-panel">
      <div class="preview-box-wrapper" v-show="imageUrl">
        <div class="preview-box">
          <canvas ref="previewCanvas"></canvas>
        </div>
        <div class="btn-wrapper">
          <button class="download-btn" @click="downloadImage(false)" :disabled="!imageUrl">下载</button>
        </div>
      </div>
      <div class="preview-box-wrapper" v-show="imageUrl">
        <div class="preview-box-round preview-box">
          <canvas ref="previewCanvasRound"></canvas>
        </div>
        <div class="btn-wrapper">
          <button class="download-btn" v-show="imageUrl" @click="downloadImage(true)" :disabled="!imageUrl">下载</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {mapState, } from 'vuex';

export default {
  name: 'AvatarCreator',
  data() {
    return {
      canvasSize: 400,
      imageUrl: '',
      imageName: '',
      crop: {
        x: 0,
        y: 0,
        size: 100
      },
      imageWidth: 0,
      imageHeight: 0,
      isDragging: false,
      isResizing: false,
      startX: 0,
      startY: 0
    }
  },
  computed: {
    ...mapState('base', ['isMobileAgent', ]),
    cropStyle() {
      return {
        left: `${this.crop.x}px`,
        top: `${this.crop.y}px`,
        width: `${this.crop.size}px`,
        height: `${this.crop.size}px`
      }
    },
  },
  methods: {
    // 处理文件上传
    updateFile(file){
      if (!file) return;
      this.imageName = '';
      this.imageUrl = '';
      this.imageName = file.name;
      this.imageUrl = URL.createObjectURL(file);
    }, 

    handleFileUpload(e) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*" 
      input.style.cssText = "display:none";
      input.multiple = true;
      document.querySelector("body").appendChild(input);
      input.click();
      const _this = this;
      input.onchange = async function (e) {
        const file = e.target.files[0];
        _this.updateFile(file);
        document.querySelector("body").removeChild(input);
      }
    },

    dropFile(ev){
      ev.preventDefault();
      if (ev.dataTransfer.files[0]) {
        const file = ev.dataTransfer.files[0];
        this.updateFile(file);
      }
    },

    dragOverHandler(ev){
      ev.preventDefault();
    },

    handlePaste(event){
      const items = event.clipboardData.items;
      if (items[0].type.indexOf('image') !== -1) {
        const file = items[0].getAsFile();
        this.updateFile(file);
      }
    },

    // 初始化裁剪框
    initCropBox() {
      const img = this.$refs.image;
      if(!img) return;
      this.imageWidth = img.offsetWidth;
      this.imageHeight = img.offsetHeight;
      // 初始居中显示
      this.crop = {
        x: (this.imageWidth - this.crop.size) / 2,
        y: (this.imageHeight - this.crop.size) / 2,
        size: 100
      };
      this.updatePreview();
    },

    // 开始拖动
    startDrag(e) {
      if(this.isResizing) return;
      this.isDragging = true;
      this.startX = e.clientX - this.crop.x;
      this.startY = e.clientY - this.crop.y;
      document.addEventListener('mousemove', this.onDrag);
      document.addEventListener('mouseup', this.stopDrag);
    },

    // 拖动处理
    onDrag(e) {
      if (!this.isDragging) return;
      let newX = e.clientX - this.startX;
      let newY = e.clientY - this.startY;
      // 边界约束
      newX = Math.max(0, Math.min(newX, this.imageWidth - this.crop.size));
      newY = Math.max(0, Math.min(newY, this.imageHeight - this.crop.size));
      this.crop.x = newX;
      this.crop.y = newY;
      this.updatePreview();
    },

    // 停止拖动
    stopDrag() {
      this.isDragging = false;
      document.removeEventListener('mousemove', this.onDrag);
      document.removeEventListener('mouseup', this.stopDrag);
    },

    startResize(e) {
      this.isResizing = true;
      // 记录初始状态
      this.resizeStart = {
        x: e.clientX,
        y: e.clientY,
        size: this.crop.size,
        cropX: this.crop.x,
        cropY: this.crop.y
      };
      document.addEventListener('mousemove', this.onResize);
      document.addEventListener('mouseup', this.stopResize);
    },

    // 缩放处理（修改后）
    onResize(e) {
      if (!this.isResizing) return;
      // 计算鼠标移动距离
      const deltaX = e.clientX - this.resizeStart.x;
      const deltaY = e.clientY - this.resizeStart.y;
      // 计算新尺寸（保持正方形，取XY变化的最大值）
      const delta = Math.max(deltaX, deltaY);
      let newSize = Math.max(50, this.resizeStart.size + delta);
      // 计算最大允许尺寸（保持选框左上角不变）
      const maxSizeX = this.imageWidth - this.resizeStart.cropX;
      const maxSizeY = this.imageHeight - this.resizeStart.cropY;
      const maxSize = Math.min(maxSizeX, maxSizeY);
      newSize = Math.min(newSize, maxSize);
      // 更新尺寸（保持选框位置不变）
      this.crop.size = newSize;
      this.updatePreview();
    },

    // 停止缩放（修改后）
    stopResize() {
      this.isResizing = false;
      this.resizeStart = null; // 清除初始状态
      document.removeEventListener('mousemove', this.onResize);
      document.removeEventListener('mouseup', this.stopResize);
    },

    // 更新预览方法修改
    updatePreview() {
      this.drawPreview(this.$refs.previewCanvas, false); // 方形预览
      this.drawPreview(this.$refs.previewCanvasRound, true); // 圆形预览
    },

    // 新增绘制方法
    drawPreview(canvas, isRound) {
      const ctx = canvas.getContext('2d');
      const img = this.$refs.image;
      // 计算比例
      const ratioX = img.naturalWidth / img.offsetWidth;
      const ratioY = img.naturalHeight / img.offsetHeight;
      // 设置画布尺寸
      canvas.width = this.canvasSize;
      canvas.height = this.canvasSize;
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (isRound) {
        ctx.save();
        // 创建圆形裁剪路径
        ctx.beginPath();
        ctx.arc(this.canvasSize/2, this.canvasSize/2, this.canvasSize/2, 0, Math.PI * 2);
        ctx.clip();
      }

      // 绘制图像
      ctx.drawImage(
        img,
        this.crop.x * ratioX,
        this.crop.y * ratioY,
        this.crop.size * ratioX,
        this.crop.size * ratioY,
        0,
        0,
        this.canvasSize,
        this.canvasSize
      );
      if (isRound) {
        ctx.restore(); // 恢复绘图状态
      }
    },

    // 新增下载方法
    async downloadImage(isCircle) {
      const img = this.$refs.image;
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      const displayWidth = img.offsetWidth;
      const displayHeight = img.offsetHeight;
      // 创建高分辨率画布
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // 计算实际裁剪尺寸（基于原始分辨率）
      const scaleX = naturalWidth / displayWidth;
      const scaleY = naturalHeight / displayHeight;
      const actualCropSize = this.crop.size * Math.max(scaleX, scaleY);
      // 设置画布尺寸为实际裁剪大小
      canvas.width = actualCropSize;
      canvas.height = actualCropSize;
      // 绘制原始尺寸图像
      ctx.drawImage(
        img,
        this.crop.x * scaleX,
        this.crop.y * scaleY,
        this.crop.size * scaleX,
        this.crop.size * scaleY,
        0,
        0,
        actualCropSize,
        actualCropSize
      );
      // 创建圆形遮罩
      if(isCircle){
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        ctx.arc(actualCropSize/2, actualCropSize/2, actualCropSize/2, 0, Math.PI*2);
        ctx.fill();
      }
      // 转换为Blob并下载
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hd-image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');
    },

    handleResize(){
      if(this.$router.currentRoute.name === 'avatar')
        this.initCropBox();
    },

    handleKeyPress(e){
      if(this.$router.currentRoute.name === 'avatar'){
        const event = e || window.event;
        if(event.ctrlKey && event.key === 'v'){
          this.imageUrl = '';
        }
        if(this.imageUrl){
          event.preventDefault();
          switch (event.keyCode) {
            case 37:  //按下左箭头键
                this.crop.x--;
                break;
            case 39: //按下右箭头键
                this.crop.x++;
                break;
            case 38: //按下下箭头键
                this.crop.y--;
                break;
            case 40: //按下上箭头键
                this.crop.y++;
                break;
          }
          this.updatePreview();
        }
      }
      return false;
    },
  },

  mounted() {
    if(this.isMobileAgent){
      this.$message.error('手机端可能无法正常使用该功能')
    }
    window.removeEventListener('resize', this.handleResize);
    window.addEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyPress);
    window.addEventListener('keydown', this.handleKeyPress);
    document.removeEventListener('paste', this.handlePaste);
    document.addEventListener('paste', this.handlePaste);
  },

}
</script>

<style scoped>
.el-upload-dragger{
  background-color: transparent;
  border: 2px dashed #d9d9d9;
}
.el-upload-dragger:hover{
  border-color: #409EFF;
}
.container {
  display: flex;
}

.left-panel {
  flex: 1;
  padding: 20px;
}

.left-panel .button-group{
  padding-bottom: 20px;
}

.left-panel .input-wrapper{
  width: 100% !important;
  display: flex;
  align-items: center;
}

.left-panel .input-wrapper .el-upload-dragger{
  width: 100% !important;
  height: 90px !important;
  cursor: default !important;
}

.left-panel .input-wrapper .el-upload__text{
  padding-top: 10px !important;
}

.left-panel .input-wrapper .el-upload__text em{
  cursor: pointer !important;
}

.left-panel .input-wrapper .el-upload__text .small{
  margin: 0 !important;
  font-size: 12px !important;
  color: #606266;
}

.left-panel .image-name{
  font-size: 12px;
  color: #606266;
  margin-left: 5px;
}

.right-panel {
  width: 350px;
  padding: 20px;
  border-left: 2px solid #606266;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
}

.image-container {
  position: relative;
  margin-top: 20px;
  overflow: hidden;
}

.image-container img {
  width: 100%;
  max-width: 100%;
  display: block;
}

.crop-box {
  position: absolute;
  border: 1px solid #fff;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  cursor: move;
}

.resize-handle {
  position: absolute;
  right: -5px;
  bottom: -5px;
  width: 10px;
  height: 10px;
  background: #fff;
  cursor: nwse-resize;
}

.preview-box-wrapper{
  display: flex;
}

.preview-box {
  width: 200px;
  height: 200px;
  border: 1px solid #ccc;
  margin-top: 20px;
}

.preview-box canvas {
  width: 100%;
  height: 100%;
}

.preview-box-round {
  border-radius: 50%;
}

.preview-box-round canvas {
  width: 100%;
  height: 100%;
}

.btn-wrapper{
  display: flex;
  align-items: center;
  margin-left: 20px;
}

.download-btn {
  margin-top: 20px;
  padding: 10px 30px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.download-btn:hover {
  background: #1976d2;
}
</style>
