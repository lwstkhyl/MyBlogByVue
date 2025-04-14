<template>
    <div class="article-list">
        <!-- 刷新 -->
        <el-button 
            icon="el-icon-refresh" 
            @click="refresh"
        ></el-button>
        <!-- 上传文章 -->
        <el-button 
            v-show="isLoggedIn" 
            type="primary"
            @click="$router.push('/article/upload')"
        >上传文章</el-button>
        <!-- 更改排序 -->
        <el-button 
            v-show="isLoggedIn" 
            type="danger"
            @click="showChangeTag"
        >更改排序</el-button>
        <!-- 显示全部文章 -->
        <el-button 
            v-show="isLoggedIn" 
            type="info"
            @click="displayAllArticle = !displayAllArticle;"
        >{{displayAllArticle ? '恢复隐藏文章' : '显示隐藏文章'}}</el-button>
        <!-- 更改排序对话框 -->
        <el-dialog title="更改排序" :visible.sync="changeTagVisible">
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
            <ul>
                <li v-for="(articles, index) in sortArticles" :key="index">
                    <p>{{tagSort[index] ? tagSort[index] : 'other'}}</p>
                    <el-card 
                        v-show="displayAllArticle || article.isPublished" 
                        v-for="article in articles" 
                        :key="article._id"
                        @click.native="$router.push(`/article/${article._id}`)"
                        class="article-card"
                    >
                        <div slot="header" class="clearfix">
                            <span class="title">{{ article.title }}</span>
                            <el-button 
                                v-if="isLoggedIn"
                                type="danger" plain
                                @click.stop="deleteArticle(article._id)"
                                style="float: right;"
                            >删除</el-button>
                            <el-button 
                                v-if="isLoggedIn"
                                type="primary" plain
                                @click.stop="hideArticle(article._id, article.isPublished)"
                                style="float: right; margin-right: 10px;"
                            >{{article.isPublished ? "隐藏" : "显示"}}</el-button>
                        </div>
                        <span class="time">{{ formatTime(article.createTime) }}</span>
                        <span class="tags">{{article.tags}}</span>
                    </el-card>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import {mapState} from 'vuex';
import request from '../api/request';
import {formatTime} from '../utils/formatters';
import {tagsListString} from '../utils/tagsList'
export default {
    data() {
        return {
            tagSort: [], //文章分类排序
            articles: [], //文章列表（未排序）
            isLoading: false, //是否正在加载文章列表
            changeTagVisible: false, //更改排序对话框
            newTag: '', //更改排序时新的排序
            displayAllArticle: false, //是否显示全部文章（包括隐藏状态的文章）
            formatTime, tagsListString
        }
    },
    computed: {
        ...mapState('auth', {isLoggedIn: 'token'}),
        //根据排序依据重新排序分类文章
        sortArticles(){
            const res = [];
            this.tagSort.forEach((tags, index)=>{
                res[index] = [];
                this.articles.forEach((article)=>{
                    if(article.category === tags){
                        res[index].push(article);
                        article.isSeleted = true;
                    }
                });
            });
            const otherIndex = res.push([]);
            this.articles.forEach((article)=>{
                if(!article.isSeleted){
                    res[otherIndex-1].push(article);
                }
            });
            return res;
        }
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
        //刷新文章列表
        async refresh(){
            try{
                this.isLoading = true;
                const res = await request.get('/article');
                this.articles = res.data.articles;
                this.tagSort = res.data.articleTagSort;
                if(this.tagSort.length === 1 && this.tagSort[0] === '') this.tagSort = [];
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
        async deleteArticle(id){ 
            try{
                await request.delete(`/article/${id}`);
                this.refresh();
            } catch (err) {
                this.$message.error('删除文章失败')
            }
        },
    },
    watch: {
        isLoggedIn(){
            this.refresh();
        }
    },
    created() { //切到该页面时刷新一次
        this.refresh();
    },
    activated() { //进行更改发生更改时刷新
        if(this.$route.query.refresh) this.refresh();
    },
}
</script>
<style>
.article-card{
    cursor: pointer;
}
.clearfix:before,
.clearfix:after {
    display: table;
    content: "";
}
.clearfix:after {
    clear: both
}
</style>