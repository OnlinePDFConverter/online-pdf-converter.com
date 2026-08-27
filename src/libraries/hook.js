// $HOOK.dispatch('appitem_render', null, res => {
//     console.log(res);
// });

// $HOOK.on('appitem_render', (e, sendResponse) => {
//     console.log(e);
//     sendResponse('xcvxcv');
// });

// $HOOK.on('appitem_render', (e, sendResponse) => {
//     console.log(e);
//     return 'xcvxcv';
// });


const _ONCE = '_#once#_';

class Hook {
    constructor() {
        this.bindedEvents = {};
    }

    /**
     * 
     * @param {*} type 
     * @param {*} func 
     * func params (message: any, sendResponse: function)
     * @param {*} once 
     */
    on(type, func, once) {
        if (type instanceof Array) {
            type.forEach(evtType => {
                this.bind(evtType, func, once);
            });
        } else {
            this.bind(type, func, once);
        }
    }

    trigger(type, data, callback) {
        this.dispatch(type, data, callback);
    }

    dispatch(type, data, callback) {
        [_ONCE, ''].forEach(prefix => {
            let _type = prefix + type;
            if (this.bindedEvents[_type]) {
                let callbacked = false;
                this.bindedEvents[_type].forEach(func => {
                    let res = func({
                        type: type,
                        data: data ?? {}
                    }, params => {
                        if (typeof(callback) == 'function') {
                            callbacked = true; 
                            callback(params);
                        }
                    });

                    if (!callbacked && res !== undefined && typeof(callback) == 'function') {
                        callback(res);
                    }

                    if (_ONCE == prefix) {
                        this.unbind(_type, func);
                    }
                });
            }
        });
    }

    unbind(type, func) {
        if (!func) {
            delete this.bindedEvents[type];
        } else if (this.bindedEvents[type]) {
            this.bindedEvents[type].forEach((_func, i) => {
                if (func === _func) {
                    this.bindedEvents[type].splice(i, 1);
                }
            });
        }
    }

    bind(type, func, once) {
        type = once ? _ONCE + type : type;
        if (!this.bindedEvents[type]) {
            this.bindedEvents[type] = [];
        }
        this.bindedEvents[type].push(func);
    }
}

export default Hook;