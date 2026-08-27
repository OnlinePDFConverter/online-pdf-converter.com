class UrlManager {
    constructor(ROUTERS) {
        this.ROUTERS = ROUTERS;
    }

    get(name) {
        return this.ROUTERS[name] ? this.ROUTERS[name].url : '';
    }
}

module.exports = UrlManager;