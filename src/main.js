import Vue from 'vue'
import App from './App.vue'
import router from './router';
import store from './store';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import { longpress } from './directives/longpress';
import Highlight from "../public/js/highlight"
// import MetaInfo from 'vue-meta-info'
// Vue.use(MetaInfo)
Vue.use(router);
Vue.use(ElementUI);
Vue.use(Highlight);
Vue.directive('longpress', longpress);
Vue.config.productionTip = false

new Vue({
  render: h => h(App),
  router: router,
  store
}).$mount('#app')
