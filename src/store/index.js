import Vue from 'vue';
import Vuex from 'vuex';
import request from '../api/request'

Vue.use(Vuex);

const base = {
    namespaced: true,
    state: {
        isMobileAgent: /Mobi|Android|iPhone/i.test(navigator.userAgent),
    },
}

const auth = {
    namespaced: true,
    state: {
        token: localStorage.getItem('token') || '',
        userRole: '',
    },
    mutations: {
        SET_TOKEN(state, token) {
            state.token = token;
            localStorage.setItem('token', token);
        },
        LOGOUT(state) {
            state.token = '';
            localStorage.removeItem('token');
        },
    },
    actions: {
        async isLogin(context, value) {
            context.commit('SET_TOKEN', localStorage.getItem('token') || '')
            try {
                const res = await request.post('/auth/check');
                context.commit('SET_TOKEN', res.data.token)
                return true;
            } catch (err) {
                context.commit('LOGOUT');
                return false;
            }
        }
    }
}
const pan = {
    namespaced: true,
    state: {
        loadingStates: {
            fileList: false,
            storage: false,
            refresh: false,
            delete: false,
            createFolder: false,
            download: false,
            rename: false,
        }
    },
    actions: {
        async withLoading({ commit }, { type, fn }) {
            commit('SET_LOADING', { type, value: true });
            try {
                return await fn();
            } finally {
                commit('SET_LOADING', { type, value: false });
            }
        },
    },
    mutations: {
        SET_LOADING(state, { type, value }) {
            state.loadingStates[type] = value;
        },
    }
}
export default new Vuex.Store({
    modules: { auth, pan, base, }
});
