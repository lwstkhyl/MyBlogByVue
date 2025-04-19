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
                    placeholder="双击粘贴"
                    @dblclick.native="paste"
                ></el-input>
            </el-col>
            <!-- 多选框 -->
            <el-col :span="8">
                <el-checkbox-group v-model="optionList">
                    <!-- 加换行 -->
                    <div>
                        <el-checkbox label="加换行" border></el-checkbox>
                    </div>
                    <!-- 改标题(5->4 6->5) -->
                    <div style="margin-top: 20px">
                        <el-checkbox label="改标题(5->4 6->5)" border></el-checkbox>
                    </div>
                    <!-- 改代码块位置 -->
                    <div style="margin-top: 20px">
                        <el-checkbox label="改代码块位置" border></el-checkbox>
                    </div>
                    <!-- 改图片尺寸 -->
                    <el-row style="margin-top: 20px" type="flex">
                        <el-col>
                            <el-checkbox label="改图片尺寸" border></el-checkbox>
                        </el-col>
                        <el-col>
                            <el-tooltip effect="dark" :open-delay="1000">
                                <div slot="content" v-html="sizeMapStr()"></div>
                                <el-button 
                                    type="primary" plain
                                    @click="clickChangeImgSizeMap()"
                                    style="margin-left: 5px;"
                                    :disabled="!optionList.includes('改图片尺寸')"
                                >更改图片尺寸映射</el-button>
                            </el-tooltip>
                        </el-col>
                    </el-row>
                    <!-- 改图片路径 -->
                    <el-row style="margin-top: 20px;" type="flex" justify="space-between">
                        <el-col>
                            <el-checkbox label="改图片路径" border></el-checkbox>
                        </el-col>
                        <el-col>
                            <el-tooltip effect="dark" :open-delay="1000">
                                <div slot="content">旧路径默认值：./md-image/</div>
                                <el-input
                                    placeholder="旧路径"
                                    v-model="funcArgs.oldPath"
                                    :disabled="!optionList.includes('改图片路径')">
                                </el-input>
                            </el-tooltip>
                        </el-col>
                        <el-col>
                            <el-tooltip effect="dark" :open-delay="1000">
                                <div slot="content">新路径默认值：/upload/md-image/</div>
                                <el-input
                                    placeholder="新路径"
                                    v-model="funcArgs.newPath"
                                    :disabled="!optionList.includes('改图片路径')">
                                </el-input>
                            </el-tooltip>
                        </el-col>
                    </el-row>
                    <!-- 改代码类型 -->
                    <el-row style="margin-top: 20px" type="flex">
                        <el-col>
                            <el-checkbox label="改代码类型" border></el-checkbox>
                        </el-col>
                        <el-col>
                            <el-tooltip effect="dark" :open-delay="1000">
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
                <div style="margin-top: 20px">
                    <el-button 
                        type="primary"
                        @click="copy"
                    >复制输出</el-button>
                </div>
            </el-col>
        </el-row>
        <!-- 更改图片尺寸映射对话框 -->
        <el-dialog title="更改排序" :visible.sync="changeImgSizeMapVisible">
            <el-form 
                :model="changedImgSizeMap" 
                ref="form"
                @keyup.enter.native="changeImgSizeMap" 
            >
                <el-row type="flex" justify="center" align="middle">
                    <el-col :span="10" style="display: flex; justify-content: center;">
                        图片原尺寸
                    </el-col>
                    <el-col :span="10" style="display: flex; justify-content: center;align-item:center;">
                        修改后尺寸
                    </el-col>
                    <el-col :span="4"></el-col>
                </el-row>
                <el-row 
                    v-for="(row, index) in changedImgSizeMap.arr"
                    :key="index"
                    :style="`margin-top: 20px; margin-bottom: ${index !== (changedImgSizeMap.arr.length-1) ? '0px' : '20px'};`"
                    type="flex" justify="center" align="middle"
                >
                    <el-col :span="10" style="display: flex; justify-content: center;">
                        <el-form-item label="" prop="before">
                            <el-input type="number" v-model.number="row.before"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="10" style="display: flex; justify-content: center;">
                        <el-form-item label="" prop="after">
                            <el-input type="number" v-model.number="row.after"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4" style="display: flex; justify-content: center;">
                        <el-button
                            :type="`${index !== (changedImgSizeMap.arr.length-1) ? 'danger': 'primary'}`"
                            size="small"
                            :icon="`${index !== (changedImgSizeMap.arr.length-1) ? 'el-icon-delete': 'el-icon-plus'}`"
                            @click="`${index !== (changedImgSizeMap.arr.length-1) ? deleteItem(row, index) : addItem()}`"
                        ></el-button>
                    </el-col>
                </el-row>
                <el-row type="flex" justify="space-around">
                    <el-col :span="6">
                        <el-button type="danger" @click="resetImgSizeMap">重置</el-button>
                    </el-col>
                    <el-col :span="6">
                        <el-button type="primary" @click="changeImgSizeMap">提交</el-button>
                    </el-col>
                </el-row>
            </el-form>
        </el-dialog>
    </div>
