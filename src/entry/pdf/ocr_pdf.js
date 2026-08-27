import '../common';
import '@css/upload.css';
import '@css/pdf/ocr_pdf.css';
import { fileUpload } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';

const elLanguages = $D.get('[data-ocr-languages]');
const elOutputFormat = $D.get('[data-ocr-output-format]');
const elScale = $D.get('[data-ocr-scale]');

const outputFileName = data => `{name}_ocr.${data.outputFormat === 'txt' ? 'txt' : 'pdf'}`;
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/ocr_pdf.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    outputFileName
});

fileUpload.setOption({
    acceptedFiles: '.pdf',
    singleMode: true
});

fileUpload.onProcess = () => {
    startProcess(getSettings());
}
    
fileUpload.init();

function getSettings() {
    const selected = elLanguages
            ? Array.from(elLanguages.selectedOptions).map(option => option.value)
            : [];

    return {
        settings: {
            languages: selected.length ? selected : ['eng'],
            outputFormat: elOutputFormat.value,
            scale: parseFloat(elScale.value),
        }
    }
}
