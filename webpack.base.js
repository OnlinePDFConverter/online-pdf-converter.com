const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const { getMessages } = require('./i18n.js');
const $C = require('./webpack.constants');
const {
    getCorePlugins,
    getModuleRules,
    getPerformance,
    getResolve
} = require('./webpack.shared');

let entries = {};
const ENTRY_DIR = path.resolve(__dirname, 'src/entry');
entryGenerator(ENTRY_DIR);

function entryGenerator(dirPath, parnetName = '') {
    fs.readdirSync(dirPath).forEach(dirName => {
        if (dirName[0] == '_') {
            return;
        }
        let entryName = parnetName + dirName;
        let pathName = path.join(dirPath, dirName);
        if (fs.statSync(pathName).isDirectory()) {
            return entryGenerator(pathName, entryName + '_');
        } else {
            entries[path.basename(entryName, '.js')] = pathName;
        }
    });
}



let configs = {
    mode: $C.NODE_ENV,
    entry: entries,
    performance: getPerformance(),
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    },
    output: {
        path: path.resolve(__dirname, $C.OUTPUT_PATH),
        filename: $C.jsOutput,
        publicPath: $C.DEFINES.BASE_URL,
        clean: !process.env.npm_config_no_clean_outdir ? true : false
    },
    resolve: getResolve(__dirname),
    plugins: getCorePlugins(__dirname, $C, { copyAssets: process.env.npm_config_no_assets == undefined }),
    module: {
        rules: [
            ...getModuleRules(__dirname),
            {
                test: /\.(html|phtml)$/i,
                loader: 'ejs-loader',
                options: {
                    esModule: false
                }
            }
            // {
            //     test: /\.js$/,
            //     exclude: /node_modules/,
            //     use: {
            //         loader: 'babel-loader',
            //         options: {
            //             presets: ['@babel/preset-env']
            //         }
            //     }
            // }
        ]
    }
};

const { getTools } = require('./tools');
const Locale = require('./src/libraries/locale');
let { ROUTERS } = require('./router_manager');
let langCode = $C.DEFINES.DEF_LANG;
let lang = getMessages(langCode);
let _locale = new Locale(langCode, lang);
let routersFilePath = path.resolve(__dirname, 'routers/common.js');
let routersCommon = require(routersFilePath);
let pageOptionsList = [];
let pages = Object.keys(routersCommon);
pages.forEach(pageName => {
    let router = routersCommon[pageName];
    if (!router.template) return;
    pageOptionsList.push(getHtmlPageOptions(pageName, router, _locale, getTools(_locale), ROUTERS));
});

const i18nDir = path.resolve(__dirname, 'i18n');
let I18N = [];
let buildLanguages = [];
if (process.env.npm_config_i18n) {
    buildLanguages = process.env.npm_config_i18n.split(/[\s,]+/);
}

fs.readdirSync(i18nDir).forEach(dirName => {
    let pathName = path.join(i18nDir, dirName);
    if (fs.statSync(pathName).isDirectory()) {
        let langCode = dirName;
        let lang = getMessages(langCode);
        let _locale = new Locale(langCode, lang);
        I18N.push({
            code: langCode,
            name: lang.langName,
            url: ROUTERS[langCode]['index'].url
        });
        if (langCode == $C.DEFINES.DEF_LANG) return;
        if (buildLanguages.indexOf(langCode) < 0) return;

        let routersFilePath = path.resolve(__dirname, 'routers/i18n/' + langCode + '/index.js');
        let langRouters = fs.existsSync(routersFilePath) ? require(routersFilePath) : {};
        let _routers = merge({}, routersCommon);
        for (let pageName in _routers) {
            if (langRouters[pageName]) {
                Object.assign(_routers[pageName], langRouters[pageName]);
            } else {
                _routers[pageName].filename = langCode + '/' + _routers[pageName].filename;
            }
            let router = _routers[pageName];
            if (!router.template) continue;
            // let pageOptions = getHtmlPageOptions(pageName, router, _locale, getTools(_locale), ROUTERS);
            // configs.plugins.push(new HtmlWebpackPlugin(pageOptions));
            pageOptionsList.push(getHtmlPageOptions(pageName, router, _locale, getTools(_locale), ROUTERS));
        }
    }
});

configs.plugins.push(new webpack.DefinePlugin({
    I18N: JSON.stringify(I18N)
}));

//SiteMap
configs.plugins.push(new HtmlWebpackPlugin({
    filename: 'sitemap.xml',
    template: './src/pages/sitemap.xml',
    inject: false,
    minify: false,
    templateParameters: {
        ROUTERS
    }
}));

//Robots
configs.plugins.push(new HtmlWebpackPlugin({
    filename: 'robots.txt',
    template: './src/pages/robots.txt',
    inject: false,
    minify: false,
    templateParameters: {
        ROUTERS
    }
}));

const LayoutPlugin = require('./LayoutPlugin');
configs.plugins.push(new LayoutPlugin({options: ''}));
pageOptionsList.forEach(pageOptions => {
    configs.plugins.push(new HtmlWebpackPlugin(pageOptions));
});

function getHtmlPageOptions(pageName, router, locale, tools, ROUTERS) {
    if (!router.templateParameters) {
        router.templateParameters = {};
    }
    let icons = {};
    tools.forEach(toolParent => {
        icons[toolParent.id] = toolParent.icon;
        if (toolParent.childItems) {
            toolParent.childItems.forEach(tool => icons[tool.id] = tool.icon);
        }
    });
    const _messages = getMessages(locale.langCode, 'frontend.js');
    if (!router.messages) {
        router.messages = ['common'];
    } else {
        router.messages.push('common');
    }
    const messages = {};
    router.messages.forEach(key => {
        messages[key] = _messages[key];
    });

    const urlManager = require('./url_manager');
    let templateParameters = merge({}, router.templateParameters, {
        pageName,
        locale,
        messages,
        icons,
        ROUTERS,
        urlManager: new urlManager(ROUTERS[locale.langCode]),
        toolCategories: $C.TOOL_CATEGORIES
    });
    templateParameters.tools = tools;


    return {
        chunks: router.chunks,
        filename: router.filename,
        // template: 'ejs-loader!' + router.template,
        template: router.template,
        templateParameters: templateParameters,
        minify: $C.MINIFY,
        favicon: null,
        hash: false
    };
}


module.exports = () => {
    return {
        configs, ROUTERS
    };
};
