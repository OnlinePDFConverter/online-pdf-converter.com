import '../common';
import '@css/upload.css';
import '@css/pdf/ppt_to_pdf.css';
import { fileUpload, elements } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';

const outputFileName = '{name}_ppt_to.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/ppt_to_pdf.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    elements,
    outputFileName
});

fileUpload.fileIcon = {
    icon: ASSETS_URL + 'images/file-icon/ppt.png'
};

fileUpload.setOption({
    acceptedFiles: '.pptx,.ppt'
});

fileUpload.onProcess = () => {
    startProcess();
}
    
fileUpload.init();
