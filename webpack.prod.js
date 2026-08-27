const { merge } = require('webpack-merge');
const $C = require('./webpack.constants');
const createBaseConfig = require('./webpack.base');
const {
    getDevServer,
    getMinimizerOptimization,
    getPurgeCssPlugin
} = require('./webpack.shared');

require('events').EventEmitter.defaultMaxListeners = 0;
module.exports = () => {
    const { configs, ROUTERS } = createBaseConfig();
    return merge(configs, {
        optimization: getMinimizerOptimization(),
        plugins: [
            getPurgeCssPlugin(__dirname)
        ],
        devServer: getDevServer(__dirname, $C, ROUTERS, { compress: true })
    });
};
