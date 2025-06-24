import Vue from 'vue';
import Vuex from 'vuex';
import request from '../api/request'

Vue.use(Vuex);
const defaultUserInfo = {
    userEmail: '1271943237@qq.com',
    userAvatar: 'https://s21.ax1x.com/2025/02/26/pE1vyj0.png',
    userURL: 'https://github.com/lwstkhyl/',
    repURL: 'https://github.com/lwstkhyl/MyBlogByVue',
    bgi: ['https://s21.ax1x.com/2025/05/23/pEzB1Z4.png'],
    bgiM: ['https://s21.ax1x.com/2024/08/24/pAFJ3TI.jpg'],
    bgiChangeTime: 60,
}
async function getUserInfo() {
    let res;
    try {
        res = await request.get('/userInfo');
        if (!res.data) res = { data: defaultUserInfo };
    } catch {
        res = { data: defaultUserInfo };
    }
    return {
        userEmail: res.data.userEmail,
        userAvatar: res.data.userAvatar,
        userURL: res.data.userURL,
        repURL: res.data.repURL,
        bgi: res.data.bgi,
        bgiM: res.data.bgiM,
        bgiChangeTime: res.data.bgiChangeTime,
    }
}

const base = {
    namespaced: true,
    state: {
        isMobileAgent: /Mobi|Android|iPhone/i.test(navigator.userAgent),
        userInfo: {},
    },
    mutations: {
        GET_USERINFO(state, userInfo) {
            state.userInfo = userInfo;
        },
    },
    actions: {
        async getUserInfo(context, value) {
            const res = await getUserInfo();
            context.commit('GET_USERINFO', res);
        },
        async updateUserInfo(context, value) {
            await request.post('/userInfo', value);
            const res = await getUserInfo();
            context.commit('GET_USERINFO', res);
        }
    }
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
        SET_USER(state, userRole) {
            state.userRole = userRole;
        },
        LOGOUT(state) {
            state.token = '';
            state.userRole = '';
            localStorage.removeItem('token');
        },
    },
    actions: {
        async isLogin(context, value) {
            context.commit('SET_TOKEN', localStorage.getItem('token') || '')
            try {
                const res = await request.post('/auth/check');
                context.commit('SET_TOKEN', res.data.token);
                context.commit('SET_USER', res.data.role);
                return res.data.role === 'admin';
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
