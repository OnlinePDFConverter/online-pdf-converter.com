import Http from '@libs/http';

const ROUTES = {
    user: {
        login: 'login',
        register: 'register',
        logout: 'logout',
        checkEmail: 'checkEmail',
        heart: 'heart',
        forgotPassCheck: 'user/forgotpass/check',
        forgotPass: 'user/forgotpass',
        forgotPassVerify: 'user/forgotpass/verify',
        forgotPassReset: 'user/forgotpass/reset',
        profile: 'user/profile',
        password: 'user/password',
        checkPassword: 'user/checkPassword',
        orderCreate: 'user/orderCreate',
        unsubscribe: 'user/unsubscribe'
    }
};


const API = {
    get(name, parent) {
        let route = ROUTES[name];
        if (parent) {
            route = ROUTES[parent][name];
        }
        return API_URL + '/' + route;
    },

    async fetch(url, params, method, headers, options) {
        const http = new Http();
        // http.encType('json');
        if (headers) {
            http.addHeaders(headers);
        }
        if (options) {
            http.addOptions(options);
        }
        
        method = method || 'get';
        params = params || {};
        if (API.onFetch) {
            API.onFetch(http);
        }
        return await http[method](url, params).catch(e => {});
    },

    async login(data) {
        return API.fetch(API.get('login', 'user'), data, 'post');
    },

    async register(data) {
        return API.fetch(API.get('register', 'user'), data, 'post');
    },

    async logout() {
        return API.fetch(API.get('logout', 'user'));
    },

    async checkEmail(email) {
        return API.fetch(API.get('checkEmail', 'user'), { email });
    },

    async heart() {
        return API.fetch(API.get('heart', 'user'));
    },

    async forgotPassCheck(username) {
        return API.fetch(API.get('forgotPassCheck', 'user'), { username }, 'post');
    },

    async forgotPass(username) {
        return API.fetch(API.get('forgotPass', 'user'), { username }, 'post');
    },

    async forgotPassVerify(data) {
        return API.fetch(API.get('forgotPassVerify', 'user'), data, 'post');
    },

    async forgotPassReset(data) {
        return API.fetch(API.get('forgotPassReset', 'user'), data, 'post');
    },

    async profile(data) {
        return API.fetch(API.get('profile', 'user'), data, 'post');
    },

    async password(data) {
        return API.fetch(API.get('password', 'user'), data, 'post');
    },

    async checkPassword(data) {
        return API.fetch(API.get('checkPassword', 'user'), data);
    },

    async orderCreate(data) {
        return API.fetch(API.get('orderCreate', 'user'), data, 'post');
    },

    async unsubscribe() {
        return API.fetch(API.get('unsubscribe', 'user'), null, 'post');
    }
}

export { API };
