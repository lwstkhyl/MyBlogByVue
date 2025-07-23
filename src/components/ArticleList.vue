<template>
    <div class="article-list">
        <!-- 刷新 -->
        <el-button 
            icon="el-icon-refresh" 
            @click="refresh"
        ></el-button>
        <!-- 上传文章 -->
        <el-button 
            v-show="userRole === 'admin'" 
            type="primary"
            @click="handleUpload"
        >上传文章</el-button>
        <!-- 更改排序 -->
        <el-button 
            v-show="userRole === 'admin'" 
            type="danger"
            @click="showChangeTag"
        >更改排序</el-button>
        <!-- 显示全部文章 -->
        <el-button 
            v-show="userRole === 'admin'" 
            type="info"
            @click="displayAllArticle = !displayAllArticle;"
        >{{displayAllArticle ? '恢复隐藏文章' : '显示隐藏文章'}}</el-button>
        <!-- 更改排序对话框 -->
        <el-dialog title="更改排序" :visible.sync="changeTagVisible" :append-to-body="true">
            <el-input v-model="newTag" placeholder="根据、或/分隔" @keyup.enter.native="changeTag"></el-input>
            <div slot="footer" style="text-align: center;">
                <el-button 
                    type="primary" 
                    @click="changeTag"
                >确认</el-button>
            </div>
        </el-dialog>
        <!-- 文章列表 -->
        <div class="article-list">
            <p v-if="isLoading">加载文章列表中<i>...</i></p>
            <el-collapse v-model="activeCollapse">
                <el-collapse-item 
                    v-for="(articles, index) in sortArticles" 
                    :key="index"
                    :title="`${tagSort[index] ? tagSort[index] : 'other'}（共${articles.length}篇）`"
                    :name="`${tagSort[index] ? tagSort[index] : 'other'}`"
                    :disabled="!articles.length"
                    :class="[articles.length ? '' : 'empty-item', index!==sortArticles.length-1 ? '': 'last-item']"
                >
                    <el-row :gutter="20">
                        <el-col 
                            v-for="article in articles" 
                            :key="article._id"
                            v-show="displayAllArticle || article.isPublished"
                            @click.native="handleClickCard(article._id)"
                            :xs="24" 
                            :sm="12" 
                            :md="8"
                            class="article-col"
                        >
                            <el-card class="article-card" shadow="hover">
                                <!-- 封面图片 -->
                                <div class="cover-wrapper" v-show="article.imgUrl">
                                    <img 
                                        v-show="article.imgUrl"
                                        :src="article.imgUrl" 
                                        :alt="article.title" 
                                        class="cover-image"
                                    >
                                </div>
                                <!-- 文章信息 -->
                                <div 
                                    class="article-info" 
                                    :style="`padding-bottom: ${userRole === 'admin' ? '30px' : '0px'};`"
                                >
                                    <h3 class="title">{{ article.title }}</h3>
                                    <div class="meta">
                                        <p class="time">创建时间：{{ formatTime(article.createTime) }}</p>
                                        <p class="time">修改时间：{{ formatTime(article.updateTime) }}</p>
                                        <p class="time" v-if="!tagSort[index]">标签：{{ article.category }}</p>
                                        <p class="summary" v-if="article.tags">
                                            内容概要：{{ article.tags }}
                                        </p>
                                    </div>
                                </div>
                                <div class="article-handle" v-if="userRole === 'admin'">
                                    <el-button 
                                        type="danger" plain size="mini"
                                        @click.stop="deleteArticle(article._id, article.title)"
                                        style="float: left;"
                                    >删除</el-button>
                                    <el-button 
                                        type="info" plain size="mini"
                                        @click.stop="changeArticle(article._id)"
                                        style="float: left"
                                    >修改</el-button>
                                    <el-button 
                                        type="primary" plain size="mini"
                                        @click.stop="hideArticle(article._id, article.isPublished)"
                                        style="float: left;"
                                    >{{article.isPublished ? "隐藏" : "显示"}}</el-button>
                                </div>
                            </el-card>
                        </el-col>
                    </el-row>
                </el-collapse-item>
            </el-collapse>
        </div>
    </div>
</template>

<script>
import {mapState} from 'vuex';
import request from '../api/request';
import {formatTime} from '../utils/formatters';
import {tagsListString} from '../utils/tagsList'
import {openNewTag} from '../utils/openNewTag'

