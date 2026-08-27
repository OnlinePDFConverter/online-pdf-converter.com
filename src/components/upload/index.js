import Dropzone from 'dropzone';

Dropzone.prototype.filesize = function (bytes) {
    let selectedSize = 0;
    let selectedUnit = 'b';
    let units = ['kb', 'mb', 'gb', 'tb'];
    
    if (Math.abs(bytes) < this.options.filesizeBase) {
        selectedSize = bytes;
    } else {
        var u = -1;
        do {
            bytes /= this.options.filesizeBase;
            ++u;
        } while (Math.abs(bytes) >= this.options.filesizeBase && u < units.length - 1);

        selectedSize = bytes.toFixed(1);
        selectedUnit = units[u];
    }
    return `<strong>${selectedSize}</strong> ${this.options.dictFileSizeUnits[selectedUnit]}`;
}


let previewTemplate = `
<div class="dz-preview dz-file-preview">
    <div class="dz-preview-body">
        <div class="dz-image"><img data-dz-thumbnail /></div>
        <div class="dz-details">
            <div class="dz-size"><span data-dz-size></span></div>
            <div class="dz-filename"><span data-dz-name></span></div>
        </div>
        <div class="dz-progress">
            <span class="dz-upload" data-dz-uploadprogress></span>
        </div>
        <div class="dz-error-message"><span data-dz-errormessage></span></div>
        <div class="dz-success-mark">
            <svg width="54px" height="54px" viewBox="0 0 54 54" version="1.1" xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink">
                <title>Check</title>
                <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                    <path
                        d="M23.5,31.8431458 L17.5852419,25.9283877 C16.0248253,24.3679711 13.4910294,24.366835 11.9289322,25.9289322 C10.3700136,27.4878508 10.3665912,30.0234455 11.9283877,31.5852419 L20.4147581,40.0716123 C20.5133999,40.1702541 20.6159315,40.2626649 20.7218615,40.3488435 C22.2835669,41.8725651 24.794234,41.8626202 26.3461564,40.3106978 L43.3106978,23.3461564 C44.8771021,21.7797521 44.8758057,19.2483887 43.3137085,17.6862915 C41.7547899,16.1273729 39.2176035,16.1255422 37.6538436,17.6893022 L23.5,31.8431458 Z M27,53 C41.3594035,53 53,41.3594035 53,27 C53,12.6405965 41.3594035,1 27,1 C12.6405965,1 1,12.6405965 1,27 C1,41.3594035 12.6405965,53 27,53 Z"
                        stroke-opacity="0.198794158" stroke="#747474" fill-opacity="0.816519475" fill="#FFFFFF"></path>
                </g>
            </svg>
        </div>
        <div class="dz-error-mark">
            <svg width="54px" height="54px" viewBox="0 0 54 54" version="1.1" xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink">
                <title>Error</title>
                <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                    <g stroke="#747474" stroke-opacity="0.198794158" fill="#FFFFFF" fill-opacity="0.816519475">
                        <path
                            d="M32.6568542,29 L38.3106978,23.3461564 C39.8771021,21.7797521 39.8758057,19.2483887 38.3137085,17.6862915 C36.7547899,16.1273729 34.2176035,16.1255422 32.6538436,17.6893022 L27,23.3431458 L21.3461564,17.6893022 C19.7823965,16.1255422 17.2452101,16.1273729 15.6862915,17.6862915 C14.1241943,19.2483887 14.1228979,21.7797521 15.6893022,23.3461564 L21.3431458,29 L15.6893022,34.6538436 C14.1228979,36.2202479 14.1241943,38.7516113 15.6862915,40.3137085 C17.2452101,41.8726271 19.7823965,41.8744578 21.3461564,40.3106978 L27,34.6568542 L32.6538436,40.3106978 C34.2176035,41.8744578 36.7547899,41.8726271 38.3137085,40.3137085 C39.8758057,38.7516113 39.8771021,36.2202479 38.3106978,34.6538436 L32.6568542,29 Z M27,53 C41.3594035,53 53,41.3594035 53,27 C53,12.6405965 41.3594035,1 27,1 C12.6405965,1 1,12.6405965 1,27 C1,41.3594035 12.6405965,53 27,53 Z">
                        </path>
                    </g>
                </g>
            </svg>
        </div>
    </div>
</div>`;

