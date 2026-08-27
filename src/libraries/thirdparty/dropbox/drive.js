import { scriptLoader } from "../loader";

const SCRIPT_ID = 'dropboxjs';
const SCRIPT_SRC = 'https://www.dropbox.com/static/api/2/dropins.js';

class DropboxDrive {
    constructor(options) {
        this.apiKey = options.apiKey;
        this.accessToken = options.accessToken;
        this.loaded = false;
        this.onLoad = options.onLoad || function () {};
        this.onLoaded = options.onLoaded || function () {};
    }

    run(action, options = {}) {
        if (!this[action]) {
            throw ('Not Found "Dropbox.' + action + '" Method.');
        }

        if (this.loaded) {
            this[action](options);
            return;
        }

        this.onLoad();
        scriptLoader({
            id: SCRIPT_ID,
            src: SCRIPT_SRC,
            'data-app-key': this.apiKey 
        }, () => {
            this.loaded = true;
            this.onLoaded();
            // let button = Dropbox.createChooseButton({});
            // document.body.appendChild(button);
            this[action](options);
        });
    }

    async openPicker(options = {}) {
        let _options = {
            /*
            file = {
                id: "id:...",
                name: "filename.txt",
                // URL to access the file, which varies depending on the linkType specified when the
                // Chooser was triggered.
                link: "https://...",
                // Size of the file in bytes.
                bytes: 464,
                // URL to a 64x64px icon for the file based on the file's extension.
                icon: "https://...",
                // A thumbnail URL generated when the user selects images and videos.
                // If the user didn't select an image or video, no thumbnail will be included.
                thumbnailLink: "https://...?bounding_box=75&mode=fit",
                // Boolean, whether or not the file is actually a directory
                isDir: false,
            };
            */
            success: function(files) {
                if (typeof (options.callback) == 'function') {
                    options.callback(files);
                }
            },
            cancel: function() {
                if (typeof (options.cancel) == 'function') {
                    options.cancel();
                }
            },
            linkType: 'direct', 
            multiselect: options.multiSelect ?? false,
            folderselect: false
            // extensions: ['.pdf', '.doc', '.docx'],
            // sizeLimit: 1024 // or any positive number
        };
        if (options.extensions) {
            _options.extensions = options.extensions;
        }
        Object.assign(_options, options);
        Dropbox.choose(_options);
    }

    async downloadFile(files) {
        let promises = [];
        files.forEach((file, i) => {
            promises.push(new Promise(resolve => {
                fetch(file.link, {
                    method: 'GET'
                })
                .then(response => {
                    if (response.status != 200) {
                        throw (response);
                    }
                    return response.blob();
                })
                .then(blob => {
                    resolve({
                        name: file.name,
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

    // async createFolder(path) {
    //     let body = {
    //         autorename: false,
    //         path
    //     };
    //     fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
    //         method: 'POST',
    //         headers: {
    //             'Authorization': 'Bearer ' + this.accessToken,
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify(body)
    //     });
    // }

    async upload(options = {}) {
        const fileUrl = 'https://content.dropboxapi.com/2/files/upload';
        let params = {
            autorename: true,
            mode: 'add',
            mute: false,
            path: options.name,
            strict_conflict: true
        };
        return fetch(fileUrl, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + this.accessToken,
                'Content-Type': 'application/octet-stream',
                'Dropbox-API-Arg': JSON.stringify(params)
            },
            body: options.file
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

    /**
     * 
     * @param {*} options 
     * {string} options.name
     * {Blob} options.file
     * @returns 
     */
    async saver(options) {
        if (typeof(options.onUpload) == 'function') {
            options.onUpload();
        }
        Dropbox.save({
            files: [
                {'url': options.file, 'filename': options.name}
            ],
            success: () => {
                if (typeof(options.callback) == 'function') {
                    options.callback(true);
                }
            },
            progress: progress => {
                if (typeof(options.progress) == 'function') {
                    options.progress(progress);
                }
            },
            cancel: () => {
                if (typeof(options.cancel) == 'function') {
                    options.cancel();
                }
            },
            error: errorMessage => {
                if (typeof(options.callback) == 'function') {
                    options.callback(false);
                }
            }
        });
        return true;
    }
}

export {
    DropboxDrive
}