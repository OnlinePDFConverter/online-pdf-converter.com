import { PDFDocument, PageSizes } from 'pdf-lib';


self.addEventListener('message', async e => {
    const { type, files, settings } = e.data;
    if (type != 'process') return;

    try {
        const pdfDoc = await PDFDocument.create();
        let pageCount = 0;

        for (const item of files) {
            const { fileId, file } = item;
            try {
                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 0
                });

                const embedded = await embedImage(pdfDoc, file);
                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 60
                });

                const pageSize = getPageSize(embedded.width, embedded.height, settings);
                const placement = getImagePlacement(
                    embedded.width,
                    embedded.height,
                    pageSize.width,
                    pageSize.height,
                    settings.margin
                );
                const page = pdfDoc.addPage([pageSize.width, pageSize.height]);
                page.drawImage(embedded.image, placement);
                pageCount++;

                self.postMessage({
                    type: 'file-complete',
                    fileId
                });
            } catch (e) {
                self.postMessage({
                    type: 'file-error',
                    fileId,
                    error: e.message ? e.message : String(e)
                });
                return;
            }
        }

        const bytes = await pdfDoc.save();
        self.postMessage({
            type: 'complete',
            blob: new Blob([bytes], { type: 'application/pdf' }),
            extra: {
                pageCount
            }
        });
    } catch (e) {
        self.postMessage({
            type: 'error',
            error: e.message ? e.message : String(e)
        });
    }
});

function getPageSize(imageWidth, imageHeight, settings) {
    let width;
    let height;

    if (settings.pageSize == 'FIT') {
        width = imageWidth + settings.margin * 2;
        height = imageHeight + settings.margin * 2;
    } else {
        [width, height] = PageSizes[settings.pageSize];
    }

    const imageIsLandscape = imageWidth > imageHeight;
    const pageIsLandscape = width > height;
    const shouldUseLandscape = settings.orientation == 'landscape'
        || (settings.orientation == 'auto' && imageIsLandscape);
    const shouldUsePortrait = settings.orientation == 'portrait'
        || (settings.orientation == 'auto' && !imageIsLandscape);

    if ((shouldUseLandscape && !pageIsLandscape) || (shouldUsePortrait && pageIsLandscape)) {
        [width, height] = [height, width];
    }

    return { width, height };
}

function getImagePlacement(imageWidth, imageHeight, pageWidth, pageHeight, requestedMargin) {
    const maxMargin = Math.max(0, (Math.min(pageWidth, pageHeight) - 1) / 2);
    const margin = Math.min(requestedMargin, maxMargin);
    const availableWidth = Math.max(1, pageWidth - margin * 2);
    const availableHeight = Math.max(1, pageHeight - margin * 2);
    const scale = Math.min(availableWidth / imageWidth, availableHeight / imageHeight, 1);
    const width = imageWidth * scale;
    const height = imageHeight * scale;

    return {
        x: (pageWidth - width) / 2,
        y: (pageHeight - height) / 2,
        width,
        height
    };
}

async function embedImage(pdfDoc, file) {
    const imageType = getImageType(file);

    if (imageType == 'jpg') {
        const image = await pdfDoc.embedJpg(await file.arrayBuffer());
        return getEmbeddedImageData(image);
    }
    if (imageType == 'png') {
        const image = await pdfDoc.embedPng(await file.arrayBuffer());
        return getEmbeddedImageData(image);
    }
    if (imageType == 'webp' || imageType == 'bmp') {
        const pngBytes = await convertImageToPng(file);
        const image = await pdfDoc.embedPng(pngBytes);
        return getEmbeddedImageData(image);
    }

    throw new Error('Unsupported image format.');
}

function getEmbeddedImageData(image) {
    if (!(image.width > 0) || !(image.height > 0)) {
        throw new Error('The image has invalid dimensions.');
    }
    return {
        image,
        width: image.width,
        height: image.height
    };
}

function getImageType(file) {
    const mimeType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    if (mimeType == 'image/jpeg' || /\.jpe?g$/.test(fileName)) return 'jpg';
    if (mimeType == 'image/png' || /\.png$/.test(fileName)) return 'png';
    if (mimeType == 'image/webp' || /\.webp$/.test(fileName)) return 'webp';
    if (mimeType == 'image/bmp' || mimeType == 'image/x-ms-bmp' || /\.bmp$/.test(fileName)) return 'bmp';
    return '';
}

async function convertImageToPng(file) {
    if (typeof createImageBitmap !== 'function' || typeof OffscreenCanvas == 'undefined') {
        throw new Error('This browser cannot decode WebP or BMP images in a worker.');
    }

    const bitmap = await createImageBitmap(file);
    try {
        if (!(bitmap.width > 0) || !(bitmap.height > 0)) {
            throw new Error('The image has invalid dimensions.');
        }

        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const context = canvas.getContext('2d', { alpha: true });
        if (!context) {
            throw new Error('Unable to create an image rendering context.');
        }

        context.drawImage(bitmap, 0, 0);
        const blob = await canvas.convertToBlob({ type: 'image/png' });
        return await blob.arrayBuffer();
    } finally {
        if (typeof bitmap.close == 'function') {
            bitmap.close();
        }
    }
}
