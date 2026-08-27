import '../common';
import '@css/upload.css';
import '@css/pdf/pdf_to_word.css';
import { fileUpload } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';

const outputFileName = '{name}_pdf_to_word.docx';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/pdf_to_word.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    outputFileName
});

fileUpload.setOption({
    acceptedFiles: '.pdf'
});

fileUpload.onProcess = () => {
    startProcess();
}
    
fileUpload.init();