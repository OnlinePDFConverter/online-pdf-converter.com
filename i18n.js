const path = require('path');

function getMessages(langCode, file = 'backend.js') {
    let i18nDir = path.resolve(__dirname, 'i18n', langCode);
    return require(i18nDir + '/' + file);
}

module.exports = {
    getMessages
};