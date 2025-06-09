export function getFileName(filePath) {
    filePath = decodeURIComponent(filePath)
    const lastPath = filePath.substr(filePath.lastIndexOf('/') + 1, filePath.length);
    const fileName = lastPath.split('?')[0];
    return fileName;
}
export function matchFileType(fileName, type = 'file') {
    if (type !== 'file') return false;
    let suffix = '';
    let result = '';
    if (!fileName) return false;
    try {
        suffix = fileName.substr(fileName.lastIndexOf('.') + 1, fileName.length)
        suffix = suffix.toLowerCase()
    } catch (err) {
        suffix = '';
    }
    if (!suffix) {
        result = false;
        return result;
    }
    let fileTypeList = [
        // 图片类型
        { 'typeName': 'image', 'types': ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp'] },
        // 文本类型
        { 'typeName': 'txt', 'types': ['txt', 'py', 'r', 'sh', 'tsv', 'csv', 'bat', 'reg', 'md',] },
        // 视频类型
        { 'typeName': 'video', 'types': ['mp4', 'm2v', 'mkv'] },
        // pdf
        { 'typeName': 'pdf', 'types': ['pdf'] },
        // office
        { 'typeName': 'excel', 'types': ['xlsx'] },
        { 'typeName': 'word', 'types': ['docx'] },
        { 'typeName': 'pptx', 'types': ['pptx'] },
        /* 暂不支持预览 */
        //旧格式
        { 'typeName': 'xls', 'types': ['xls'] },
        { 'typeName': 'ppt', 'types': ['ppt'] },
        { 'typeName': 'doc', 'types': ['doc'] },
        // 音频
        { 'typeName': 'radio', 'types': ['mp3', 'wav', 'wmv'] }
    ]
    for (let i = 0; i < fileTypeList.length; i++) {
        const fileTypeItem = fileTypeList[i]
        const typeName = fileTypeItem.typeName
        const types = fileTypeItem.types
        result = types.some(function (item) {
            return item === suffix;
        });
        if (result) {
            return typeName
        }
    }
    return 'other'
}
export function can_view(fileName, type = 'file') {
    const file_type = matchFileType(fileName, type);
    if (['word', 'pdf', 'excel', 'pptx',].includes(file_type))
        return 'open';
    else if (['image'].includes(file_type))
        return 'img';
    else if (['txt'].includes(file_type))
        return 'txt';
    else return false;
}
