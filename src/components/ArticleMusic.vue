<template>
  <div class="article-music">
    <el-button circle :icon="wantsPlay ? 'el-icon-video-pause' : 'el-icon-headset'"
      :aria-label="wantsPlay ? '暂停背景音乐并展开播放器' : '播放背景音乐并展开播放器'"
      :aria-expanded="String(expanded)" @mouseenter.native="expanded = true"
      @focus="expanded = true" @click="handlePlayerClick"></el-button>
    <section v-show="expanded" class="music-panel" aria-label="背景音乐">
      <strong>背景音乐</strong>
      <el-button type="text" style="float: right" aria-label="收起背景音乐播放器" @click="collapse">收起</el-button>
      <p class="track-name">{{ tracks[currentIndex].slice(6) }}</p>
      <p class="track-status" role="status">{{ statusText }}</p>
      <div class="track-progress">
        <span>{{ formatTime(currentTime) }}</span>
        <el-slider ref="progressSlider" class="progress-slider" :value="currentTime" :max="duration || 1"
          :disabled="!duration || states[currentIndex] === 'error'" :show-tooltip="false"
          label="歌曲播放进度" @input="previewSeek" @change="seek"></el-slider>
        <span>{{ formatTime(duration) }}</span>
      </div>
      <div>
        <el-button size="mini" aria-label="上一首" @click="next(-1)">上一首</el-button>
        <el-button size="mini" type="primary" :disabled="allFailed" @click="toggle">{{ wantsPlay ? '暂停' : '播放' }}</el-button>
        <el-button size="mini" aria-label="下一首" @click="next(1)">下一首</el-button>
      </div>
      <el-button class="play-mode-button" type="text" size="mini" :icon="playModeIcon"
        :aria-label="'当前播放模式：' + playModeLabel + '，点击切换播放模式'"
        @click="cyclePlayMode">播放模式：{{ playModeLabel }}</el-button>
      <el-select :value="currentIndex" size="small" aria-label="选择歌曲" :popper-append-to-body="false" @change="selectTrack">
        <el-option v-for="(track, index) in tracks" :key="track" :value="index" :label="track.slice(6) + (states[index] === 'error' ? '（不可播放）' : '')" :disabled="states[index] === 'error'"></el-option>
      </el-select>
      <el-button v-if="states.includes('error')" type="text" @click="retry">重新加载失败歌曲</el-button>
    </section>
    <audio v-for="(track, index) in tracks" :key="track" ref="audio" :src="source(track)"
      :preload="index === currentIndex || index === (currentIndex + 1) % tracks.length ? 'auto' : 'metadata'"
      @canplay="ready(index)" @error="failed(index)" @playing="onPlaying(index)"
      @pause="onPause(index)" @waiting="onWaiting(index)" @ended="ended(index)"
      @loadedmetadata="syncDuration(index)" @durationchange="syncDuration(index)"
      @timeupdate="syncProgress(index)"></audio>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { baseURL } from '../../config/config';
