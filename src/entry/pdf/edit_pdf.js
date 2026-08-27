import '../common';
import '@css/upload.css';
import '@components/PdfViewer/theme/default.css';
import '@css/pdf/edit_pdf.css';
import { fileUpload, elements } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';
import PdfViewer from '@components/PdfViewer/PdfViewer';

const outputFileName = '{name}_edited.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/edit_pdf.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    elements,
    outputFileName
});

const viewer = new PdfViewer(elements.elPdfViewer, {
    renderTextLayer: true,
    renderAnnotations: true,
    respectPageRotation: true,
    toolbar: ['open', 'pagination', 'zoom', 'select', 'sign_pdf', 'add_watermark', 'annotate', 'shapes', 'draw', 'edit_items', 'fullscreen', 'search']
});
const itemsPlugin = viewer.getToolbarPlugin('edit_items');
itemsPlugin.onChange(() => fileUpload.updateProcessButtonState());

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

fileUpload.availableProcess = () => fileUpload.getAcceptedFiles().length > 0 && itemsPlugin.hasExportableItems();
fileUpload.onProcess = () => startProcess({ settings: itemsPlugin.getEditData() });
fileUpload.init();
