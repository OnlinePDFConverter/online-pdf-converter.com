import { scriptLoader } from "../loader";

const GAPI_ID = 'gapi_script';
const GAPI_SRC = 'https://apis.google.com/js/api.js';

class GoogleDrive {
    constructor(options) {
        this.appId = options.appId;
        this.apiKey = options.apiKey;
        this.discoveryDocs = options.discoveryDocs || [];
        this.gapiClient = null;
        this.googleAuth = options.googleAuth;
        this.picker = null;
        this.authed = false;
        this.loaded = false;
        this.onLoad = options.onLoad || function () {};
        this.onLoaded = options.onLoaded || function () {};
    }

    init(callback) {
        if (this.authed && this.loaded) {
            gapi.load('client:picker', async () => {
                await gapi.client.init({
                    apiKey: this.apiKey,
                    discoveryDocs: this.discoveryDocs
                });
                this.gapiClient = gapi.client;
                if (this.googleAuth.token) {
                    this.gapiClient.setToken(this.googleAuth.token);
                }
                if (typeof (callback) == 'function' && this.googleAuth.authed) {
                    callback(this);
                }
            });
        }
    }

    run(action, options = {}) {
        if (!this[action]) {
            throw ('Not Found "GoogleDrive.' + action + '" Method.');
        }

        this.googleAuth.start(() => {
            this.authed = true;
            this.init(() => this[action](options));
        });

        this.onLoad();
        scriptLoader({
            id: GAPI_ID,
            async: '',
            src: GAPI_SRC
        }, () => {
            this.loaded = true;
            this.onLoaded();
            this.init(() => this[action](options));
        });
    }

    /*
    _options.viewId
    ViewId.DOCS	                    All Google Drive document types.
    ViewId.DOCS_IMAGES	            Google Drive photos.
    ViewId.DOCS_IMAGES_AND_VIDEOS	Google Drive photos and videos.
    ViewId.DOCS_VIDEOS	            Google Drive videos.
    ViewId.DOCUMENTS	            Google Drive Documents.
    ViewId.DRAWINGS	                Google Drive Drawings.
    ViewId.FOLDERS	                Google Drive Folders.
    ViewId.FORMS	                Google Drive Forms.
    ViewId.PDFS	                    PDF files stored in Google Drive.
    ViewId.PRESENTATIONS	        Google Drive Presentations.
    ViewId.SPREADSHEETS	            Google Drive Spreadsheets.
    */
    async openPicker(options = {}) {
        let _options = {
            viewId: 'DOCS',
            multiSelect: false,
            mimeTypes: null,
            callback: data => {},
            cancel: () => {}
        };
        Object.assign(_options, options);

        const view = new google.picker.View(google.picker.ViewId[_options.viewId]);
        // const view = new google.picker.DocsUploadView();
        if (_options.mimeTypes) {
            view.setMimeTypes(_options.mimeTypes);
            // view.setMimeTypes('image/png,image/jpeg,image/jpg');
        }
        if (!this.picker) {
            this.picker = new google.picker.PickerBuilder()
                            .enableFeature(google.picker.Feature.NAV_HIDDEN)
                            .setDeveloperKey(this.apiKey)
                            .setAppId(this.appId)
                            .setOAuthToken(this.googleAuth.token.access_token)
                            .setCallback(data => {
                                if (typeof (_options.callback) == 'function' && data.action === google.picker.Action.PICKED) {
                                    _options.callback(data);
                                }

                                if (typeof (_options.cancel) == 'function' && data.action === google.picker.Action.CANCEL) {
                                    _options.cancel(data);
                                }
                            })
                            .addView(view);
            if (_options.multiSelect) {
                this.picker.enableFeature(google.picker.Feature.MULTISELECT_ENABLED);
            }
            this.picker = this.picker.build();
        }
        this.picker.setVisible(true);
    }

