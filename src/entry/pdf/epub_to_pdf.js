import '../common';
import '@css/upload.css';
import '@css/pdf/epub_to_pdf.css';
import { fileUpload, elements } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';

const outputFileName = '{name}_epub_to.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/epub_to_pdf.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    elements,
    outputFileName
});

fileUpload.fileIcon = {
    text: 'EPUB'
};

fileUpload.setOption({
    acceptedFiles: '.epub'
});

fileUpload.onProcess = () => {
    startProcess();
}
    
fileUpload.init();
