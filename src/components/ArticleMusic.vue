<template>
  <div class="article-music" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave" @focusin="expanded = true">
    <el-button circle :icon="playing ? 'el-icon-video-pause' : 'el-icon-headset'" aria-label="展开背景音乐播放器" :aria-expanded="String(expanded)" @click="expanded = true"></el-button>
    <section v-show="expanded" class="music-panel" aria-label="背景音乐">
      <strong>背景音乐</strong>
      <el-button type="text" style="float: right" aria-label="收起背景音乐播放器" @click="expanded = false">收起</el-button>
      <p class="track-name">{{ tracks[currentIndex].slice(6) }}</p>
      <p class="track-status" role="status">{{ statusText }}</p>
      <div>
        <el-button size="mini" aria-label="上一首" @click="next(-1)">上一首</el-button>
        <el-button size="mini" type="primary" :disabled="allFailed" @click="toggle">{{ wantsPlay ? '暂停' : '播放' }}</el-button>
        <el-button size="mini" aria-label="下一首" @click="next(1)">下一首</el-button>
      </div>
      <el-select :value="currentIndex" size="small" aria-label="选择歌曲" @change="selectTrack" @visible-change="handleSelectVisible">
        <el-option v-for="(track, index) in tracks" :key="track" :value="index" :label="track.slice(6) + (states[index] === 'error' ? '（不可播放）' : '')" :disabled="states[index] === 'error'"></el-option>
      </el-select>
      <el-button v-if="states.includes('error')" type="text" @click="retry">重新加载失败歌曲</el-button>
    </section>
    <audio v-for="(track, index) in tracks" :key="track" ref="audio" :src="source(track)"
      :preload="index === currentIndex || index === (currentIndex + 1) % tracks.length ? 'auto' : 'metadata'"
      @canplay="ready(index)" @error="failed(index)" @playing="onPlaying(index)"
      @pause="onPause(index)" @waiting="onWaiting(index)" @ended="ended(index)"></audio>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { baseURL } from '../../config/config';
export default {
  props: { tracks: { type: Array, required: true } },
  data(){
    return { expanded: false, pointerInside: false, selectVisible: false, currentIndex: 0, states: this.tracks.map(() => 'loading'), playing: false, wantsPlay: false, playRequest: 0, stopped: false, message: '' };
  },
  computed: {
    ...mapState('auth', ['token']),
    allFailed(){ return this.states.every(state => state === 'error'); },
    statusText(){
      if(this.allFailed) return '暂无可播放歌曲，请检查音乐文件或访问权限';
      if(this.message) return this.message;
      if(this.playing) return '正在播放 · 列表循环';
      if(this.wantsPlay) return '正在缓冲…';
      return this.states[this.currentIndex] === 'ready' ? '已就绪 · 点击播放' : '正在预加载 · 默认暂停';
    },
  },
  mounted(){
    // 文章外层使用了 backdrop-filter，会让 fixed 元素改为相对整篇文章定位。
    // 移到 body 后，音乐按钮才能始终固定在当前浏览器视口右侧。
    document.body.appendChild(this.$el);
    this.notice = this.$notify({ title: '文章背景音乐', message: 'BGM 已关闭，点击右下角音乐按钮开启。', duration: 4500 });
  },
  beforeDestroy(){
    this.stopped = true;
    this.playRequest++;
    this.wantsPlay = false;
    (this.$refs.audio || []).forEach(audio => { audio.pause(); audio.removeAttribute('src'); audio.load(); });
    if(this.notice) this.notice.close();
  },
  methods: {
    handleMouseEnter(){
      this.pointerInside = true;
      this.expanded = true;
    },
    handleMouseLeave(){
      this.pointerInside = false;
      if(!this.selectVisible) this.expanded = false;
    },
    handleSelectVisible(visible){
      this.selectVisible = visible;
      if(visible) this.expanded = true;
      else if(!this.pointerInside) this.expanded = false;
    },
    source(track){
      return `${baseURL}/api/download/${encodeURIComponent(track)}${this.token ? '?token=' + encodeURIComponent(this.token) : ''}`;
    },
    ready(index){ if(!this.stopped) this.$set(this.states, index, 'ready'); },
    onPlaying(index){ if(index === this.currentIndex && !this.stopped) this.playing = true; },
    onPause(index){ if(index === this.currentIndex) this.playing = false; },
    onWaiting(index){ if(index === this.currentIndex) this.playing = false; },
    ended(index){ if(index === this.currentIndex && this.wantsPlay) this.next(1); },
    failed(index){
      if(this.stopped) return;
      this.$set(this.states, index, 'error');
      if(index === this.currentIndex) this.next(1);
    },
    async play(){
      const request = ++this.playRequest;
      this.message = '';
      this.wantsPlay = true;
      try { await this.$refs.audio[this.currentIndex].play(); }
      catch(err) {
        if(this.stopped || request !== this.playRequest) return;
        if(err.name === 'NotAllowedError') {
          this.wantsPlay = false;
          this.message = '请点击播放按钮允许播放音乐';
        } else if(err.name !== 'AbortError') this.failed(this.currentIndex);
      }
    },
    toggle(){
      if(this.wantsPlay) {
        this.playRequest++;
        this.wantsPlay = false;
        this.$refs.audio[this.currentIndex].pause();
      } else this.play();
    },
    async selectTrack(index){
      if(this.stopped || this.states[index] === 'error') return;
      const resume = this.wantsPlay;
      this.playRequest++;
      const audio = this.$refs.audio[this.currentIndex];
      audio.pause();
      audio.currentTime = 0;
      this.playing = false;
      this.currentIndex = index;
      this.message = '';
      const request = this.playRequest;
      await this.$nextTick();
      if(!this.stopped && request === this.playRequest && resume) this.play();
    },
    next(direction){
      for(let offset = 1; offset <= this.tracks.length; offset++) {
        const index = (this.currentIndex + direction * offset + this.tracks.length) % this.tracks.length;
        if(this.states[index] !== 'error') { this.selectTrack(index); return; }
      }
      this.wantsPlay = false;
      this.playing = false;
      this.playRequest++;
    },
    retry(){
      this.message = '';
      this.states.forEach((state, index) => {
        if(state !== 'error') return;
        this.$set(this.states, index, 'loading');
        this.$refs.audio[index].load();
      });
    },
  },
};
</script>

<style scoped>
.article-music { position: fixed; right: 20px; bottom: 100px; z-index: 100; }
.music-panel { position: absolute; right: 0; bottom: 100%; width: 300px; max-width: calc(100vw - 40px); padding: 16px; box-sizing: border-box; border-radius: 10px; background: white; color: #303133; box-shadow: 0 2px 16px #0003; }
.track-name { overflow-wrap: anywhere; margin: 10px 0; }
.track-status { color: #606266; font-size: 12px; }
.el-select { width: 100%; margin-top: 12px; }
</style>
