import VueRouter from 'vue-router'
import Vue from 'vue'
import { userName } from '../../config/config'
Vue.use(VueRouter);
// 解决ElementUI导航栏中的vue-router在3.0版本以上重复点菜单报错问题
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
    return originalPush.call(this, location).catch(err => err)
}
import FileManager from '../components/FileManager.vue'
import AvatarCreator from "../components/AvatarCreator.vue"
import MyHome from "../components/MyHome.vue"
const router = new VueRouter({
    mode: 'history',
    routes: [
        {
            name: 'home',
            path: '/',
            component: MyHome,
            meta: { title: '首页' },
        },
        {
            name: 'file',
            path: '/file',
            component: FileManager,
            props: route => ({
                currentPath: route.query.path || ''
            }),
            meta: { title: '网盘' },
        },
        {
            name: 'avatar',
            path: '/avatar',
            component: AvatarCreator,
            meta: { title: '头像编辑' },
        },
    ]
})
router.afterEach((to, _) => {
    document.title = `${userName}${to.meta.title ? ` - ${to.meta.title}` : "的网页"}`;
})
export default router
