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
        <!-- 标题和时间 -->
        <div class="header">
            <p v-if="isLoading">加载文章列表中<i>...</i></p>
            <span class="title">{{ article.title }}</span>
            <span class="create-time">创建时间 {{ article.createTime }}</span>
            <span class="update-time">修改时间 {{ article.updateTime }}</span>
        </div>
        <!-- 文章内容 -->
        <div 
            class="content" 
            v-html="contentHTML"
        ></div>
    </div>
</template>

<script>
//md相关文件
import {marked} from 'marked'
import {renderImg} from '../utils/rendererMD'
const renderer = {
    image(href, _title, text){
        return renderImg(href, _title, text);
    }
}
marked.use({ renderer: renderer })
import '../../public/css/markdown.css';
//其它
import {mapState, mapActions} from 'vuex';
import request from '../api/request';
import {formatTime, formatImg} from '../utils/formatters';
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
            changeArticleVisible: false, //修改文章对话框
            changeArticleForm: {}, //修改文章表单项
            formatTime, tagsList, userName
        }
    },
    computed: {
        ...mapState('auth', {isLoggedIn: 'token'}),
    },  
    methods: {
        ...mapActions('auth', ['isLogin', ]),
        //加载文章内容
        async refresh(){
            try{
                this.isLoading = true;
                const res = await request.get(`/article/${this.$route.params.id}`);
                this.article = res.data;
                this.article.content = formatImg(this.article.content);
                this.article.createTime = formatTime(this.article.createTime);
                this.article.updateTime = formatTime(this.article.updateTime);
                this.contentHTML = marked(this.article.content);
                this.id = this.$route.params.id;
                this.changeArticleForm = deepClone(this.article);
                document.title = `${this.userName} - ${this.article.title}`;
            } catch(err) {
                this.article = {};
                this.id = '';
                this.changeArticleForm = {};
                this.$message.error('获取文章失败')
            }
            this.isLoading = false;
        },
        //点击更改文章内容按钮
        async clickChangeArticle(){
            if(!(await this.isLogin())) {
                loginCheck(this, 'ArticleUpdate', '未登录', `/article/${this.id}`);
                return;
            }
            this.changeArticleVisible = true;
        },
        //更改文章内容
        async changeArticle(){
            try {
                await request.patch(`/article/${this.id}`, this.changeArticleForm);
                this.changeArticleVisible = false;
                this.refresh();
            } catch (err) {
                this.$message.error('更改失败');
            }
        },
    },
    async activated() {
        if(!((await request.get(`/article/isShow/${this.$route.params.id}`)).data.isShow)){
            if(!(await this.isLogin())) {
                loginCheck(this, 'ArticleDetail');
                this.article = {};
                return;
            }
        }
        if(this.$route.query.change) this.changeArticleVisible = true;
        await this.refresh();
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
</style>
