const { merge } = require('webpack-merge');
const $C = require('./webpack.constants');
$C.NODE_ENV = 'development';
$C.DEFINES.DOMAIN = 'localhost';
$C.DEFINES.COOKIE_DOMAIN = 'localhost';
$C.DEV_SERVER.API_URL_TARGET = $C.DEV_SERVER.API_URL_TARGET_TEST;
const createBaseConfig = require('./webpack.base');
const { getDevServer } = require('./webpack.shared');

require('events').EventEmitter.defaultMaxListeners = 0;
module.exports = () => {
    const { configs, ROUTERS } = createBaseConfig();
    return merge(configs, {
        // performance: {
        //     hints: 'warning',
        // },
        devServer: getDevServer(__dirname, $C, ROUTERS)
    });
};
