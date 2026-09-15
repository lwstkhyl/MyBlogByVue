// 用法：node tests/bgm-smoke.js <playwright-core 模块目录>
// 文章/登录请求使用测试响应，音乐通过真实本地后端下载，不改动现有数据库。
const assert = require('assert');
const { chromium } = require(process.argv[2] || 'playwright-core');
const appBaseURL = process.argv[3] || 'http://127.0.0.1:8080';
const realArticlePath = process.argv[4];

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--mute-audio'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  let tracks;
  let saved;
  const fixture = {
    _id: 'bgm-test', title: 'BGM 测试文章', content: '音乐测试内容', category: '测试',
    showToc: false, isPublished: true, createTime: Date.now(), updateTime: Date.now(),
  };
  try {
    const response = await context.request.get('http://localhost:3000/api/files?path=music');
    assert.equal(response.status(), 200);
    tracks = (await response.json()).files.filter(f => /\.mp3$/i.test(f.name)).map(f => f.path);
    assert(tracks.length >= 2, '测试需要 music 下至少两首 MP3');
    fixture.bgm = tracks.slice(0, 2);
    const media = await context.request.get('http://localhost:3000/api/download/' + encodeURIComponent(tracks[0]), { headers: { Range: 'bytes=0-1023' } });
    assert.equal(media.status(), 206, '音频必须支持 Range 请求');
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if(!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
      if(url.pathname === '/api/userInfo') return route.fulfill({ json: { bgi: [], bgiM: [], userAvatar: '', bgiChangeTime: 0 } });
      if(url.pathname === '/api/auth/check') return route.fulfill({ json: { token: 'test-session', role: 'admin' } });
      if(url.pathname === '/api/article/bgm-test') {
        if(route.request().method() === 'PATCH') {
          saved = route.request().postDataJSON();
          fixture.bgm = saved.bgm;
        }
        return route.fulfill({ json: fixture });
      }
      if(url.pathname === '/api/article/empty-test') return route.fulfill({ json: { ...fixture, _id: 'empty-test', bgm: [] } });
      if(url.pathname === '/api/article/layout-test') return route.fulfill({ json: { ...fixture, _id: 'layout-test', content: '# 长文章\n\n' + '测试内容\n\n'.repeat(300) } });
      if(url.pathname === '/api/article/broken-test') return route.fulfill({ json: { ...fixture, _id: 'broken-test', bgm: ['music/not-found.mp3', tracks[0]] } });
      if(url.pathname === '/api/article/all-broken') return route.fulfill({ json: { ...fixture, _id: 'all-broken', bgm: ['music/not-found.mp3'] } });
      if(url.pathname === '/api/article' && route.request().method() === 'POST') {
        saved = route.request().postDataJSON();
        return route.fulfill({ status: 201, body: 'ok' });
      }
      return route.continue();
    });
    await page.addInitScript(() => localStorage.setItem('pureEdition', 'false'));
    await page.goto(appBaseURL + '/article/bgm-test');
    await page.waitForSelector('.article-music');
    await page.waitForFunction(() => document.querySelector('audio')?.readyState >= 3);
    assert(await page.locator('audio').evaluateAll(nodes => nodes.every(a => a.paused)), '进入文章不自动播放');
    await page.locator('.article-music > .el-button').click();
    await page.waitForFunction(() => !document.querySelector('audio').paused);
    assert.equal(await page.evaluate(() => localStorage.getItem('articleBgmPlaying')), 'true', '播放时应保存播放状态');
    await page.getByRole('button', { name: '下一首', exact: true }).click();
    await page.waitForFunction(() => !document.querySelectorAll('audio')[1].paused && document.querySelector('audio').paused);
    await page.getByRole('button', { name: '暂停', exact: true }).click();
    assert(await page.locator('audio').evaluateAll(nodes => nodes.every(a => a.paused)));
    assert.equal(await page.evaluate(() => localStorage.getItem('articleBgmPlaying')), 'false', '暂停时应保存暂停状态');
    await page.getByRole('button', { name: '播放', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('audio')[1].duration > 0);
    await page.locator('audio').nth(1).evaluate(audio => { audio.currentTime = audio.duration - 0.1; });
    await page.waitForFunction(() => !document.querySelector('audio').paused, { timeout: 15000 });
    // 保存真实 DOM 对象，验证 keep-alive 切出页面后音频停止并移除资源。
    await page.evaluate(() => { window.testAudio = [...document.querySelectorAll('audio')]; document.querySelector('#app').__vue__.$router.push('/'); });
    await page.waitForFunction(() => window.testAudio.every(audio => audio.paused && !audio.getAttribute('src')));
    assert.equal(await page.evaluate(() => localStorage.getItem('articleBgmPlaying')), 'true', '离开文章时应保留播放偏好');
    const navigate = async path => {
      await page.evaluate(path => { document.querySelector('#app').__vue__.$router.push(path); }, path);
      await page.waitForURL('**' + path);
    };
    await navigate('/article/layout-test');
    await page.waitForSelector('.article-music');
    await page.waitForFunction(() => [...document.querySelectorAll('audio')].some(audio => !audio.paused));
    assert.equal(await page.evaluate(() => localStorage.getItem('articleBgmPlaying')), 'true', '其它文章应延续播放状态');
    const musicLayout = await page.locator('.article-music').evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { parent: element.parentElement.tagName, top: rect.top, right: rect.right, bottom: rect.bottom };
    });
    assert.equal(musicLayout.parent, 'BODY', '播放器应脱离带 backdrop-filter 的文章容器');
    assert(musicLayout.top >= 0 && musicLayout.bottom <= 720 && musicLayout.right <= 1280, '长文章的音乐按钮应处于当前视口内');
    await page.locator('.article-music > .el-button').click();
    await page.waitForFunction(() => [...document.querySelectorAll('audio')].every(audio => audio.paused));
    assert.equal(await page.evaluate(() => localStorage.getItem('articleBgmPlaying')), 'false', '其它文章暂停后应更新播放状态');
    await navigate('/article/empty-test');
    await page.waitForSelector('.article-detail .title');
    assert.equal(await page.locator('.article-music').count(), 0);
    await navigate('/article/broken-test');
    await page.waitForSelector('.article-music');
    await page.waitForFunction(() => document.querySelector('.track-name')?.textContent !== 'not-found.mp3');
    await navigate('/article/all-broken');
    await page.waitForFunction(() => document.querySelector('.track-status')?.textContent.includes('暂无可播放'));
    // 编辑与创建表单使用本地 API 响应替身，验证提交的数组和顺序。
    await page.evaluate(async () => {
      localStorage.setItem('token', 'test-session');
      await document.querySelector('#app').__vue__.$store.dispatch('auth/isLogin');
    });
    await navigate('/article/bgm-test');
    await page.getByRole('button', { name: '修改文章', exact: true }).click();
    await page.waitForSelector('.music-picker');
    await page.locator('.music-order').nth(1).getByText('上移', { exact: true }).click();
    await page.getByRole('button', { name: '确认', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('.changeArticle') || getComputedStyle(document.querySelector('.changeArticle')).display === 'none');
    assert.deepEqual(saved.bgm, [tracks[1], tracks[0]]);
    await navigate('/article/upload');
    await page.waitForSelector('.article-manage');
    const form = page.locator('.article-manage .el-form');
    await form.locator('input').nth(0).fill('BGM 新文章');
    await form.locator('textarea').fill('测试内容');
    await form.locator('.el-autocomplete input').fill('测试');
    await form.getByRole('button', { name: '刷新歌曲' }).click();
    await form.locator('.music-picker .el-select').click();
    await page.locator('.el-select-dropdown:visible .el-select-dropdown__item').filter({ hasText: tracks[0].slice(6) }).click();
    await form.locator('textarea').click();
    await form.getByRole('button', { name: '提交', exact: true }).click();
    await page.waitForURL('**/article?refresh=true');
    assert.deepEqual(saved.bgm, [tracks[0]]);
    if(realArticlePath) {
      await navigate(realArticlePath);
      await page.waitForSelector('.article-music');
      const realMusicLayout = await page.locator('.article-music').evaluate(element => {
        const rect = element.getBoundingClientRect();
        return { parent: element.parentElement.tagName, top: rect.top, right: rect.right, bottom: rect.bottom };
      });
      assert.equal(realMusicLayout.parent, 'BODY', '真实文章播放器应挂在 body 下');
      assert(realMusicLayout.top >= 0 && realMusicLayout.bottom <= 720 && realMusicLayout.right <= 1280, '真实文章的音乐按钮应处于当前视口内');
    }
    assert.deepEqual(errors, [], '浏览器运行时错误');
    console.log('PASS: real music 206, fixed viewport layout, preload, persisted play/pause, next, loop, leave cleanup, legacy article, failed tracks, edit/create payloads');
  } catch(error) {
    console.error('Page URL:', page.url(), 'Runtime errors:', errors);
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
