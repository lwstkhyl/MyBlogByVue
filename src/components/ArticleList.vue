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
            type="primary"
            @click="changeTagVisible = true"
        >更改排序</el-button>
        <!-- 更改排序对话框 -->
        <el-dialog title="更改排序" :visible="changeTagVisible">
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
                    <el-card v-for="article in articles" v-show="article.isPublished" :key="article._id">
                        <h3>{{ article.title }}</h3>
                        <p class="time">{{ formatTime(article.createTime) }}</p>
                        <el-button @click="$router.push(`/article/${article._id}`)">阅读全文</el-button>
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
export default {
    data() {
        return {
            tagSort: [], //文章分类排序
            articles: [], //文章列表（未排序）
            isLoading: false, //是否正在加载文章列表
            changeTagVisible: false, //更改排序对话框
            newTag: '', //更改排序时新的排序
            formatTime
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
            console.log(res); 
            
            return res;
        }
    },
    methods: {
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
            } catch (err) {
                this.articles = [];
                this.tagSort = [];
                this.$message.error('获取文章列表失败')
            }
            this.isLoading = false;
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
