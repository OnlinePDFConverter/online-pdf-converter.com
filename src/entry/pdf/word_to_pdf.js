import '../common';
import '@css/upload.css';
import '@css/pdf/word_to_pdf.css';
import { fileUpload, elements } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';

const outputFileName = '{name}_word_to.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/word_to_pdf.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    elements,
    outputFileName
});

fileUpload.fileIcon = {
    icon: ASSETS_URL + 'images/file-icon/word.png'
};

fileUpload.setOption({
    acceptedFiles: '.docx,.doc'
});

fileUpload.onProcess = () => {
    startProcess();
}
    
fileUpload.init();
