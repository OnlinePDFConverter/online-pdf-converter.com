import '../common';
import '@css/upload.css';
import '@css/pdf/merge_pdf.css';
import { fileUpload, elements } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';
import { initFileSortable } from './_file_sortable';

const outputFileName = '{name}_merged.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/merge_pdf.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    outputFileName
});

fileUpload.setOption({
    acceptedFiles: '.pdf'
});

fileUpload.availableProcess = () => {
    const availableFiles = fileUpload.handle.files.every(file => file.previewElement && file.previewElement.classList.contains('has-success'));
    return fileUpload.getAcceptedFiles().length > 1 && availableFiles;
}

fileUpload.onProcess = () => {
    startProcess();
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

