<template>
    <div class="article-manage">
        <!-- 返回文章列表 -->
        <el-button 
            @click="$router.push('/article')"
        >返回</el-button>
        <el-form 
            :model="form" 
            :rules="rules" 
            ref="form" 
        >
            <el-form-item label="标题" prop="title">
                <el-input v-model="form.title" :validate-event="false"></el-input>
            </el-form-item>
            <el-form-item label="图片url" prop="imgUrl">
                <el-tooltip effect="light" :disabled="!(form.imgUrl)">
                    <div slot="content">
                        <img 
                            :src="form.imgUrl" 
                            alt="图片预览"
                            style="max-width:600px; max-height:600px;"
                        >
                    </div>
                    <el-input 
                        v-model="form.imgUrl"
                        placeholder="图片url"
                    ></el-input>
                </el-tooltip>
            </el-form-item>
            <el-form-item label="内容" prop="content">
                <el-input
                    type="textarea"
                    v-model="form.content"
                    :rows="15"
                    :validate-event="false"
                ></el-input>
            </el-form-item>
            <el-form-item label="分类" prop="category">
                <el-autocomplete
                    v-model="form.category"
                    :fetch-suggestions="tagsList"
                    :validate-event="false"
                ></el-autocomplete>
            </el-form-item>
            <el-form-item label="标签" prop="tags">
                <el-input v-model="form.tags"></el-input>
            </el-form-item>
            <el-form-item label="序号" prop="sortID">
                <el-input type="number" v-model.number="form.sortID"></el-input>
            </el-form-item>
            <el-form-item label="立即显示？" prop="isPublished">
                <el-checkbox label="√" v-model="form.isPublished" border></el-checkbox>
            </el-form-item>
            <el-button type="primary" @click="submitForm">提交</el-button>
        </el-form>
    </div>
</template>

<script>
import {mapState, mapActions} from 'vuex';
import request from '../api/request';
import {deepClone} from '../utils/deepClone'
import {loginCheck} from '../utils/loginCheck'
import {tagsList} from '../utils/tagsList'
export default {
    data() {
        return {
            form: {
                title: '',
                imgUrl: '',
                content: '',
                tags: '',
                category: '',
                isPublished: true,
                createTime: Date.now(),
                updateTime: Date.now(),
                sortID: 0,
            }, //表单项
            initForm: deepClone(this.form), //初始表单
            rules: {
                title: [{ required: true, message: '请输入标题'}],
                content: [{ required: true, message: '请输入内容'}],
                category: [{ required: true, message: '请输入分类'}],
            }, //表单规则
            tagsList
        }
    },
    computed: {
        ...mapState('auth', {isLoggedIn: 'token'}),
    },
    methods: {
        ...mapActions('auth', ['isLogin', ]),
        //提交表单
        async submitForm() {
            this.$refs.form.validate(async valid => {
                if (valid) {
                    try {
                        await request.post('/article', this.form);
                        this.form = deepClone(this.initForm); //恢复表单
                        this.$router.push({
                            path: '/article',
                            query: {
                                refresh: true
                            }
                        });
                    } catch (err) {
                        this.$message.error('上传失败');
                    }
                }
            });
        },
    },
    watch: {
        isLoggedIn: {
            handler(newVal){
                if(this.$router.currentRoute.fullPath !== '/article/upload') return;
                if(!newVal) loginCheck(this, 'ArticleUpload');
            },
            immediate:true,
        }
    },
    mounted(){
        this.isLogin();
        window.addEventListener('keyup', (e)=>{
            if(e.key === 'Escape'){
                this.$router.push('/article');
            }
        });
    }
}
</script>
<style>
.el-autocomplete{
    width: 100%;
}
</style>