    // doc 
    // {
    //     description: ""
    //     driveError: "NETWORK"
    //     driveSuccess: false
    //     duration: 5
    //     embedUrl: "https://drive.google.com/file/d/1Ujaqhq7-Szivi4Ai9gU-4HG4kN05I4ZY/preview?usp=drive_web"
    //     iconUrl: "https://drive-thirdparty.googleusercontent.com/16/type/video/mp4"
    //     id: "1Ujaqhq7-Szivi4Ai9gU-4HG4kN05I4ZY"
    //     lastEditedUtc: 1687244837000
    //     mimeType: "video/mp4"
    //     name: "sample-5s.mp4"
    //     parentId: "0AGla7Bc0_2_fUk9PVA"
    //     serviceId: "docs"
    //     sizeBytes: 2848208
    //     type: "video"
    //     url: "https://drive.google.com/file/d/1Ujaqhq7-Szivi4Ai9gU-4HG4kN05I4ZY/view?usp=drive_web"
    // }
    async downloadFile(data) {
        let promises = [];
        const docs = data[google.picker.Response.DOCUMENTS];
        docs.forEach(doc => {
            promises.push(new Promise(resolve => {
                const fileId = doc[google.picker.Document.ID];
                // const res = await this.gapiClient.drive.files.get({
                //     fileId,
                //     // alt: 'media',
                //     fields: 'webContentLink'
                // });
                // if (res.status == 200) { }
                
                // const headers = new Headers();
                // headers.append('Authorization', 'Bearer ' + this.googleAuth.token.access_token);
                const fileUrl = 'https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media';
                fetch(fileUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + this.googleAuth.token.access_token
                    }
                })
                .then(response => {
                    if (response.status != 200) {
                        throw (response);
                    }
                    return response.blob();
                })
                .then(blob => {
                    resolve({
                        name: doc.name,
                        blob
                    });
                })
                .catch(error => {
                    console.error('Error downloading file:', error);
                    resolve(false); 
                });
            }));
        });
        return Promise.all(promises);
    }

    /**
     * 
     * @param {*} options 
     * {string} options.name
     * {string} options.folder
     * {Blob} options.file
     * @returns 
     */
    async upload(options = {}) {
        if (typeof(options.onUpload) == 'function') {
            options.onUpload();
        }
        let folderId = await this.getFolderId(options.folder);
        if (!folderId) {
            folderId = await this.createFolder(options.folder);
        }
        const fileUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id';
        let metadata = {
            name: options.name,
            mimeType: options.file.type,
            parents: [ folderId ]
        };
        let formData = new FormData();
        formData.append('metadata', new Blob([ JSON.stringify(metadata) ], { type: 'application/json' }));
        formData.append('file', options.file);
        return fetch(fileUrl, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + this.googleAuth.token.access_token
            },
            body: formData
        })
        .then(res => {
            if (res.status != 200) {
                return false;
            }
            return res.json();
        })
        .then(json => {
            if (typeof(options.callback) == 'function') {
                options.callback(json);
            }
        }).catch(error => {
            console.error('Error save file:', error);
        });
    }

    async createFolder(name) {             
        const fileUrl = 'https://www.googleapis.com/drive/v3/files';
        let body = {
            name,
            mimeType: 'application/vnd.google-apps.folder'
        };
        return await fetch(fileUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + this.googleAuth.token.access_token,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(body)
                    })
                    .then(res => res.json())
                    .then(data => data.id);
    }

    async getFolderId(name) {
        const fileUrl = 'https://www.googleapis.com/drive/v3/files?q=mimeType = "application/vnd.google-apps.folder" and name = "'+ name +'" and trashed = false';
        let folderId = null;
        folderId = await fetch(fileUrl, {
                            method: 'GET',
                            headers: {
                                'Authorization': 'Bearer ' + this.googleAuth.token.access_token
                            }
                        })
                        .then(res => res.json())
                        .then(data => {
                            if (data.files) {
                                data.files.forEach(file => {
                                    if (!folderId && file.mimeType == 'application/vnd.google-apps.folder' && file.name == name) {
                                        folderId = file.id;
                                    }
                                });
                            }
                            return folderId;
                        });
        return folderId;
    }
}

export {
    GoogleDrive
}