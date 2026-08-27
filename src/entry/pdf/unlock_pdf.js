import '../common';
import '@css/upload.css';
import '@css/pdf/unlock_pdf.css';
import { fileUpload, elements } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';

const outputFileName = '{name}_unlocked.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/unlock_pdf.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    elements,
    outputFileName
});

fileUpload.fileIcon = {
    icon: ASSETS_URL + 'images/file-icon/pdf.png'
};

fileUpload.setOption({
    acceptedFiles: '.pdf'
});

fileUpload.onProcess = () => {
    startProcess(getSettings());
}
    
fileUpload.init();

function getSettings() {
    return {
        settings: {
            password: $D.get('[data-unlock-password]').value
        }
    }
}
