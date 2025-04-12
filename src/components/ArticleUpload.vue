<template>
    <div class="article-manage">
        <el-form :model="form" :rules="rules" ref="form">
            <el-form-item label="标题" prop="title">
                <el-input v-model="form.title"></el-input>
            </el-form-item>
            <el-form-item label="内容" prop="content">
                <el-input
                type="textarea"
                v-model="form.content"
                :rows="15"
                ></el-input>
            </el-form-item>
            <el-form-item label="分类" prop="category">
                <el-input v-model="form.category"></el-input>
            </el-form-item>
            <el-form-item label="标签" prop="tags">
                <el-input v-model="form.tags"></el-input>
            </el-form-item>
            <el-form-item label="序号" prop="sortID">
                <el-input type="number" v-model.number="form.sortID"></el-input>
            </el-form-item>
            <el-form-item label="是否立即显示" prop="isPublished">
                <el-checkbox label="立即显示" name="isPublished" v-model="form.isPublished"></el-checkbox>
            </el-form-item>
            <el-button type="primary" @click="submitForm">提交</el-button>
        </el-form>
    </div>
</template>

<script>
import request from '../api/request';
export default {
    data() {
        return {
            form: {
                title: '',
                content: '',
                tags: '',
                category: '',
                isPublished: true,
                createTime: Date.now(),
                updateTime: Date.now(),
                sortID: 0,
            }, //表单项
            rules: {
                title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
                content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
                category: [{ required: true, message: '请输入分类', trigger: 'blur' }],
            }, //表单规则
        }
    },
    methods: {
        async submitForm() {
            this.$refs.form.validate(async valid => {
                if (valid) {
                    try {
                        await request.post('/article', this.form);
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
        }
    }
}
</script>