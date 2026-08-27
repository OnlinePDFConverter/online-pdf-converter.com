import { GoogleAuth } from '@libs/thirdparty/google/auth';
import { GoogleDrive } from '@libs/thirdparty/google/drive';
import { DropboxDrive } from '@libs/thirdparty/dropbox/drive';
import Loading from '@components/loading';
import { $C } from '@common/constants';
import { EVENTS } from '@common/hook';

const googleAuth = new GoogleAuth({
    clientId: THIRD_PARTY.GOOGLE_DRIVE.clientId,
    scopes: THIRD_PARTY.GOOGLE_DRIVE.scopes
});
const googleDrive = new GoogleDrive({
    appId: THIRD_PARTY.GOOGLE_DRIVE.appId,
    apiKey: THIRD_PARTY.GOOGLE_DRIVE.apiKey,
    discoveryDocs: THIRD_PARTY.GOOGLE_DRIVE.discoveryDocs,
    googleAuth
});
const dropboxDrive = new DropboxDrive({
    apiKey: THIRD_PARTY.DROPBOX.apiKey
});


function loadFromDrive(options = {}) {
    $D.getAll('.third-party[data-type="google-drive"][data-action="load"]').forEach(el => {
        const loading = new Loading(el);
        el.addEventListener('click', e => {
            googleAuth.onLoad = () => {
                loading.start();
            }
            googleAuth.onLoaded = () => {
                loading.end();
            }
            
            e.preventDefault();
            googleDrive.run('openPicker', {
                viewId: options.viewId || 'DOCS',
                multiSelect: options.multiSelect ?? false,
                mimeTypes: options.mimeTypes || null,
                callback:  async data => {
                    const files = await googleDrive.downloadFile(data);
                    if (files.includes(false)) {
                        $HOOK.dispatch(EVENTS.MESSAGE.ERROR, {
                            msg: $L.get('common.errorMsg')
                        });
                        return;
                    }
                    if (typeof (options.callback) == 'function') {
                        options.callback(files);
                    }
                }
            });
        });
    });

    $D.getAll('.third-party[data-type="dropbox"][data-action="load"]').forEach(el => {
        const loading = new Loading(el);
        el.addEventListener('click', e => {
            dropboxDrive.onLoad = () => {
                loading.start();
            }
            dropboxDrive.onLoaded = () => {
                loading.end();
            }
            e.preventDefault();

            let fileTypes = options.fileTypes || $C.imageTools.fileTypes;
            dropboxDrive.run('openPicker', {
                multiSelect: options.multiSelect ?? false,
                extensions: fileTypes.split(','),
                callback: async data => {
                    const files = await dropboxDrive.downloadFile(data);
                    if (files.includes(false)) {
                        $HOOK.dispatch(EVENTS.MESSAGE.ERROR, {
                            msg: $L.get('common.errorMsg')
                        });
                        return;
                    }
                    if (typeof (options.callback) == 'function') {
                        options.callback(files);
                    }
                }
            });
        });
    });
}

function saveToDrive(options, beforeCallback) {
    $D.getAll('.third-party[data-type="google-drive"][data-action="save"]').forEach(el => {
        const loading = new Loading(el);
        el.addEventListener('click', e => {
            if (!beforeCallback()) {
                return false;
            }
            googleAuth.onLoad = () => {
                loading.start();
            }
            googleAuth.onLoaded = () => {
                loading.end();
            }

            e.preventDefault();
            googleDrive.run('upload', {
                name: options.name,
                folder: DOMAIN,
                file: options.blob,
                onUpload: () => {
                    $HOOK.dispatch(EVENTS.MESSAGE.SUCCESS, {
                        msg: $L.get('uploading'),
                        keep: true
                    });
                },
                callback: data => {
                    loading.end();
                    if (!data) {
                        $HOOK.dispatch(EVENTS.MESSAGE.ERROR, {
                            msg: $L.get('common.errorMsg')
                        });
                        return;
                    }
                    $HOOK.dispatch(EVENTS.MESSAGE.SUCCESS, {
                        msg: $L.get('savedSuccess')
                    });
                    if (typeof (options.callback) == 'function') {
                        options.callback(data);
                    }
                }
            });
        });
    });

    $D.getAll('.third-party[data-type="dropbox"][data-action="save"]').forEach(el => {
        const loading = new Loading(el);
        el.addEventListener('click', e => {
            if (!beforeCallback()) {
                return false;
            }
            dropboxDrive.onLoad = () => {
                loading.start();
            }
            dropboxDrive.onLoaded = () => {
                loading.end();
            }
            e.preventDefault();

            const fileReader = new FileReader();
            fileReader.addEventListener('loadend', () => {
                dropboxDrive.run('saver', {
                    // name: '/' + DOMAIN + '/' + options.name,
                    name: options.name,
                    file: fileReader.result,
                    onUpload: () => {
                        $HOOK.dispatch(EVENTS.MESSAGE.SUCCESS, {
                            msg: $L.get('uploading'),
                            keep: true
                        });
                    },
                    callback: data => {
                        if (!data) {
                            $HOOK.dispatch(EVENTS.MESSAGE.ERROR, {
                                msg: $L.get('common.errorMsg')
                            });
                            return;
                        }
                        $HOOK.dispatch(EVENTS.MESSAGE.SUCCESS, {
                            msg: $L.get('savedSuccess')
                        });
                        if (typeof (options.callback) == 'function') {
                            options.callback(data);
                        }
                    },
                    cancel: () => {
                        $HOOK.dispatch(EVENTS.MESSAGE.CLOSE);
                    }
                });
            });
            fileReader.readAsDataURL(options.blob);
        });
    });
}

export {
    loadFromDrive,
    saveToDrive
}