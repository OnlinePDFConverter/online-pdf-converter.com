import '../common';
import '@css/upload.css';
import '@css/pdf/pdf_to_pdfa.css';
import { fileUpload, elements } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';

const outputFileName = '{name}_convert_pdfa.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/pdf_to_pdfa.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    elements,
    outputFileName
});

fileUpload.setOption({
    acceptedFiles: '.pdf'
});

fileUpload.onProcess = () => {
    startProcess(getSettings());
}
    
fileUpload.init();

function getSettings() {
    const level = document.querySelector('input[name="pdfa-level"]:checked')?.value || '2b';
    const preFlatten = document.querySelector('[data-pdfa-flatten-transparency]')?.checked === true;
    return {
        settings: {
            level: `${level}`,
            preFlatten
        }
    }
}
