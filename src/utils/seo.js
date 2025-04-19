import { userName, userEmail } from '../../config/config'
export function getMetaInfo(title = '个人网站') {
    return {
        // title: `${userName}的${title}`,
        meta: [
            {
                name: 'description',
                content: `${userName}，这是我的个人博客，主要用来记录日常和学习笔记`,
            },
            {
                name: 'keywords',
                content: `个人博客,${userName},技术,WEB,blog,BLOG,日常记录,日常生活,VUE博客,${userName}的博客`
            },
            {
                name: 'anthor',
                content: `${userName}, ${userEmail}`
            },
            {
                name: 'robots',
                content: `个人博客,${userName},技术,WEB,blog,BLOG,日常记录,日常生活,VUE博客,${userName}的博客`
            },
        ],
    }
}