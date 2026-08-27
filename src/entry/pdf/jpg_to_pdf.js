import '../common';
import '@css/upload.css';
import '@css/pdf/jpg_to_pdf.css';
import { fileUpload, elements } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';
import { initFileSortable } from './_file_sortable';

const outputFileName = '{name}_jpg_to.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/jpg_to_pdf.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    elements,
    outputFileName
});

fileUpload.setOption({
    acceptedFiles: '.jpg,.jpeg',
    previewMode: 'img_removable'
});

fileUpload.onProcess = () => {
    startProcess(getSettings());
}
    
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