export default {
    data() {
        return {
            tagSort: [], //文章分类排序
            articles: [], //文章列表（未排序）
            sortArticles: [], //文章列表（排序后）
            activeCollapse: [], //当前展开的面板
            isLoading: false, //是否正在加载文章列表
            changeTagVisible: false, //更改排序对话框
            newTag: '', //更改排序时新的排序
            displayAllArticle: true, //是否显示全部文章（包括隐藏状态的文章）
            formatTime, tagsListString
        }
    },
    computed: {
        ...mapState('auth', { userRole: 'userRole', }),
    },
    methods: {
        //显示更改排序对话框
        async showChangeTag(){
            this.changeTagVisible = true; 
            this.newTag = await this.tagsListString();
        },
        //更改排序
        async changeTag(){
            const res = this.newTag.split(/[、//]/);
            try{
                await request.post('/article/changeTagSort',{
                    value: res 
                });
                this.changeTagVisible = false;
                this.refresh();
            } catch (err) {
                this.$message.error('更改排序失败')
            }
        },
        //点击查看文章
        handleClickCard(id){
            openNewTag(`/article/${id}`);
        },
        //上传文章
        handleUpload(){
            openNewTag('/article/upload');
        },
        //刷新文章列表
        async refresh(){
            try{
                if(this.isLoading) return;
                this.isLoading = true;
                this.sortArticles = [];
                this.activeCollapse = [];
                const res = await request.get('/article');
                this.articles = res.data.articles;
                this.tagSort = res.data.articleTagSort;
                if(this.tagSort.length === 1 && this.tagSort[0] === '') this.tagSort = [];
                this.tagSort.forEach((tags, index)=>{ //根据排序依据重新排序分类文章
                    this.sortArticles[index] = [];
                    this.articles.forEach((article)=>{
                        if(article.category === tags){
                            this.sortArticles[index].push(article);
                            article.isSeleted = true;
                        }
                    });
                    if(this.sortArticles[index].length) this.activeCollapse.push(tags);
                });
                const length = this.sortArticles.length;
                this.sortArticles[length] = [];
                this.articles.forEach((article)=>{
                    if(!article.isSeleted){
                        this.sortArticles[length].push(article);
                    }
                });
                if(this.sortArticles[length].length) this.activeCollapse.push('other');
            } catch (err) {
                this.articles = [];
                this.tagSort = [];
                this.$message.error('获取文章列表失败')
            }
            this.isLoading = false;
        },
        //隐藏指定文章
        async hideArticle(id, isShow){ 
            try{
                await request.patch(`/article/${id}`,{
                    isPublished: !isShow 
                });
                this.refresh();
            } catch (err) {
                this.$message.error('隐藏文章失败')
            }
        },
        //删除指定文章
        async deleteArticle(id, title){ 
            try{
                try{
                    await this.$confirm(`确认删除：${title}`, '提示', {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning'
                    });
                } catch (err){
                    return;
                }
                await request.delete(`/article/${id}`);
                this.$message.success(`已删除：${title}`);
                this.refresh();
            } catch (err) {
                this.$message.error('删除文章失败')
            }
        },
        //修改指定文章
        changeArticle(id){
            openNewTag(`/article/${id}?change=true`);
        },
    },
    watch: {
        userRole(){
            this.refresh();
        }
    },
    created() { //切到该页面时刷新一次
        this.refresh();
    },
    activated() { //发生更改时刷新
        if(this.$route.query.refresh) this.refresh();
    },
}
</script>
<style>
.article-list .el-collapse{
    border: none !important;
}
.article-list .el-collapse .el-collapse-item{
    border-bottom: 2px dashed rgba(255, 255, 255, 0.75) !important;
}
.article-list .el-collapse .el-collapse-item:last-child{
    border-bottom: 2px dashed transparent !important;
}
.article-list .el-collapse
.article-list .el-collapse .el-collapse-item.is-disabled, .article-list .el-collapse .el-collapse-item.is-disabled .el-collapse-item__header{
    color: #606266;
}
.article-list .el-collapse .el-collapse-item__header, .article-list .el-collapse .el-collapse-item__wrap{
    background-color: transparent;
}
.article-list .el-collapse .el-collapse-item__content .el-card{
    background-color: rgba(255, 255, 255, 0.75);
}
.article-list .el-collapse-item__content{
    padding-bottom: 0px !important;
}
.article-list .el-collapse .is-active .el-collapse-item__wrap, .article-list .el-collapse .el-collapse-item__header{
    border-bottom: none;
}
.article-list .el-collapse-item__header{
    height: 60px;
    font-size: 18px;
    line-height: 60px;
    padding-top: 16px;
    padding-left: 8px;
    padding-bottom: 0;
    transition: 0.3s;
}
.article-list .empty-item .el-collapse-item__header, .article-list .el-collapse-item__header{
    padding-bottom: 16px;
    border-bottom: none;
}
.article-list .last-item .el-collapse-item__wrap, .article-list .last-item .el-collapse-item__header, .article-list .el-collapse .is-active .el-collapse-item__header{
    border-bottom: none !important;
}
.article-list .el-collapse-item__content .el-row{
    padding: 16px;
}
.article-list .article-card{
    cursor: pointer;
    height: 100%;
    transition: all 0.3s;
}
.article-list .article-col {
    margin-bottom: 20px;
}
.article-list .article-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
}
.article-list .cover-wrapper {
    height: 180px;
    overflow: hidden;
    border-radius: 4px;
}
.article-list .cover-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.article-list .article-info {
    padding: 5px;
}
.article-list .article-info p, .article-list .article-info h3{
    margin: 0 !important;
}
.article-list .article-info .title {
    color: #303133;
    font-size: 16px;
    margin: 0 0 10px;
}
.article-list .article-info .meta {
    font-size: 12px;
    color: #909399;
    margin-bottom: 10px;
}
.article-list .article-info .meta .summary{
    font-size: 14px;
    color: #606266;
}
.article-list .article-card{
    position: relative;
}
.article-list .article-handle{
    position: absolute;
    left: 20px;
    bottom: 20px;
}
/* 解决卡片高度不同问题 */
.article-list .el-row{
    display:flex;
    flex-wrap: wrap;
}
.article-list .el-row .el-card {
    min-width: 100%;
    height: 100%; 
    margin-right: 20px;
    transition: all .5s;
}
</style>