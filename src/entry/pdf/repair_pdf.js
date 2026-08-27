import '../common';
import '@css/upload.css';
import '@css/pdf/repair_pdf.css';
import { fileUpload } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';

const outputFileName = '{name}_repaired.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/repair_pdf.worker.js', import.meta.url), { type: 'module' }),
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