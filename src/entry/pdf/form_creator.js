import '../common';
import '@css/upload.css';
import '@components/PdfViewer/theme/default.css';
import '@css/pdf/form_creator.css';
import { fileUpload, elements } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';
import PdfViewer from '@components/PdfViewer/PdfViewer';

const outputFileName = '{name}_fillable.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/form_creator.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    elements,
    outputFileName
});

const viewer = new PdfViewer(elements.elPdfViewer, {
    renderTextLayer: false,
    renderAnnotations: false,
    respectPageRotation: true,
    toolbar: ['open', 'pagination', 'zoom', 'forms', 'fullscreen']
});
const plugin = viewer.getToolbarPlugin('forms');
plugin.onChange(() => fileUpload.updateProcessButtonState());

fileUpload.setOption({
    acceptedFiles: '.pdf',
    singleMode: true,
    onAddedFile: file => {
        if (!file.accepted) return;
        elements.elUploadWrapper.classList.add('d-hide');
        $D.get('.viewer-wrapper').classList.remove('d-hide');
        viewer.load(file);
    }
});

fileUpload.availableProcess = () => {
    return fileUpload.getAcceptedFiles().length > 0 && plugin.hasChanges();
};

fileUpload.onProcess = () => startProcess(getSettings());
    
fileUpload.init();

function getSettings() {
    return {
        settings: plugin.getFormData()
    };
}
