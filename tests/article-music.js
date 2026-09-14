// node tests/article-music.js — 无数据库写入的文章音乐接口回归测试
const assert = require('assert');
const path = require('path');
const backend = path.resolve(__dirname, '../../MyBlogBackend');
const { normalizeBgm } = require(path.join(backend, 'utils/articleMusic'));
const Article = require(path.join(backend, 'models/Article'));
const handlers = require(path.join(backend, 'utils/article'));
const response = () => ({ code: 200, status(code){ this.code = code; return this; }, send(body){ this.body = body; }, json(body){ this.body = body; } });

(async () => {
    const tracks = ['music/测试歌曲.mp3', 'music/second.ogg'];
    assert.deepStrictEqual(normalizeBgm([...tracks, tracks[0]]), tracks);
    for (const value of ['music/a.mp3', ['../music/a.mp3'], ['music/../a.mp3'], ['https://example.com/a.mp3'], ['music/a.exe'], [null], Array(51).fill(tracks[0])]) {
        assert.throws(() => normalizeBgm(value));
    }
    assert.deepStrictEqual(new Article({ title: 'old', content: 'old', category: 'old' }).toObject().bgm, []);
    let stored;
    Article.prototype.save = async function(){ stored = this.toObject(); };
    let res = response();
    await handlers.uploadArticle({ body: { title: 'test', content: 'test', category: 'test', bgm: tracks } }, res);
    assert.equal(res.code, 201);
    assert.deepStrictEqual(stored.bgm, tracks);
    Article.updateOne = async (filter, data) => { stored = data; };
    res = response();
    await handlers.updateArticle({ params: { id: 'test' }, body: { bgm: [...tracks].reverse() } }, res);
    assert.equal(res.code, 201);
    assert.deepStrictEqual(stored.bgm, [...tracks].reverse());
    res = response();
    await handlers.updateArticle({ params: { id: 'test' }, body: { bgm: [] } }, res);
    assert.deepStrictEqual(stored.bgm, []);
    res = response();
    await handlers.updateArticle({ params: { id: 'test' }, body: { title: 'keep music' } }, res);
    assert(!Object.prototype.hasOwnProperty.call(stored, 'bgm'));
    res = response();
    await handlers.updateArticle({ params: { id: 'test' }, body: { bgm: ['music/../a.mp3'] } }, res);
    assert.equal(res.code, 400);
    console.log('PASS: legacy defaults, create, reorder, clear, partial update, invalid music paths');
})().catch(err => { console.error(err); process.exitCode = 1; });
