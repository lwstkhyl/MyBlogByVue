//统计数组中指定元素个数
export const arrNum = (ele, arr) => {
    return (arr.filter(e => e === ele)).length;
}
//生成不重复ID
export const getUuiD = (randomLength = 8) => {
    return Number(Math.random().toString().substr(2, randomLength) + Date.now()).toString(36)
}