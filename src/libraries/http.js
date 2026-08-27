// URLSearchParams需要在safari上测试兼容性,不行就用qs

class Http {

    constructor(headers = {}, options = {}) {
        this._encType = 'urlencode';
        this._dataType = 'json';
        this.headers = {
            // 'X-Requested-With': 'XMLHttpRequest'
        };
        Object.assign(this.headers, headers);

        this.options = {
            // mode: 'cors',
        };
        Object.assign(this.options, options);
        this.response = null;
    }

    /**
     * 
     * @param {*} type
     * value: json | text | arrayBuffer | blob | formData
     */
    dataType(type) {
        this._dataType = type;
        return this;
    }

    /**
     * 
     * @param {*} type
     * value:
     * urlencode = application/x-www-form-urlencoded
     * form = multipart/form-data
     * json = application/json
     */
    encType(type) {
        this._encType = type;
        return this;
    }

    setHeaders(headers) {
        this.headers = headers;
        return this;
    }

    addHeaders(name, value) {
        if (typeof name == 'object') {
            this.headers = Object.assign(this.headers, name);
        } else {
            this.headers[name] = value;
        }
        return this;
    }

    setOptions(options) {
        this.options = options;
        return this;
    }

    addOptions(name, value) {
        if (typeof name == 'object') {
            this.options = Object.assign(this.options, name);
        } else {
            this.options[name] = value;
        }
        return this;
    }

    async get(url, params, dataType) {
        if (params && Object.keys(params).length > 0) {
            if (url.indexOf('?') < 0) {
                url += '?';
            } else {
                url += '&'
            }
            url += new URLSearchParams(params).toString();
        }

        let options = Object.assign({
            method: 'GET',
            headers: this.headers
        }, this.options);

        if (this._encType == 'urlencode') {
            options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        } else if (this._encType == 'form') {
            options.headers['Content-Type'] = 'multipart/form-data';
        } else if (this._encType == 'json') {
            options.headers['Content-Type'] = 'application/json';
        }
        this.response = await fetch(url, options).catch(error => {
            console.error('Unable to load:' + url);
        });
        return this.getResult(dataType);
    }

    async post(url, params, dataType) {
        let options = Object.assign({
            method: 'POST',
            headers: this.headers
        }, this.options);

        if (params) {
            let postData = {};
            if (this._encType == 'urlencode') {
                // delete(options.headers['Content-Type']);
                options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                postData = new URLSearchParams(params);
            } else if (this._encType == 'form') {
                // delete(options.headers['Content-Type']);
                options.headers['Content-Type'] = 'multipart/form-data';
                postData = new FormData();
                Object.keys(params).forEach(name => {
                    postData.set(name, params[name]);
                });
            } else if (this._encType == 'json') {
                options.headers['Content-Type'] = 'application/json';
                postData = JSON.stringify(params);
            }
            options.body = postData;
        }

        this.response = await fetch(url, options).catch(error => {
            console.error('Unable to load:' + url);
        });
        return this.getResult(dataType);
    }

    async json() {
        return await this.response.json();
    }

    async text() {
        return await this.response.text();
    }

    async arrayBuffer() {
        return await this.response.arrayBuffer();
    }

    async blob() {
        return await this.response.blob();
    }

    async formData() {
        return await this.response.formData();
    }

    async getResult(dataType) {
        if (!this.response) {
            return false;
        }
        if (this.response.status != 200 || !this.response.ok) {
            return false;
        }

        if (!dataType) {
            dataType = this._dataType;
        }
        if (dataType == 'json') {
            return await this.json();
        } else if (dataType == 'text') {
            return await this.text();
        } else if (dataType == 'arrayBuffer') {
            return await this.arrayBuffer();
        } else if (dataType == 'blob') {
            return await this.blob();
        } else if (dataType == 'formData') {
            return await this.formData();
        } 
    }
}

export default Http;