export default {
  props: { tracks: { type: Array, required: true } },
  data(){
    return { expanded: false, currentIndex: 0, states: this.tracks.map(() => 'loading'), playing: false, wantsPlay: false, playRequest: 0, stopped: false, message: '', currentTime: 0, duration: 0, playMode: 'list' };
  },
  computed: {
    ...mapState('auth', ['token']),
    allFailed(){ return this.states.every(state => state === 'error'); },
    playModeLabel(){
      return { list: '列表循环', single: '单曲循环', random: '随机播放' }[this.playMode];
    },
    playModeIcon(){
      return { list: 'el-icon-refresh-right', single: 'el-icon-refresh', random: 'el-icon-sort' }[this.playMode];
    },
    statusText(){
      if(this.allFailed) return '暂无可播放歌曲，请检查音乐文件或访问权限';
      if(this.message) return this.message;
      if(this.playing) return `正在播放 · ${this.playModeLabel}`;
      if(this.wantsPlay) return '正在缓冲…';
      return this.states[this.currentIndex] === 'ready' ? '已就绪 · 点击播放' : '正在预加载 · 默认暂停';
    },
  },
  mounted(){
    // 文章外层使用了 backdrop-filter，会让 fixed 元素改为相对整篇文章定位。
    // 移到 body 后，音乐按钮才能始终固定在当前浏览器视口右侧。
    document.body.appendChild(this.$el);
    document.addEventListener('click', this.handleDocumentClick);
    window.addEventListener('scroll', this.handleScroll, true);
    this.notice = this.$notify({ title: '文章背景音乐', message: 'BGM 已关闭，点击右下角音乐按钮开启。', duration: 4500 });
  },
  beforeDestroy(){
    document.removeEventListener('click', this.handleDocumentClick);
    window.removeEventListener('scroll', this.handleScroll, true);
    this.stopped = true;
    this.playRequest++;
    this.wantsPlay = false;
    (this.$refs.audio || []).forEach(audio => { audio.pause(); audio.removeAttribute('src'); audio.load(); });
    if(this.notice) this.notice.close();
  },
  methods: {
    handlePlayerClick(){
      this.expanded = true;
      if(!this.allFailed) this.toggle();
    },
    handleDocumentClick(event){
      if(this.expanded && !this.$el.contains(event.target)) this.collapse();
    },
    handleScroll(event){
      const target = event.target;
      const scrolledInside = target && target.nodeType && this.$el.contains(target);
      if(this.expanded && !scrolledInside) this.collapse();
    },
    collapse(){
      this.expanded = false;
    },
    source(track){
      return `${baseURL}/api/download/${encodeURIComponent(track)}${this.token ? '?token=' + encodeURIComponent(this.token) : ''}`;
    },
    ready(index){
      if(this.stopped) return;
      this.$set(this.states, index, 'ready');
      this.syncDuration(index);
    },
    syncDuration(index){
      if(index !== this.currentIndex || this.stopped) return;
      const value = this.$refs.audio[index].duration;
      this.duration = Number.isFinite(value) ? value : 0;
    },
    syncProgress(index){
      if(index !== this.currentIndex || this.stopped || (this.$refs.progressSlider && this.$refs.progressSlider.dragging)) return;
      this.currentTime = this.$refs.audio[index].currentTime || 0;
    },
    previewSeek(value){
      this.currentTime = value;
    },
    seek(value){
      const audio = this.$refs.audio[this.currentIndex];
      if(audio && this.duration) {
        audio.currentTime = Math.min(Math.max(value, 0), this.duration);
        this.currentTime = audio.currentTime;
      }
    },
    formatTime(value){
      if(!Number.isFinite(value) || value < 0) return '0:00';
      const totalSeconds = Math.floor(value);
      const seconds = String(totalSeconds % 60).padStart(2, '0');
      const totalMinutes = Math.floor(totalSeconds / 60);
      if(totalMinutes < 60) return `${totalMinutes}:${seconds}`;
      return `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, '0')}:${seconds}`;
    },
    onPlaying(index){ if(index === this.currentIndex && !this.stopped) this.playing = true; },
    onPause(index){ if(index === this.currentIndex) this.playing = false; },
    onWaiting(index){ if(index === this.currentIndex) this.playing = false; },
    ended(index){
      if(index !== this.currentIndex || !this.wantsPlay) return;
      if(this.playMode === 'single') {
        const audio = this.$refs.audio[index];
        audio.currentTime = 0;
        this.currentTime = 0;
        this.play();
      } else this.next(1);
    },
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
    cyclePlayMode(){
      const modes = ['list', 'single', 'random'];
      this.playMode = modes[(modes.indexOf(this.playMode) + 1) % modes.length];
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
      this.currentTime = 0;
      const nextDuration = this.$refs.audio[index].duration;
      this.duration = Number.isFinite(nextDuration) ? nextDuration : 0;
      this.message = '';
      const request = this.playRequest;
      await this.$nextTick();
      if(!this.stopped && request === this.playRequest && resume) this.play();
    },
    next(direction){
      if(this.playMode === 'random') {
        const playable = this.states.reduce((indexes, state, index) => {
          if(state !== 'error') indexes.push(index);
          return indexes;
        }, []);
        const alternatives = playable.filter(index => index !== this.currentIndex);
        const candidates = alternatives.length ? alternatives : playable;
        if(candidates.length) {
          this.selectTrack(candidates[Math.floor(Math.random() * candidates.length)]);
          return;
        }
      }
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
.track-progress { display: flex; align-items: center; gap: 10px; margin: 4px 0 12px; color: #606266; font-size: 12px; font-variant-numeric: tabular-nums; }
.progress-slider { flex: 1; min-width: 0; }
.play-mode-button { padding-bottom: 0; }
.el-select { width: 100%; margin-top: 12px; }
</style>
