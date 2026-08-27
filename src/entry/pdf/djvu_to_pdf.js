import '../common';
import '@css/upload.css';
import '@css/pdf/djvu_to_pdf.css';
import { fileUpload, elements } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';
import { loadDJVU } from '@src/libraries/external';
import { appendSuffix } from '@src/libraries/misc';

const outputFileName = '{name}_djvu_to.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/djvu_to_pdf.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    elements,
    outputFileName
});

// fileUpload.fileIcon = {
//     text: 'DJVU'
// };

fileUpload.setOption({
    acceptedFiles: '.djvu,.djv'
});

fileUpload.onProcess = () => {
    startProcess(getSettings(), getDjvuPageFiles);
}

let djvu = null;
fileUpload.on('onAddedFile', async file => {
    try {
        if (!djvu) {
            djvu = await loadDJVU();
        }
        const djvuDocument = new djvu.Document(await file.arrayBuffer());
        const pageCount = djvuDocument.getPagesQuantity();
        if (pageCount < 1) {
            throw new Error('No readable DjVu pages were found.');
        }

        const blobs = [];
        for (let i = 0; i < pageCount; i++) {
            if (!fileUpload.handle.files.includes(file)) return;
            const page = await djvuDocument.getPage(i + 1);
            const blob = await djvuPageToPng(page);
            blobs.push(blob);
        }

        file.extend.preview({
            icon: URL.createObjectURL(blobs[0])
        });
        
        if (!fileUpload.handle.files.includes(file)) return;

        file.djvuPageBlobs = blobs;
        fileUpload.updateProcessButtonState();
    } catch (e) {
        if (!fileUpload.handle.files.includes(file)) return;
        fileUpload.fileError(file.upload.uuid, e.message ? e.message : String(e));
    }
});

fileUpload.init();

const elPageSize = $D.get('[data-images-pdf-page-size]');
const elOrientation = $D.get('[data-images-pdf-orientation]');
const elMargin = $D.get('[data-images-pdf-margin]');

function getSettings() {
    return {
        settings: {
            pageSize: elPageSize.value,
            orientation: elOrientation.value,
            margin: parseInt(elMargin.value)
        }
    }
}

function getDjvuPageFiles() {
    return fileUpload.getAcceptedFiles().flatMap(file => {
        return (file.djvuPageBlobs || []).map((blob, index) => ({
            fileId: file.upload.uuid,
            file: new File([blob], appendSuffix(file.name, index), {
                type: 'image/png',
                lastModified: file.lastModified
            })
        }));
    });
}

function djvuPageToPng(page) {
    const imageData = page.getImageData();
    if (!(imageData.width > 0) || !(imageData.height > 0)) {
        throw new Error('The DjVu page has invalid dimensions.');
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
        throw new Error('Unable to create an image rendering context.');
    }

    canvas.width = imageData.width;
    canvas.height = imageData.height;
    context.putImageData(imageData, 0, 0);

    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob);
                return;
            }
            reject(new Error('Unable to convert the DjVu page to PNG.'));
        }, 'image/png');
    });
}