const MAX_FILE_SIZE = null;
const MAX_THUMBNAIL_FILE_SIZE = 100;
const CHUNK_SIZE = 1024 * 1024 * 2;

class Upload {
    constructor(container, options) {
        this.handle = null;
        this.container = container;
        this.options = {
            maxFiles: null,
            uploadMultiple: false,
            acceptedFiles: '.jpg,.png',
            url: '.',
            autoProcessQueue: false,
            addRemoveLinks: true,
            previewsContainer: '.dz-file-list',
            previewTemplate: previewTemplate,
            maxFilesize: MAX_FILE_SIZE,
            filesizeBase: 1024,
            maxThumbnailFilesize: MAX_THUMBNAIL_FILE_SIZE,
            thumbnailMethod: 'contain',
            thumbnailWidth: 120,
            clickable: true,
            chunking: true,
            chunkSize: CHUNK_SIZE,
            disablePreviews: false,
            funcShowMessage: null,
            singleMode: false,
            onAddedFile: file => {},
            onRemovedFile: file => {},
            onProgress: progress => {},
            onSuccess: (file, res) => {},
            onSuccessAll: (files, res) => {},
            onSending: (file, xhr, formData) => {},
            onError: (file, errorMessage) => {},
            onInit: () => {},
            dictFileTooBig: 'File is too big ({{filesize}}MB). Max filesize: {{maxFilesize}}MB.',
            dictInvalidFileType: 'File types not allowed.',
            dictMaxFilesExceeded: 'You can not upload any more files. Maximum files per task: {{maxFiles}}.'
        };
        this.options = Object.assign(this.options, options);
        this._successNum = 0;
        this._res = [];
        //init之前绑定的事件
        this._onQueue = [];
    }

    setOption(name, value) {
        if (typeof(name) == 'object') {
            Object.assign(this.options, name);
        } else {
            this.options[name] = value;
        }
        if (this.handle) {
            if (typeof(name) == 'object') {
                Object.assign(this.handle.options, name);
            } else {
                this.handle.options[name] = value;
            }
        }
    }

    showMessage(msg, type) {
        if (this.options.funcShowMessage) {
            this.options.funcShowMessage(msg, type);
        } else {
            alert(msg);
        }
    }

    get acceptedFiles() {
        return this.handle.getAcceptedFiles();
    }

    init() {
        if (this.options.singleMode) {
            this.options.maxFiles = 1;
        }
        this.handle = new Dropzone(this.container, this.options);
        this.handle.on('addedfile', file => {
            if (this.options.singleMode) {
                this.handle.files.forEach(item => {
                    if (item !== file) {
                        this.handle.removeFile(item);
                    }
                });
            }
            this._successNum = 0;
            this._res = [];
            setTimeout(() => {
                if (!file.accepted) {
                    this.handle.removeFile(file);
                    return;
                }
                this.options.onAddedFile(file);
                this.handle.emit('onAddedFile', file);
            }, 100);
        });

        this.handle.on('error', (file, errorMessage) => {
            this.showMessage(errorMessage, -1);
            this.options.onError(file, errorMessage);
        });

        this.handle.on('totaluploadprogress', progress => {
            this.options.onProgress(progress);
        });

        this.handle.on('success', (file, res) => {
            if (typeof (res) == 'string') {
                res = JSON.parse(res);
            }
            this.options.onSuccess(file, res);
            this._successNum++;
            this._res.push(res);
            if (this._successNum == this.acceptedFiles.length) {
                this.options.onSuccessAll(this.acceptedFiles, this._res);
            }
        });

        this.handle.on('sending', (file, xhr, formData) => {
            this.options.onSending(file, xhr, formData);
        });

        this.handle.on('removedfile', file => {
            this.options.onRemovedFile(file);
        });
        this._onQueue.forEach(evt => this.handle.on(evt.eventName, evt.callback));
        this.options.onInit();
    }

    on(eventName, callback) {
        if (!this.handle) {
            this._onQueue.push({
                eventName, callback
            });
        } else {
            this.handle.on(eventName, callback);
        }
    }
}

export default Upload;