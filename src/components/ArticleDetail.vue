<template>
    <div class="article-detail">
        <!-- 返回文章列表 -->
        <el-button 
            @click="$router.push('/article')"
        >返回</el-button>
        <!-- 修改文章 -->
        <el-button 
            v-show="isLoggedIn"
            type="danger"
            @click="clickChangeArticle"
        >修改文章</el-button>
        <!-- 刷新 -->
        <el-button 
            icon="el-icon-refresh" 
            @click="refresh"
            style="float: right;"
        ></el-button>
        <!-- 修改文章对话框 -->
        <el-dialog 
            title="修改文章" 
            :visible.sync="changeArticleVisible"
            class="changeArticle"
        >
            <el-input 
                v-model="changeArticleForm.title"
                placeholder="标题"
            ></el-input>
            <el-tooltip effect="light" :disabled="!(changeArticleForm.imgUrl)">
                <div slot="content">
                    <img 
                        :src="changeArticleForm.imgUrl" 
                        alt="图片预览"
                        style="max-width:600px; max-height:600px;"
                    >
                </div>
                <el-input 
                    v-model="changeArticleForm.imgUrl"
                    placeholder="图片url"
                ></el-input>
            </el-tooltip>
            <el-autocomplete
                v-model="changeArticleForm.category"
                :fetch-suggestions="tagsList"
                placeholder="分类"
            ></el-autocomplete>
            <el-input 
                v-model="changeArticleForm.tags"
                placeholder="标签"
            ></el-input>
            <el-input 
                type="number" 
                v-model.number="changeArticleForm.sortID"
                placeholder="sortID"
            ></el-input>
            <el-checkbox 
                label="立即显示" 
                name="isPublished"
                v-model="changeArticleForm.isPublished"
            ></el-checkbox>
            <el-input
                type="textarea"
                v-model="changeArticleForm.content"
                :rows="15"
                placeholder="内容"
            ></el-input>
            <div slot="footer" style="text-align: center;">
                <el-button 
                    type="primary" 
                    @click="changeArticle"
                >确认</el-button>
            </div>
        </el-dialog>
        <!-- 标题和时间+正在加载文字 -->
        <div class="header">
            <p v-if="isLoading" class="loading">加载文章中<i>...</i></p>
            <h1 class="title" v-if="!isLoading">{{ article.title }}</h1>
            <p class="time" v-if="!isLoading">
                <span class="create-time">创建时间 {{ article.createTime }}</span>
                <span class="update-time">修改时间 {{ article.updateTime }}</span>
            </p>
        </div>
        <!-- 文章内容 -->
        <div 
            class="content"
            ref="contentRef"
            v-html="contentHTML"
            v-if="!isLoading"
            @click="handleClick"
            v-highlight
        ></div>
        <!-- 图片点击放大 -->
        <el-image-viewer 
            v-if="showViewer"
            :url-list="imgUrlList"
            :initial-index="imageIndex"
            :on-close="closeImgViewer"
        />
    </div>
</template>

