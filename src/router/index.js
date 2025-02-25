import VueRouter from 'vue-router'
import Vue from 'vue'
Vue.use(VueRouter);
// 解决ElementUI导航栏中的vue-router在3.0版本以上重复点菜单报错问题
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
    return originalPush.call(this, location).catch(err => err)
}
import FileManager from '../components/FileManager.vue'
import AvatarCreator from "../components/AvatarCreator.vue"
import MyHome from "../components/MyHome.vue"
export default new VueRouter({
    routes: [
        {
            name: 'home',
            path: '/',
            component: MyHome,
        },
        {
            name: 'file',
            path: '/file',
            component: FileManager,
            props: route => ({
                currentPath: route.query.path || ''
            })
        },
        {
            name: 'avatar',
            path: '/avatar',
            component: AvatarCreator,
        },
    ]
})