</template>
<script>
import {mapState, mapActions} from 'vuex';
import debounce from 'lodash.debounce'
import request from '../api/request';
import {funcDir, codeTypeList, get_size_map, size_map_default} from '../utils/markdownEdit'
export default {
    data() {
        return {
            content: '',
            newContent: '',
            optionList: ["加换行", "改标题(5->4 6->5)", "改代码块位置", '改图片尺寸', ],
            funcArgs:{
                codeType: '',
                newPath: '',
                oldPath: '',
                size_map: {},
            },
            changeImgSizeMapVisible: false,
            changedImgSizeMap:{
                arr: [],
            },
            codeTypeList, 
        }
    },
    computed: {
        ...mapState('auth', {isLoggedIn: 'token'}),
    },
    methods: {
        ...mapActions('auth', ['isLogin', ]),
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
            for(const old_size in this.funcArgs.size_map){
                res += `${old_size}->${this.funcArgs.size_map[old_size]}<br/>`;
            }
            return res;
        },
        async clickChangeImgSizeMap(){
            this.changeImgSizeMapVisible = true; 
            await this.refreshImgSizeMap();
            this.changedImgSizeMap = {
                arr: [],
            };
            for(const i in this.funcArgs.size_map){
                this.changedImgSizeMap.arr.push({
                    before: i,
                    after: this.funcArgs.size_map[i],
                });
            }
            this.addItem();
        },
        addItem(){
            this.changedImgSizeMap.arr.push({
                before: 0,
                after: 0,
            });
        },
        deleteItem(item, index){
            this.changedImgSizeMap.arr.splice(index, 1);
        },
        resetImgSizeMap(){
            this.changedImgSizeMap = {
                arr: [],
            };
            for(const i in size_map_default){
                this.changedImgSizeMap.arr.push({
                    before: i,
                    after: size_map_default[i],
                });
            }
            this.addItem();
        },
        async refreshImgSizeMap(){
            if((await this.isLogin())) { //如果登录
                this.funcArgs.size_map = await get_size_map();
            } else { //未登录
                this.funcArgs.size_map = JSON.parse(localStorage.getItem("imgSizeMap")) || size_map_default;
            }
        },
        async changeImgSizeMap(){
            try{
                const res = {};
                this.changedImgSizeMap.arr.forEach((value, index)=>{
                    value["before"] = parseInt(value["before"]);
                    value["after"] = parseInt(value["after"]);
                    if(value["before"] == 0 || value["after"] == 0) return;
                    res[value["before"]] = value["after"];
                });
                if((await this.isLogin())) { //如果登录
                    await request.post('/tools/imgSizeMap', {
                        value: JSON.stringify(res),
                    });
                } else { //未登录
                    localStorage.setItem("imgSizeMap", JSON.stringify(res));
                }
                this.changeImgSizeMapVisible = false;
            } catch(err){
                this.$message.error('更改图片尺寸映射失败');
            }
            this.refreshImgSizeMap();
        },
    },
    watch:{
        optionList(){
            this.update();
        },
        content(){
            this.update();
        },
        isLoggedIn(){
            this.refreshImgSizeMap();
        },
        funcArgs:{
            handler(){
                this.update();
            },
            deep: true
        },
    },
    activated() {
        this.refreshImgSizeMap();
    },
}
</script>
<style>
/* 输入框字体 */
input, input::-webkit-input-placeholder, textarea, textarea::-webkit-input-placeholder{
    font-family: -apple-system, SF UI Text, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, WenQuanYi Micro Hei, sans-serif !important;
    font-feature-settings: normal !important;
}
/* 输入框左边距 */
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
.markdown-edit .el-dialog__header{
    padding-bottom: 0px;
}
.markdown-edit .el-form-item{
    margin: 0;
}
/* 对话框滚动条 */
.el-dialog__body {
    overflow-y: auto;
    max-height: 60vh;
}
</style>