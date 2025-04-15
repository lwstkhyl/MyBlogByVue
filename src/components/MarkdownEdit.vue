<template>
    <div class="markdown-edit">
        <el-row :gutter="20">
            <!-- 输入框 -->
            <el-col :span="16">
                <el-input
                    class="pointer"
                    type="textarea"
                    v-model="content"
                    :rows="16"
                    placeholder="双击/长按粘贴"
                    @dblclick.native="paste"
                    v-longpress="paste"
                ></el-input>
            </el-col>
            <!-- 多选框 -->
            <el-col :span="8">
                <el-checkbox-group v-model="optionList">
                    <div>
                        <el-checkbox label="加换行" border></el-checkbox>
                    </div>
                    <div style="margin-top: 20px">
                        <el-checkbox label="改标题(5->4 6->5)" border></el-checkbox>
                    </div>
                    <div style="margin-top: 20px">
                        <el-checkbox label="改代码块位置" border></el-checkbox>
                    </div>
                    <div style="margin-top: 20px">
                        <el-tooltip effect="dark" open-delay="1000">
                            <div slot="content" v-html="sizeMapStr()"></div>
                            <el-checkbox label="改图片尺寸" border></el-checkbox>
                        </el-tooltip>
                    </div>
                    <el-row style="margin-top: 20px;" type="flex" justify="space-between">
                        <el-col>
                            <el-checkbox label="改图片路径" border></el-checkbox>
                        </el-col>
                        <el-col>
                            <el-tooltip effect="dark" open-delay="1000">
                                <div slot="content">旧路径默认值：./md-image/</div>
                                <el-input
                                    placeholder="旧路径"
                                    v-model="funcArgs.oldPath"
                                    :disabled="!optionList.includes('改图片路径')">
                                </el-input>
                            </el-tooltip>
                        </el-col>
                        <el-col>
                            <el-tooltip effect="dark" open-delay="1000">
                                <div slot="content">新路径默认值：/upload/md-image/</div>
                                <el-input
                                    placeholder="新路径"
                                    v-model="funcArgs.newPath"
                                    :disabled="!optionList.includes('改图片路径')">
                                </el-input>
                            </el-tooltip>
                        </el-col>
                    </el-row>
                    <el-row style="margin-top: 20px" type="flex">
                        <el-col>
                            <el-checkbox label="改代码类型" border></el-checkbox>
                        </el-col>
                        <el-col>
                            <el-tooltip effect="dark" open-delay="1000">
                                <div slot="content">代码类型默认不加</div>
                                <el-autocomplete
                                    placeholder="代码类型"
                                    v-model="funcArgs.codeType"
                                    :fetch-suggestions="codeTypeList"
                                    :disabled="!optionList.includes('改代码类型')">
                                </el-autocomplete>
                            </el-tooltip>
                        </el-col>
                    </el-row>
                </el-checkbox-group>
            </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 40px">
            <!-- 显示结果 -->
            <el-col :span="16">
                <el-input
                    class="pointer"
                    type="textarea"
                    v-model="newContent"
                    :rows="16"
                    placeholder="双击/长按复制"
                    @dblclick.native="copy"
                    v-longpress="copy"
                ></el-input>
            </el-col>
            <!-- 按钮 -->
            <el-col :span="8">
                <div>
                    <el-button 
                        type="danger"
                        @click="content = '';"
                    >清空输入</el-button>
                </div>
                <div  style="margin-top: 20px">
                    <el-button 
                        type="primary"
                        @click="copy"
                    >复制输出</el-button>
                </div>
            </el-col>
        </el-row>
    </div>
</template>
<script>
import debounce from 'lodash.debounce'
import {funcDir, codeTypeList, size_map} from '../utils/markdownEdit'
export default {
    data() {
        return {
            content: '',
            newContent: '',
            optionList: ["加换行", "改标题(5->4 6->5)", "改代码块位置", ],
            funcArgs:{
                codeType: '',
                newPath: '',
                oldPath: '',
            },
            codeTypeList,
        }
    },
    methods: {
        update: debounce(function(){
            if(!this.content.replace(/(rn|n|r)/gm, '').trim()) {
                this.newContent = '';
                return;
            }
            this.newContent = this.content;
            this.optionList.forEach(option => {
                this.newContent = funcDir[option](this.newContent, this.funcArgs);
            });
        }, 500),
        paste(){
            navigator.clipboard.readText()
            .then((clipText) => {
                this.content = clipText;
                this.$message.success('粘贴成功');
            })
            .catch((err) => {
                this.$message.error('粘贴失败');
            });
        },
        copy(){
            try{
                let $tempTextarea = document.createElement("textarea");
                $tempTextarea.value = this.newContent;
                document.body.appendChild($tempTextarea);
                $tempTextarea.select();
                document.execCommand("copy");
                $tempTextarea.remove();
                this.$message.success('复制成功');
            } catch(err){
                this.$message.error('复制失败');
            }
        },
        sizeMapStr(){
            let res = '';
            for(const old_size in size_map){
                res += `${old_size}->${size_map[old_size]}<br/>`;
            }
            return res;
        }
    },
    watch:{
        optionList(){
            this.update();
        },
        content(){
            this.update();
        },
        funcArgs:{
            handler(){
                this.update();
            },
            deep: true
        },
    }
}
</script>
<style>
.markdown-edit .el-col-24{
    width: auto;
}
.markdown-edit .el-col .el-input{
    margin-left: 5px;
    width: auto;
}
.markdown-edit .pointer{
    cursor: pointer;
}
</style>