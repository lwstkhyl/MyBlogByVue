<template>
    <div class="article-detail">
        <p v-if="isLoading">加载文章列表中<i>...</i></p>
        <el-button @click="$router.push('/article')">返回</el-button>
        <h1>{{ article.title }}</h1>
        <div class="content" v-html="article.content"></div>
    </div>
</template>

<script>
import {mapState} from 'vuex';
import request from '../api/request';
import {formatTime} from '../utils/formatters';
export default {
    data() {
        return {
            article: {}, //文章内容
            isLoading: false, //正在加载文章内容
            id: '', //文章id

        }
    },
    computed: {
        ...mapState('auth', {isLoggedIn: 'token'}),
    },  
    async created() {
        try{
            this.isLoading = true;
            const res = await request.get(`/article/${this.$route.params.id}`);
            this.article = res.data;
            this.id = this.$route.params.id;
        } catch(err) {
            this.articles = {};
            this.id = '';
            this.$message.error('获取文章失败')
        }
        this.isLoading = false;
    }
}
</script>
