<template>
    <div class="view-file">
        <p v-if="isLoading" class="loading">加载中<i>...</i></p>
        <vue-office-docx
            v-show="type.word"
            :src="type.word"
            @rendered="renderHandler"
            @error="errorHandler"
        />
        <vue-office-excel
            v-show="type.excel"
            :src="type.excel"
            @rendered="renderHandler"
            @error="errorHandler"
            style="height:90vh"
        />
        <vue-office-pdf
            v-show="type.pdf"
            :src="type.pdf"
            @rendered="renderHandler"
            @error="errorHandler"
        />
        <vue-office-pptx
            v-show="type.pptx"
            :src="type.pptx"
            @rendered="renderHandler"
            @error="errorHandler"
            style="height:90vh"
        />
    </div>
</template>
<script>
import VueOfficeExcel from '@vue-office/excel'
import '@vue-office/excel/lib/index.css'
import VueOfficeDocx from '@vue-office/docx'
import '@vue-office/docx/lib/index.css'
import VueOfficePdf from '@vue-office/pdf'
import VueOfficePptx from '@vue-office/pptx'

import {matchFileType} from '../utils/fileType';

export default {
    data(){
        return {
            type:{
                word: '',
                excel: '',
                pdf: '',
                pptx:'',
            },
            viewFileSrc: this.$route.query.src,
            isLoading: false,
        }
    },
    components: {VueOfficeDocx, VueOfficeExcel, VueOfficePdf, VueOfficePptx},
    watch:{
        viewFileSrc:{
            handler(newVal){
                if(!newVal) return;
                this.isLoading = true;
                const type = matchFileType(newVal)
                this.type[type] = newVal;
            },
            immediate: true,
        }
    },
    methods:{
        renderHandler(){
            this.isLoading = false;
        },
        errorHandler(){
            this.$message.error("预览文件失败");
        },
    }
}
</script>
<style scoped>
canvas.x-spreadsheet-table{
    height: 200px !important;
}
</style>