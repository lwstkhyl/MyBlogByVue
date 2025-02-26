import Vue from 'vue'
import App from './App.vue'
import router from './router';
import store from './store';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import { longpress } from './directives/longpress';
Vue.use(router);
Vue.use(ElementUI);
Vue.directive('longpress', longpress);
Vue.config.productionTip = false

new Vue({
  render: h => h(App),
  router: router,
  store
}).$mount('#app')
