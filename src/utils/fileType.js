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
        { 'typeName': 'image', 'types': ['png', 'jpg', 'jpeg', 'bmp', 'gif'] },
        // 文本类型
        { 'typeName': 'txt', 'types': ['txt'] },
        // excel类型
        // { 'typeName': 'excel', 'types': ['xls', 'xlsx'] },
        // { 'typeName': 'word', 'types': ['doc', 'docx'] },
        { 'typeName': 'excel', 'types': ['xlsx'] },
        { 'typeName': 'word', 'types': ['docx'] },
        { 'typeName': 'pdf', 'types': ['pdf'] },
        { 'typeName': 'ppt', 'types': ['ppt'] },
        // 视频类型
        { 'typeName': 'video', 'types': ['mp4', 'm2v', 'mkv'] },
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
    if (['word', 'pdf', 'excel', 'pptx',].includes(matchFileType(fileName, type)))
        return true;
    return false;
}