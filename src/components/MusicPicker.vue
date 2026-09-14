<template>
  <div class="music-picker">
    <el-select :value="value" multiple filterable :multiple-limit="50" placeholder="选择背景音乐（可多选）" @input="$emit('input', $event)" @visible-change="onOpen">
      <el-option v-for="track in options" :key="track.path" :label="track.name" :value="track.path"></el-option>
    </el-select>
    <el-button size="small" icon="el-icon-refresh" :loading="loading" @click="loadMusic">刷新歌曲</el-button>
    <p class="music-help">从网盘 music 文件夹选择，按下方顺序循环播放；留空则关闭背景音乐。</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <div v-for="(track, index) in value" :key="track" class="music-order">
      <span>{{ index + 1 }}. {{ track.slice(6) }}</span>
      <el-button size="mini" :disabled="index === 0" @click="move(index, -1)">上移</el-button>
      <el-button size="mini" :disabled="index === value.length - 1" @click="move(index, 1)">下移</el-button>
    </div>
  </div>
</template>

<script>
import request from '../api/request';
export default {
  props: { value: { type: Array, default: () => [] } },
  data: () => ({ tracks: [], loading: false, error: '' }),
  mounted(){ this.loadMusic(); },
  computed: {
    options(){
      const missing = this.value.filter(path => !this.tracks.some(t => t.path === path));
      return [...this.tracks, ...missing.map(path => ({ path, name: path.slice(6) + '（未在目录中找到）' }))];
    },
  },
  methods: {
    onOpen(open){ if(open) this.loadMusic(); },
    async loadMusic(){
      if(this.loading) return;
      this.loading = true;
      this.error = '';
      try {
        const { data } = await request.get('/files', { params: { path: 'music' } });
        this.tracks = data.files.filter(f => f.type === 'file' && /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(f.name));
        if(!this.tracks.length) this.error = 'music 文件夹中暂无音频，请先通过网盘上传。';
      } catch(err) {
        this.error = '无法读取 music 文件夹，请检查目录是否存在及访问权限。';
      } finally { this.loading = false; }
    },
    move(index, direction){
      const tracks = [...this.value];
      [tracks[index], tracks[index + direction]] = [tracks[index + direction], tracks[index]];
      this.$emit('input', tracks);
    },
  },
};
</script>

<style scoped>
.music-picker { margin: 12px 0; }
.el-select { width: min(100%, 480px); margin-right: 8px; }
.music-help { font-size: 12px; color: #606266; }
.music-order { display: flex; align-items: center; gap: 6px; margin: 6px 0; }
.music-order span { flex: 1; overflow-wrap: anywhere; }
</style>
