const path = require('path');
const fs = require('fs');
const { merge } = require('webpack-merge');
const $C = require('./webpack.constants');


let ROUTERS = {};
let langCode = $C.DEFINES.DEF_LANG;
let routersFilePath = path.resolve(__dirname, 'routers/common.js');
let routersCommon = require(routersFilePath);
for (let pageName in routersCommon) {
    addRouter(langCode, pageName, routersCommon[pageName]);
}


const i18nDir = path.resolve(__dirname, 'i18n');
fs.readdirSync(i18nDir).forEach(dirName => {
    let pathName = path.join(i18nDir, dirName);
    if (fs.statSync(pathName).isDirectory()) {
        let langCode = dirName;
        if (langCode == $C.DEFINES.DEF_LANG) return;

        let routersFilePath = path.resolve(__dirname, 'routers/i18n/' + langCode + '/index.js');
        let langRouters = fs.existsSync(routersFilePath) ? require(routersFilePath) : {};
        let _routers = merge({}, routersCommon);
        for (let pageName in _routers) {
            if (langRouters[pageName]) {
                Object.assign(_routers[pageName], langRouters[pageName]);
            } else {
                _routers[pageName].filename = langCode + '/' + _routers[pageName].filename;
            }
            addRouter(langCode, pageName, _routers[pageName]);
        }
    }
});

function addRouter(langCode, pageName, route) {
    if (!ROUTERS[langCode]) {
        ROUTERS[langCode] = {};
    }
    let denyIndex = route.denyIndex;
    let url = route.filename.replace('index.html', '').replace(new RegExp($C.DEFINES.FILTER_URL_SUFFIX + '$', 'i'), '');
    ROUTERS[langCode][pageName] = {
        name: pageName,
        url: $C.DEFINES.BASE_URL + url,
        denyIndex: denyIndex ? denyIndex : false
    };
}

function getRouter(langCode, pageName) {
    return ROUTERS[langCode][pageName] ? ROUTERS[langCode][pageName].url : '';
}

module.exports = {
    ROUTERS,
    getRouter
}