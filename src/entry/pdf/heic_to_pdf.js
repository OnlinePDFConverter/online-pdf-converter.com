import '../common';
import '@css/upload.css';
import '@css/pdf/heic_to_pdf.css';
import { fileUpload, elements } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';
import { initFileSortable } from './_file_sortable';
import heic2any from 'heic2any';
import { appendSuffix } from '@src/libraries/misc';

const outputFileName = '{name}_heic_to.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/heic_to_pdf.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    elements,
    outputFileName
});

fileUpload.setOption({
    acceptedFiles: '.heic,.heif',
    previewMode: 'img_removable'
});

fileUpload.onProcess = () => {
    startProcess(getSettings(), getHeicImageFiles);
}

fileUpload.on('onAddedFile', async file => {
    try {
        const result = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8
        });
        const blobs = Array.isArray(result) ? result : [result];
        if (!blobs.length) {
            throw new Error('No readable HEIC images were found.');
        }

        file.extend.preview({
            icon: URL.createObjectURL(blobs[0])
        });

        if (!fileUpload.handle.files.includes(file)) return;

        file.heicImageBlobs = blobs;
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

function getHeicImageFiles() {
    return fileUpload.getAcceptedFiles().flatMap(file => {
        return (file.heicImageBlobs || []).map((blob, index) => ({
            fileId: file.upload.uuid,
            file: new File([blob], appendSuffix(file.name, index), {
                type: 'image/jpeg',
                lastModified: file.lastModified
            })
        }));
    });
}