<script>
//md相关文件
import {marked} from 'marked'
import 'highlight.js/styles/stackoverflow-light.css'
import {renderImg, extractImg, renderCode, renderLink} from '../utils/rendererMD'
const renderer = {
    image(img){
        return renderImg(img);
    },
    code(code){
        return renderCode(code);        
    },
    link(link){
        return renderLink(link);
    },
}
marked.use({ 
    renderer: renderer,
});
import '../../public/css/markdown.css';
//其它
import {mapState, mapActions} from 'vuex';
import request from '../api/request';
import {copy} from '../utils/copyPaste'
import {formatTime, formatImg} from '../utils/formatters';
import {disableWindowScroll, enableWindowScroll} from '../utils/pageScroll';
import {deepClone} from '../utils/deepClone'
import {tagsList} from '../utils/tagsList'
import {loginCheck} from '../utils/loginCheck'
import {userName} from '../../config/config'
export default {
    data() {
        return {
            article: {}, //文章
            contentHTML: '', //转换后文章内容
            isLoading: false, //正在加载文章内容
            id: '', //文章id
            imgUrlList: [], //图片列表
            showViewer: false, //点击放大图片
            imageIndex: 0, //当前展示的是哪张图片
            changeArticleVisible: false, //修改文章对话框
            changeArticleForm: {}, //修改文章表单项
            formatTime, tagsList
        }
    },
    components: {
        'el-image-viewer': () => import('element-ui/packages/image/src/image-viewer')
    },
    computed: {
        ...mapState('auth', {isLoggedIn: 'token'}),
    },  
    methods: {
        ...mapActions('auth', ['isLogin', ]),
        //加载文章内容
        async refresh(){
            try{ //获取文章内容，初始化变量
                this.isLoading = true;
                const res = await request.get(`/article/${this.$route.params.id}`);
                this.article = res.data;
                this.id = this.$route.params.id;
                this.changeArticleForm = deepClone(this.article);
                document.title = `${userName} - ${this.article.title}`;
            } catch(err) {
                this.article = {};
                this.id = '';
                this.changeArticleForm = {};
                this.$message.error('获取文章失败');
                loginCheck.apply(this, ['ArticleDetail', `${err.status === 403?"无权限":"文章不存在"}`, "/article"]);
                this.isLoading = false;
                return;
            }
            try{ //格式化文章内容
                this.article.content = formatImg(this.article.content);
                this.article.createTime = formatTime(this.article.createTime);
                this.article.updateTime = formatTime(this.article.updateTime);
                this.imgUrlList = extractImg(this.article.content);
                this.contentHTML = marked(this.article.content);
                //等待DOM更新后绑定事件
                this.$nextTick(() => {
                    this.bindImageEvents();
                });
            } catch(err) {
                console.log(err); 
                this.contentHTML = "";
                this.$message.error('格式化文章失败');
                this.isLoading = false;
                return;
            }
            this.isLoading = false;
        },
        //给图片加索引
        bindImageEvents() {
            const images = this.$refs.contentRef.querySelectorAll('img');
            images.forEach((img, index) => {
                img.dataset.index = index;
            });
        },
        //处理各种点击事件
        handleClick(e) {
            const t = e.target;
            if (t.tagName === 'IMG') {
                this.imageIndex = parseInt(e.target.dataset.index);
                this.showViewer = true;
                disableWindowScroll();
            } else if(t.className === 'code-copy') {
                copy(t.nextElementSibling.innerText);
            }
            else return;
        },
        //关闭图片预览
        closeImgViewer(){
            this.showViewer = false;
            enableWindowScroll();
        },
        //点击更改文章内容按钮
        async clickChangeArticle(){
            if(!(await this.isLogin())) {
                loginCheck.apply(this, ['ArticleUpdate', '未登录', `/article/${this.id}`]);
                return;
            }
            this.changeArticleVisible = true;
        },
        //更改文章内容
        async changeArticle(){
            try {
                this.changeArticleForm.updateTime = Date.now();
                await request.patch(`/article/${this.id}`, this.changeArticleForm);
                this.changeArticleVisible = false;
                this.refresh();
            } catch (err) {
                this.$message.error('更改失败');
            }
        },
    },
    async activated() {
        await this.refresh();
        if(this.$route.query.change) this.changeArticleVisible = true;
    },
}
</script>
<style>
.changeArticle .el-input, .changeArticle .el-checkbox{
    margin-bottom: 10px;
}
.changeArticle .el-dialog__body{
    padding-bottom: 5px !important;
    padding-top: 5px !important;
}
.article-detail .header {
    margin-bottom: 10px;
    margin-top: 10px;
    padding: 0px;
}
.article-detail .header .title{
    margin: 0 !important;
    margin-bottom: 5px !important;
}
.article-detail .header .time{
    margin: 0 !important;
    font-size: 12px;
    color: #909399;
}
.article-detail .header .time .create-time{
    margin-right: 30px;
}
.article-detail .content img{
    cursor: zoom-in;
}
</style>
