class Locale {
    constructor(langCode, messages) {
        this.langCode = langCode;
        this.messages = messages || {};
    }

    bind(parent) {
        if (!parent) {
            parent = document;
        }
        let elList = parent.querySelectorAll('[data-locale]');
        for (let i = 0; i < elList.length; i++) {
            let el = elList[i];
            let key = el.getAttribute('data-locale');
            let placeholders = {};
            let _placeholders = el.getAttribute('data-placeholders');       //data-placeholders="B=xx,AES=AAA"
            if (_placeholders) {
                _placeholders.split(',').forEach(item => {
                    let data = item.split('=');
                    placeholders[data[0]] = data[1];
                });
            }
            let msg = this.get(key, placeholders);
            let attrs = el.getAttribute('data-locale-attrs');
            if (attrs) {
                attrs.split(',').forEach(attr => {
                    if (attr == 'innerText') {
                        el.innerText = msg;
                    } else {
                        el.setAttribute(attr, msg);
                    }
                });
            } else {
                if (!key) {
                    let text = el.innerText;
                    msg = text.replace(/\{\{([\w]+)\}\}/g, (match, key) => {
                        return this.get(key, placeholders);
                    });
                }
                el.innerText = msg;
            }
        }
    }

    get(key, placeholders) {
        let content = this.messages[key];
        if (key.indexOf('.') >= 0 && content == undefined) {
            const arr = key.split('.');
            for (const i in arr) {
                const k = arr[i];
                if (i == 0) {
                    content = this.messages[k];
                    if (!content) {
                        return '__' + key + '__';
                    }
                } else {
                    if (!content || !content[k]) {
                        return '__' + key + '__';
                    }
                    content = content[k];
                }
            }
        }
        if (!content) {
            return '__' + key + '__';
        }
        if (placeholders) {
            for (let key in placeholders) {
                content = content.replace(new RegExp('%'+ key +'%', 'g'), placeholders[key]);
            }
        }
        return content;
    }

    exist(key) {
        const keys = key.split('.');
        let content = this.messages;
        for (const item of keys) {
            if (content == null || content[item] === undefined) {
                return false;
            }
            content = content[item];
        }
        return true;
    }

    async load(langCode) {
        const { default: Http } = require("@libs/http");
        return new Http().get(ASSETS_URL + 'locale/' + langCode + '.json').then(messages => {
            this.langCode = langCode;
            this.messages = messages;
            return messages;
        });
    }
}

module.exports = Locale;
