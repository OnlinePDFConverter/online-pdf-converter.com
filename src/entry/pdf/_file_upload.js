import Upload from '@components/upload';
import { EVENTS } from '@common/hook';
import FileItem from './_file_item.js';
import { dbSaveAndRedirect } from './_db';
import JSZip from 'jszip';
import { appendSuffix } from '@src/libraries/misc.js';
import { consumeQuickUpload } from '../_quick_upload.js';

const elUploadWrapper = $D.get('.upload-dropzone');
const elFileListWrapper = $D.get('.file-list-box');
const elFileList = $D.get('.file-list');
const elProcessBtns = $D.getAll('.btn-process');
const elProcessBtn = elProcessBtns[0];
const elProgressWrapper = $D.get('.convert-progress');
const elProgressText = $D.get('[data-progress-text]', elProgressWrapper);
const elProgressPercent = $D.get('[data-progress-percent]', elProgressWrapper);
const elProgressBar = $D.get('[data-progress-bar]', elProgressWrapper);
const elSettingsWrapper = $D.get('.settings-wrapper');
const elErrorMsg = $D.get('.upload-error-msg');
const elHeaderText = $D.get('#header-text');
const elPdfViewer = $D.get('#pdf-viewer');
const elements = {
    elUploadWrapper,
    elFileListWrapper,
    elFileList,
    elProcessBtn,
    elProcessBtns,
    elProgressWrapper,
    elProgressText,
    elProgressPercent,
    elProgressBar,
    elSettingsWrapper,
    elHeaderText,
    elPdfViewer
};

let previewTemplate = `
<div class="file-item">
    <span class="file-check"></span>
    <div class="file-icon">
        <img data-dz-thumbnail />
    </div>
    <div class="file-meta">
        <strong data-dz-name></strong>
        <span class="upload-status" data-dz-errormessage></span>
    </div>
    <div class="file-pages-size">
        <span class="file-pages"></span>
        <span class="file-size"></span>
    </div>
    <button class="file-remove" type="button" data-dz-remove>×</button>
    <div class="file-progress d-hide">
        <div class="file-progress-info">
            <span data-progress-text></span>
            <span data-progress-percent>0%</span>
        </div>
        <div class="file-progress-bar"><span data-progress-bar></span></div>
    </div>
</div>
`;

function setPreviewTemplate(template) {
    previewTemplate = template;
}

function getPreviewTemplate(className = []) {
    const el = $D.createFromHTML(previewTemplate);
    el.classList.add(...className);
    return el.outerHTML;
}

const fileUpload = new Upload(elUploadWrapper, {
    maxFiles: null,
    maxFilesize: null,
    acceptedFiles: null,
    previewsContainer: elFileList,
    previewTemplate: getPreviewTemplate(),
    addRemoveLinks: false,
    clickable: [elUploadWrapper].concat(Array.from($D.getAll('[data-upload-button]'))).filter(Boolean),
    onAddedFile,
    onRemovedFile,
    funcShowMessage: (msg, type) => {
        $HOOK.dispatch(EVENTS.MESSAGE.ERROR, {
            msg: msg
        });
    },
    onInit: () => {
        importQuickUpload(fileUpload);

        if (['page_selectable', 'page_removable', 'img_selectable', 'img_removable', 'pdf' ].includes(fileUpload.options.previewMode)) {
            elFileList.classList.add('thumb-grid');
            let className = null;
            if (['page_removable', 'img_removable'].includes(fileUpload.options.previewMode)) {
                className = 'file-item-removable';
            } else if (['page_selectable', 'img_selectable'].includes(fileUpload.options.previewMode)) {
                className = 'file-item-selectable';
            }
            const classes = className ? [className] : [];
            if (fileUpload.options.previewClass) {
                if (Array.isArray(fileUpload.options.previewClass)) {
                    classes.push(...fileUpload.options.previewClass);
                } else {
                    classes.push(fileUpload.options.previewClass);
                }
            }
            fileUpload.setOption({
                previewTemplate: getPreviewTemplate(classes),
                disablePreviews: ['page_selectable', 'page_removable', 'pdf']
                    .includes(fileUpload.options.previewMode)
            });
        }
    },
    singleMode: false,
    dictFileTooBig: $L.get('upload.dictFileTooBig').replace(/\[\[/g, '{{').replace(/\]\]/g, '}}'),
    dictInvalidFileType: $L.get('upload.dictInvalidFileType'),
    dictMaxFilesExceeded: $L.get('upload.dictMaxFilesExceeded').replace(/\[\[/g, '{{').replace(/\]\]/g, '}}')
});
fileUpload.fileIcon = null;
fileUpload.getFileById = (fileId) => {
    return fileUpload.handle.files.find(file => file.upload.uuid == fileId);
}
fileUpload.getAcceptedFiles = () => {
    return fileUpload.handle.getAcceptedFiles();
}
fileUpload.onProcess = () => {};
fileUpload.availableProcess = () => {
    const availableFiles = fileUpload.handle.files.every(file => file.previewElement && file.previewElement.classList.contains('has-success'));
    return fileUpload.getAcceptedFiles().length > 0 && availableFiles;
}
fileUpload.setProgress = (percent, text = $L.get('upload.processing')) => {
    if (elProgressWrapper.classList.contains('d-hide')) {
        elProgressWrapper.classList.remove('d-hide');
    }
    if (percent > 100) {
        percent = 100;
    }
    elProgressText.textContent = text;
    elProgressPercent.textContent = percent + '%';
    elProgressBar.style.width = percent + '%';
    if (percent == 100) {
        elProgressWrapper.classList.add('is-processed');
    }
}

