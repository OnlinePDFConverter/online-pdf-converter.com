import { PDFDocument } from 'pdf-lib';

self.addEventListener('message', async event => {
    const { type, files, settings = {} } = event.data;
    if (type !== 'process') return;

    try {
        const sourceFile = files?.[0]?.file;
        if (!sourceFile) throw new Error('No PDF file.');

        const rect = normalizeRect(settings.rect);
        const scope = settings.scope === 'all' ? 'all' : 'current';
        const requestedPage = Number(settings.pageNumber);

        self.postMessage({ type: 'progress', progress: 0 });
        const pdf = await PDFDocument.load(await sourceFile.arrayBuffer());
        const pages = pdf.getPages();
        if (!pages.length) throw new Error('The PDF has no pages.');
        if (!Number.isInteger(requestedPage) || requestedPage < 1 || requestedPage > pages.length) {
            throw new Error('Invalid crop page.');
        }

        const pageIndexes = scope === 'all'
            ? pages.map((page, index) => index)
            : [requestedPage - 1];

        pageIndexes.forEach((pageIndex, index) => {
            const page = pages[pageIndex];
            const cropBox = page.getCropBox();
            const rotation = normalizeRotation(page.getRotation().angle);
            const nextCropBox = mapVisualRectToPdf(rect, cropBox, rotation);
            page.setCropBox(nextCropBox.x, nextCropBox.y, nextCropBox.width, nextCropBox.height);
            self.postMessage({
                type: 'progress',
                progress: Math.round((index + 1) / pageIndexes.length * 90)
            });
        });

        const bytes = await pdf.save();
        self.postMessage({ type: 'progress', progress: 100 });
        self.postMessage({
            type: 'complete',
            blob: [new Blob([bytes], { type: 'application/pdf' })],
            extra: [{ pages: pages.length, croppedPages: pageIndexes.length }]
        });
    } catch (error) {
        self.postMessage({
            type: 'error',
            error: error.message ? error.message : String(error)
        });
    }
});

function normalizeRect(rect) {
    const values = ['x', 'y', 'width', 'height'].map(key => Number(rect?.[key]));
    if (!values.every(Number.isFinite)) throw new Error('Invalid crop area.');
    let [x, y, width, height] = values;
    x = clamp(x, 0, 1);
    y = clamp(y, 0, 1);
    width = clamp(width, 0, 1 - x);
    height = clamp(height, 0, 1 - y);
    if (width <= 0 || height <= 0) throw new Error('The crop area is empty.');
    return { x, y, width, height };
}

function mapVisualRectToPdf(rect, cropBox, rotation) {
    const { x, y, width, height } = cropBox;
    switch (rotation) {
        case 0:
            return {
                x: x + rect.x * width,
                y: y + (1 - rect.y - rect.height) * height,
                width: rect.width * width,
                height: rect.height * height
            };
        case 90:
            return {
                x: x + rect.y * width,
                y: y + rect.x * height,
                width: rect.height * width,
                height: rect.width * height
            };
        case 180:
            return {
                x: x + (1 - rect.x - rect.width) * width,
                y: y + rect.y * height,
                width: rect.width * width,
                height: rect.height * height
            };
        case 270:
            return {
                x: x + (1 - rect.y - rect.height) * width,
                y: y + (1 - rect.x - rect.width) * height,
                width: rect.height * width,
                height: rect.width * height
            };
        default:
            throw new Error(`Unsupported page rotation: ${rotation}.`);
    }
}

function normalizeRotation(value) {
    const rotation = ((Number(value) % 360) + 360) % 360;
    if (![0, 90, 180, 270].includes(rotation)) {
        throw new Error(`Unsupported page rotation: ${value}.`);
    }
    return rotation;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
