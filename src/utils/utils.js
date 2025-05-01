//统计数组中指定元素个数
export const arrNum = (ele, arr) => {
    return (arr.filter(e => e === ele)).length;
}