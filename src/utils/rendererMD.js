import hljs from 'highlight.js'

//渲染图片宽高
export const renderImg = ({ href, text }) => {
    const title_arr = text.split('##');
    const wh_arr = title_arr[1].split(/[wh]/);
    return `
        <img 
            width="${wh_arr[1]}px" 
            height="auto" 
            max-width="100%" 
            src="${href}" 
            alt="${title_arr[0]}"
        >
    `;
};

//提取文章图片
export const extractImg = (content) => {
    const imgReg = /!\[.*?\]\((.*?)\)/g
    const imageList = [];
    let match
    while ((match = imgReg.exec(content)) !== null) {
        imageList.push(match[1])
    }
    return imageList;
};

//渲染代码行数
export const renderCode = ({ text, lang }) => {
    const lines = text.split('\n');
    // const lineNumbers = lines.map((_, index) =>
    //     `<li class="code-line-number">${index + 1}</li>`
    // ).join('');
    const highlighted = hljs.highlightAuto(text).value;
    return `
        <div class="code-block">
            <pre>
                <code class="hljs ${lang}">${highlighted}</code>
                </pre>
                </div>
                `
    // <ul class="code-number">${lineNumbers}</ul>
};
