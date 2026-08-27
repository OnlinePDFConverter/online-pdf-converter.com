import { scriptLoader } from "../loader";

const GSI_ID = 'gsi_script';
const GSI_SRC = 'https://accounts.google.com/gsi/client';
const STORAGE_KEY = '_dtk_';

class GoogleAuth {
    constructor(options) {
        this.tokenClient = null;
        this.clientId = options.clientId;
        this.scopes = options.scopes;
        this.loaded = false;
        this.onLoad = options.onLoad || function () {};
        this.onLoaded = options.onLoaded || function () {};
    }

    get token() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY));
    }

    set token(value) {
        if (value === null) {
            localStorage.removeItem(STORAGE_KEY);
        } else {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        }
    }

    get authed() {
        let time = new Date().getTime();
        if (this.token && this.token.expired > time) {
            if (typeof (google) != 'undefined') {
                let scopes = this.scopes.trim().split(' ');
                let inScopes = google.accounts.oauth2.hasGrantedAllScopes(this.token, ...scopes);
                if (!inScopes) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    start(callback) {
        if (this.tokenClient) {
            this.prompt();
            return;
        }

        this.onLoad();
        scriptLoader({
            id: GSI_ID,
            async: '',
            src: GSI_SRC
        }, () => {
            this.loaded = true;
            this.onLoaded();
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.clientId,
                scope: this.scopes,
                callback: async (tokenResponse) => {
                    if (tokenResponse.error !== undefined) {
                        throw (tokenResponse);
                    }
                    tokenResponse.expired = new Date().getTime() + (tokenResponse.expires_in * 1000);
                    this.token = tokenResponse;
                    if (typeof (callback) == 'function') {
                        callback(tokenResponse, this);
                    }
                }
            });
            this.prompt();
        });
    }

    prompt() {
        let prompt = !this.authed ? 'consent' : '';
        this.tokenClient.requestAccessToken({
            prompt: prompt
        });
    }

    signout() {
        this.token = null;
        if (typeof(gapi) != 'undefined') {
            const token = gapi.client.getToken();
            if (token !== null) {
                google.accounts.oauth2.revoke(token.access_token);
                gapi.client.setToken('');
            }
        }
    }
}

export {
    GoogleAuth
}