//渲染图片宽高
export const renderImg = ({ href, text }) => {
    const title_arr = text.split('##');
    const wh_arr = title_arr[1].split(/[wh]/);
    return `<img width="${wh_arr[1]}px" height="auto" max-width="100%" src="${href}" alt="${title_arr[0]}">`;
};
