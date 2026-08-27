import '../common';
import '@css/upload.css';
import '@css/pdf/tiff_to_pdf.css';
import { fileUpload, elements } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';
import { initFileSortable } from './_file_sortable';
import { fromArrayBuffer } from 'geotiff';
import { appendSuffix } from '@src/libraries/misc';

const outputFileName = '{name}_tiff_to.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/tiff_to_pdf.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    elements,
    outputFileName
});

fileUpload.setOption({
    acceptedFiles: '.tif,.tiff',
    previewMode: 'img_removable',
    createImageThumbnails: false
});

fileUpload.onProcess = () => {
    startProcess(getSettings(), getTiffPageFiles);
}

fileUpload.on('onAddedFile', async file => {
    try {
        const tiff = await fromArrayBuffer(await file.arrayBuffer());
        const pageCount = await tiff.getImageCount();
        if (pageCount < 1) {
            throw new Error('No readable TIFF pages were found.');
        }

        const blobs = [];
        for (let i = 0; i < pageCount; i++) {
            const image = await tiff.getImage(i);
            const blob = await tiffImageToPng(image);
            if (i == 0) {
                file.extend.preview({
                    icon: URL.createObjectURL(blob)
                });
            }
            blobs.push(blob);
        }

        if (!fileUpload.handle.files.includes(file)) return;

        file.tiffPageBlobs = blobs;
        fileUpload.updateProcessButtonState();
    } catch (e) {
        if (!fileUpload.handle.files.includes(file)) return;
        fileUpload.fileError(file.upload.uuid, e.message ? e.message : String(e));
    }
    
});

fileUpload.init();

initFileSortable(fileUpload, elements.elFileList, {
    animation: 150,
    draggable: '.file-item',
    ghostClass: 'merge-sort-ghost',
    chosenClass: 'merge-sort-chosen',
    dragClass: 'merge-sort-drag',
    filter: 'button, input, textarea, select, a, label',
    preventOnFilter: false
});

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

function getTiffPageFiles() {
    return fileUpload.getAcceptedFiles().flatMap(file => {
        return (file.tiffPageBlobs || []).map((blob, index) => ({
            fileId: file.upload.uuid,
            file: new File([blob], appendSuffix(file.name, index), {
                type: 'image/png',
                lastModified: file.lastModified
            })
        }));
    });
}

async function tiffImageToPng(image) {
    const width = image.getWidth();
    const height = image.getHeight();
    if (!(width > 0) || !(height > 0)) {
        throw new Error('The TIFF image has invalid dimensions.');
    }

    const rgb = await image.readRGB({
        interleave: true,
        enableAlpha: true
    });
    const rgba = rgbToRgba(rgb, width, height);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
        throw new Error('Unable to create an image rendering context.');
    }

    canvas.width = width;
    canvas.height = height;
    context.putImageData(new ImageData(rgba, width, height), 0, 0);

    return await new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob);
                return;
            }
            reject(new Error('Unable to convert the TIFF image to PNG.'));
        }, 'image/png');
    });
}

function rgbToRgba(rgb, width, height) {
    const pixelCount = width * height;
    const channelCount = rgb.length / pixelCount;
    if (channelCount != 3 && channelCount != 4) {
        throw new Error('The TIFF image uses an unsupported color format.');
    }

    const rgba = new Uint8ClampedArray(pixelCount * 4);
    for (let i = 0; i < pixelCount; i++) {
        const inputOffset = i * channelCount;
        const outputOffset = i * 4;
        rgba[outputOffset] = rgb[inputOffset];
        rgba[outputOffset + 1] = rgb[inputOffset + 1];
        rgba[outputOffset + 2] = rgb[inputOffset + 2];
        rgba[outputOffset + 3] = channelCount == 4 ? rgb[inputOffset + 3] : 255;
    }
    return rgba;
}
