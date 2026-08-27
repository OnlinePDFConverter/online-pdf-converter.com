import '../common';
import '@css/upload.css';
import '@css/pdf/fb2_to_pdf.css';
import { fileUpload, elements } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';

const outputFileName = '{name}_fb2_to.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/fb2_to_pdf.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    elements,
    outputFileName
});

fileUpload.fileIcon = {
    text: 'FB2'
};

fileUpload.setOption({
    acceptedFiles: '.fb2'
});

fileUpload.onProcess = () => {
    startProcess();
}
    
fileUpload.init();
