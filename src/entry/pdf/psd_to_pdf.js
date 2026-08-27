import '../common';
import '@css/upload.css';
import '@css/pdf/psd_to_pdf.css';
import { fileUpload, elements } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';
import { initFileSortable } from './_file_sortable';
import { readPsd } from 'ag-psd';

const outputFileName = '{name}_psd_to.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/psd_to_pdf.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    elements,
    outputFileName
});

fileUpload.setOption({
    acceptedFiles: '.psd',
    previewMode: 'img_removable'
});

fileUpload.onProcess = () => {
    startProcess(getSettings(), getPsdImageFiles);
}

fileUpload.on('onAddedFile', async file => {
    try {
        const psd = readPsd(await file.arrayBuffer(), {
            skipLayerImageData: true,
            skipThumbnail: true
        });
        const blob = await new Promise((resolve, reject) => {
            if (!psd.canvas) {
                reject(new Error('Unable to render the PSD composite image.'));
                return;
            }
            psd.canvas.toBlob(blob => {
                if (blob) {
                    resolve(blob);
                    return;
                }
                reject(new Error('Unable to convert the PSD composite image to JPEG.'));
            }, 'image/jpeg', 0.8);
        });

        if (!fileUpload.handle.files.includes(file)) return;

        file.psdImageBlob = blob;
        file.extend.preview({
            icon: URL.createObjectURL(blob)
        });
        fileUpload.updateProcessButtonState();
    } catch (e) {
        if (!fileUpload.handle.files.includes(file)) return;
        fileUpload.fileError(file.upload.uuid, e.message ? e.message : String(e));
    }
});

fileUpload.init();

initFileSortable(fileUpload, elements.elFileList, {
    animation: 150,
    draggable: '.file-item',
    ghostClass: 'merge-sort-ghost',
    chosenClass: 'merge-sort-chosen',
    dragClass: 'merge-sort-drag',
    filter: 'button, input, textarea, select, a, label',
    preventOnFilter: false
});

const elPageSize = $D.get('[data-images-pdf-page-size]');
const elOrientation = $D.get('[data-images-pdf-orientation]');
const elMargin = $D.get('[data-images-pdf-margin]');

function getSettings() {
    return {
        settings: {
            pageSize: elPageSize.value,
            orientation: elOrientation.value,
            margin: parseInt(elMargin.value)
        }
    }
}

function getPsdImageFiles() {
    return fileUpload.getAcceptedFiles().map(file => ({
        fileId: file.upload.uuid,
        file: new File([file.psdImageBlob], file.name, {
            type: 'image/jpeg',
            lastModified: file.lastModified
        })
    }));
}
