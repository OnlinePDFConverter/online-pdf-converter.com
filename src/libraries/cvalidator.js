import tippy from 'tippy.js';

const PLACEMENT = 'top';
const THEME = 'error';
const ERROR_CLASS = 'error';
const SUCCESS_CLASS = 'success';
const CHECK_STATUS = {
    ERROR: 0,
    UNCHECK: 1,
    CHECKING: 2,
    SUCCESS: 3
};


class CValidateItem {
    constructor(data) {
        this.id = !data.id ? 'id' + Math.floor(Math.random() * 99999) : data.id;
        this.rules = data.rules;
        this.element = data.element;
        this.msg = data.msg;
        this.status = CHECK_STATUS.UNCHECK;
        this.tippy = tippy(this.element, {
            arrow: true,
            placement: PLACEMENT,
            theme: THEME,
            trigger: 'manual',
            content: reference => {
                if (typeof(this.msg) == 'function') {
                    return this.msg(reference);
                }
                return this.msg;
            }
        });

        this.rules.forEach(rule => {
            if (Array.isArray(rule) && rule.length >= 3) {
                this.element.addEventListener(rule[2], () => {
                    return this.checkRule(rule);
                });
            }
        });
    }

    checkRule(rule) {
        if (this.status == CHECK_STATUS.CHECKING) {
            return CHECK_STATUS.CHECKING;
        }

        let res = true;
        let msg = null;
        if (typeof(rule) == 'function') {
            res = rule();
        } else if (Array.isArray(rule)) {
            res = rule[0]();
            if (rule[1] != null) {
                msg = rule[1];
            }
        } else {
            res = rule === true;
        }

        if (res instanceof Promise) {
            return res.then(v => {
                if (v) {
                    this.setStatus(CHECK_STATUS.SUCCESS);
                    return CHECK_STATUS.SUCCESS;
                } else {
                    this.setStatus(CHECK_STATUS.ERROR);
                    this.showMessages(msg);
                    return CHECK_STATUS.ERROR;
                }
            });
        } else {
            if (res) {
                this.setStatus(CHECK_STATUS.SUCCESS);
                return CHECK_STATUS.SUCCESS;
            } else {
                this.setStatus(CHECK_STATUS.ERROR);
                this.showMessages(msg);
                return CHECK_STATUS.ERROR;
            }
        }
    }

    showMessages(msg) {
        if (msg) {
            this.tippy.setContent(msg);
        }
        this.tippy.show();
    }

    setStatus(status) {
        switch (status) {
            case CHECK_STATUS.ERROR:
                this.element.classList.remove(SUCCESS_CLASS);
                this.element.classList.add(ERROR_CLASS);
                break;
            case CHECK_STATUS.SUCCESS:
                this.element.classList.remove(ERROR_CLASS);
                this.element.classList.add(SUCCESS_CLASS);
                break;
        }
    }

    async validate() {
        if (this.status == CHECK_STATUS.CHECKING) return;
        let tasks = [];
        for (let i in this.rules) {
            let rule = this.rules[i];
            let res = this.checkRule(rule);
            tasks.push(res);
            if ([CHECK_STATUS.ERROR, CHECK_STATUS.CHECKING].indexOf(res) > -1) {
                break;
            }
        }
        return Promise.all(tasks).then(values => values.every(res => res == CHECK_STATUS.SUCCESS));
    }

    validateSync() {
        if (this.status == CHECK_STATUS.CHECKING) return;
        let tasks = [];
        for (let i in this.rules) {
            let rule = this.rules[i];
            let res = this.checkRule(rule);
            tasks.push(res);
            if ([CHECK_STATUS.ERROR, CHECK_STATUS.CHECKING].indexOf(res) > -1) {
                break;
            }
        }
        return tasks.every(res => res == CHECK_STATUS.SUCCESS);
    }
}

class CValidator {
    constructor() {
        this.items = [];
    }

    get(id) {
        return this.items[id] ?? null;
    }

    set(data) {
        let item = new CValidateItem(data);
        this.items[item.id] = item;
        return this;
    }

    bind(items) {
        items.forEach((data, i) => {
            if (!data.id) {
                data.id = 'id' + i;
            }
            let item = new CValidateItem(data);
            this.items[data.id] = item;
        });
        return this;
    }

    async validate(setFocus) {
        let autoFocused = null;
        let tasks = [];
        for (let i in this.items) {
            tasks.push(this.items[i].validate());
        }
        return Promise.all(tasks).then(values => values.every((res, i) => {
            if (res === true) {
                return true;
            } else {
                if (setFocus && !autoFocused) {
                    let keys = Object.keys(this.items);
                    this.items[keys[i]].element.focus();
                    autoFocused = true;
                }
                return false;
            }
        }));
    }

    validateSync(setFocus) {
        let autoFocused = null;
        let tasks = [];
        for (let i in this.items) {
            tasks.push(this.items[i].validateSync());
        }
        return tasks.every((res, i) => {
            if (res === true) {
                return true;
            } else {
                if (setFocus && !autoFocused) {
                    let keys = Object.keys(this.items);
                    this.items[keys[i]].element.focus();
                    autoFocused = true;
                }
                return false;
            }
        });
    }
}

export default CValidator;