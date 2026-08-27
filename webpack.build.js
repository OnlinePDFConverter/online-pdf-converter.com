const { merge } = require('webpack-merge');
const $C = require('./webpack.constants');
const createBaseConfig = require('./webpack.base');
const createRewrites = require('./rewrite');
const {
    getMinimizerOptimization,
    getPurgeCssPlugin
} = require('./webpack.shared');


module.exports = () => {
    const { configs, ROUTERS } = createBaseConfig();
    if ($C.REWRITE) {
        createRewrites(ROUTERS, $C.REWRITE);
    }

    return merge(configs, {
        optimization: getMinimizerOptimization(),
        plugins: [
            getPurgeCssPlugin(__dirname)
        ]
    });
};
