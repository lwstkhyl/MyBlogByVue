import request from '../api/request'

//图片尺寸更改映射
export const size_map_default = { //默认值
    '50': '250',
    '60': '250',
    '70': '250',
    '80': '250',
    '90': '250',
    '100': '300',
    '120': '300',
    '130': '300',
    '150': '500',
    '170': '450',
    '180': '450',
    '200': '450',
    '220': '450',
    '230': '450',
    '250': '400',
    '270': '400',
    '280': '400',
    '300': '500',
    '350': '500',
    '400': '600',
    '450': '600',
    '500': '800',
    '550': '800',
    '600': '800',
}

export async function get_size_map() {
    let size_map = size_map_default;
    try {
        const size_map_str = (await request.get('/tools/imgSizeMap')).data.value;
        if (size_map_str === '') size_map = size_map_default;
        else size_map = JSON.parse(size_map_str);
    } catch (err) {
        size_map = size_map_default;
    }
    return size_map;
}

//识别的代码类型
const code_type = ['js', 'html', 'css', 'py', 'r', '', 'sh', 'xml', 'json'];

//判断是不是表格
function is_table(line) {
    if (line.includes('| ') && line.includes(' |') && line.includes(' | ')) return true;
    return false;
}

//判断是不是表格
function is_img(line) {
    if (line.includes('!') && line.includes('(') && line.includes(')') && line.includes('[') && line.includes(']')) return true;
    return false;
}

//代码类型+```
function get_code_type(type = code_type) {
    const res = [];
    type.forEach((i) => {
        res.push('```' + ' ' + i);
        res.push('```' + i);
    });
    return res;
}

//表格后加换行
function change_table(c) {
    let res = '';
    const line_list = c.split('\n').map((line) => line + '\n');
    line_list.forEach((v, i) => {
        if ((i - 1) === line_list.length) return;
        if (is_table(line_list[i]) && !is_table(line_list[i + 1])) res += (line_list[i] + "\n");
        else res += line_list[i];
    })
    return res;
}

//加换行
const addEnter = (c) => {
    let flag = true;
    let res = '';
    const line_list = c.split('\n').map((line) => line + '\n');
    line_list.forEach((line_old) => {
        res += line_old;
        let line = line_old.replace('\n', '').trim();
        if (get_code_type().includes(line)) {
            flag = !flag;
            if (flag) res += "\n";
        }
        if (flag && !is_table(line)) res += "\n";
    })
    return change_table(res);
};

//改标题(5->4 6->5)
const changeTitle = (c) => {
    let res = '';
    const line_list = c.split('\n').map((line) => line + '\n');
    line_list.forEach((line_old) => {
        line_old = line_old.replace('######', '6个#');
        line_old = line_old.replace('#####', '5个#');
        line_old = line_old.replace('5个#', '####');
        line_old = line_old.replace('6个#', '#####');
        res += line_old;
    })
    return res;
};

//改代码块位置
const changeCodePos = (c) => {
    let is_code = false;
    let res = '';
    const line_list = c.split('\n').map((line) => line + '\n');
    line_list.forEach((line_old) => {
        let line = line_old.replace('\n', '').trim();
        if (get_code_type().includes(line) && line_old.startsWith('    ')) {
            is_code = !is_code;
            res += line_old;
            return;
        }
        if (is_code) res += line_old.slice(2);
        else res += line_old;
    })
    return res;
};

//改图片尺寸
const changeImgSize = (c, { size_map }) => {
    let res = '';
    const line_list = c.split('\n').map((line) => line + '\n');
    line_list.forEach((line) => {
        if (is_img(line)) {
            for (const old_size in size_map) {
                const new_size = size_map[old_size];
                if (line.includes(`width=${old_size}`)) {
                    line = line.replace(`width=${old_size} height=${old_size}`, `width=${new_size} height=${new_size}`)
                    break
                }
            }
            line = line.replace("width=", 'width="');
            line = line.replace(" height=", 'px" height="');
            line = line.replace("}", 'px"}');
        }
        res += line;
    });
    return res;
};

//改代码类型
const changeCodeType = (c, { codeType }) => {
    let flag = true;
    let res = '';
    const line_list = c.split('\n').map((line) => line + '\n');
    line_list.forEach((line_old) => {
        let line = line_old.replace('\n', '').trim();
        if (line === '```') {
            if (flag) {
                res += (line_old.slice(0, -1) + ' ' + codeType + '\n');
            } else {
                res += line_old;
            }
            flag = !flag;
        } else {
            res += line_old;
        }
    })
    return res;
};

//改图片路径
const changeImgPath = (c, { newPath, oldPath }) => {
    if (!oldPath) oldPath = './md-image/';
    if (!newPath) newPath = '/upload/md-image/';
    oldPath = '(' + oldPath;
    newPath = '(' + newPath;
    let res = '';
    const line_list = c.split('\n').map((line) => line + '\n');
    line_list.forEach((line) => {
        if (is_img(line)) {
            line = line.replace(oldPath, newPath);
        }
        res += line;
    });
    return res;
};

export const funcDir = {
    "加换行": addEnter,
    "改标题(5->4 6->5)": changeTitle,
    "改代码块位置": changeCodePos,
    "改图片尺寸": changeImgSize,
    '改图片路径': changeImgPath,
    "改代码类型": changeCodeType,
};

export function codeTypeList(queryString, cb) {
    function createFilter(qs) {
        return (r) => {
            return (r.indexOf(qs) !== -1); //筛选规则：包含输入即可
        };
    }
    const tags = code_type.filter((type) => type);
    const res = queryString ? tags.filter(createFilter(queryString)) : tags;
    cb(res.map((ele) => {
        return { value: ele }
    }));
}