fileUpload.fileProgress = (fileId, percent, text = $L.get('upload.processing')) => {
    const file = fileUpload.getFileById(fileId);
    file.extend.setProgress(percent, text);
}

fileUpload.fileError = (fileId, error) => {
    const file = fileUpload.getFileById(fileId);
    file.extend.setStatus(false, error);
}

fileUpload.fileComplete = (fileId) => {
    fileUpload.fileProgress(fileId, 100, $L.get('upload.processed'));
}

fileUpload.complete = (fileName, file, extra, tool) => {
    const fileCount = fileUpload.getAcceptedFiles().length;
    if (Array.isArray(file)) {
        if (file.length > 1) {
            const zip = new JSZip();
            file.forEach((blob, i) => {
                let name = blob.name || fileUpload.getAcceptedFiles()[i].name;
                zip.file(name, blob);
            });
            fileName = fileName.replace('{name}_', '').replace('_{name}', '');
            fileName = appendSuffix(fileName, '', '.zip');
            zip.generateAsync({ type: 'blob' }).then(blob => {
                dbSaveAndRedirect({
                    fileName,
                    file: blob,
                    fileCount,
                    extra,
                    tool
                });
            });
            return;
        }
        file = file[0];
        extra = extra[0];
    }

    let _name = file.name || fileUpload.getAcceptedFiles()[0].name;
    fileName = fileName.replace('{name}', _name.slice(0, _name.lastIndexOf('.')));
    dbSaveAndRedirect({
        fileName,
        file,
        fileCount,
        extra,
        tool
    });
}

fileUpload.updateProcessButtonState = () => {
    // const availableFiles = fileUpload.handle.files.every(file => file.previewElement && file.previewElement.classList.contains('has-success'));
    const disabled = !fileUpload.availableProcess();
    elProcessBtns.forEach(button => {
        button.disabled = disabled;
    });
}

fileUpload.error = (error) => {
    $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: error });
    elErrorMsg.textContent = error;
    fileUpload.getAcceptedFiles().forEach(file => {
        file.extend.setStatus(false, error);
    });
}


$D.get('[data-clear-button]').addEventListener('click', () => fileUpload.handle.removeAllFiles(true));
elProcessBtns.forEach(button => {
    button.addEventListener('click', () => {
        elProcessBtns.forEach(processButton => {
            processButton.disabled = true;
        });
        elErrorMsg.textContent = '';
        fileUpload.onProcess();
    });
});

async function importQuickUpload(uploadHandle) {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('quick_upload');
    if (!token) return;

    url.searchParams.delete('quick_upload');
    window.history.replaceState({}, document.title, url.toString());

    try {
        const record = await consumeQuickUpload(token, PAGE_NAME);
        uploadHandle.handle.addFile(record.file);
    } catch (error) {
        const unavailable = ['QUICK_UPLOAD_NOT_FOUND', 'QUICK_UPLOAD_EXPIRED'].includes(error && error.message);
        $HOOK.dispatch(EVENTS.MESSAGE.ERROR, {
            msg: $L.get(unavailable ? 'upload.quickUploadUnavailable' : 'upload.quickUploadFailed')
        });
    }
}


// fileUpload.on('thumbnail', (file, dataUrl) => {});

function onAddedFile(file) {
    // fileUpload.handle.emit('thumbnail', file, dataUrl);
    if (!file.accepted) {
        return;
    }
    
    const count = fileUpload.handle.files.length;
    elSettingsWrapper?.classList.toggle('d-hide', count < 1);
    elUploadWrapper.classList.add('d-hide');
    elFileListWrapper.classList.remove('d-hide');
    if (['page_selectable', 'page_removable', 'pdf'].includes(fileUpload.options.previewMode)) {
        file.previewElement = $D.createFromHTML(fileUpload.options.previewTemplate);
        const fileItem = new FileItem(file);
        file.extend = fileItem;
        try {
            fileItem.previewPages(elFileList, fileUpload.options.previewMode).then(() => {
                $HOOK.dispatch(EVENTS.FILE.PREVIEWED, { file });
                fileUpload.updateProcessButtonState();
            });
        } catch (e) {
            fileUpload.error(e.message ? e.message : String(e));
        }
        return;
    }
    const fileItem = new FileItem(file);
    file.extend = fileItem;
    fileItem.preview(fileUpload.fileIcon, fileUpload.options.previewMode).then(() => {
        $HOOK.dispatch(EVENTS.FILE.PREVIEWED, { file });
        fileUpload.updateProcessButtonState();
    });
}

function onRemovedFile(file) {
    if (fileUpload.handle.files.length == 0) {
        elFileListWrapper.classList.add('d-hide');
        elUploadWrapper.classList.remove('d-hide');
        elProgressWrapper.classList.add('d-hide');
    }
    fileUpload.updateProcessButtonState();
}

export {
    fileUpload,
    elements,
    getPreviewTemplate,
    setPreviewTemplate
}
