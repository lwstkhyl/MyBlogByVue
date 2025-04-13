import request from '../api/request'

export async function getTagList() { //直接返回数组格式
    try {
        let tags = (await request.get('/article/tags')).data.value;
        if (tags.length === 1 && tags[0] === '') tags = [];
        return tags;
    } catch (err) {
        return [];
    }
}

export async function tagsList(queryString, cb) { //将数组改成对象数组（value键）
    function createFilter(qs) {
        return (r) => {
            return (r.indexOf(qs) !== -1); //筛选规则：包含输入即可
        };
    }
    const tags = await getTagList();
    const res = queryString ? tags.filter(createFilter(queryString)) : tags;
    cb(res.map((ele) => {
        return { value: ele }
    }));
}

export async function tagsListString(seq = '、') { //将数组聚合成字符串
    const tags = await getTagList();
    return tags.join(seq);
}