import { dataURLToBytes } from '@src/libraries/misc';
import { PDFDocument, degrees } from 'pdf-lib';

self.addEventListener('message', async event => {
    const { type, files, settings = {} } = event.data;
    if (type !== 'process') return;

    try {
        const watermarks = Array.isArray(settings.watermarks) ? settings.watermarks : [];
        if (!watermarks.length) throw new Error('No watermark.');
        const sourceFile = files && files[0] && files[0].file;
        if (!sourceFile) throw new Error('No PDF file.');

        self.postMessage({ type: 'progress', progress: 0 });
        const pdf = await PDFDocument.load(await sourceFile.arrayBuffer());
        const pages = pdf.getPages();
        const embeddedImages = new Map();

        for (let index = 0; index < watermarks.length; index += 1) {
            const watermark = watermarks[index];
            const pageIndex = Number(watermark.pageNumber) - 1;
            const page = pages[pageIndex];
            if (!page || typeof watermark.url !== 'string') continue;
            let image = embeddedImages.get(watermark.url);
            if (!image) {
                image = await pdf.embedPng(dataURLToBytes(watermark.url));
                embeddedImages.set(watermark.url, image);
            }

            if (watermark.tiled && watermark.tile) {
                const pageSize = page.getSize();
                getTilePlacements(pageSize, watermark.tile).forEach(placement => {
                    drawAtCenter(page, image, {
                        ...placement,
                        angle: watermark.angle,
                        opacity: watermark.opacity
                    });
                });
            } else if (watermark.placement) {
                drawAtCenter(page, image, watermark.placement);
            }

            self.postMessage({
                type: 'progress',
                progress: Math.round((index + 1) / watermarks.length * 90)
            });
        }

        const bytes = await pdf.save();
        self.postMessage({ type: 'progress', progress: 100 });
        self.postMessage({
            type: 'complete',
            blob: [new Blob([bytes], { type: 'application/pdf' })],
            extra: [{ pages: pages.length, watermarks: watermarks.length }]
        });
    } catch (error) {
        self.postMessage({
            type: 'error',
            error: error.message ? error.message : String(error)
        });
    }
});

function getTilePlacements(pageSize, tile) {
    const width = Math.max(1, Number(tile.width));
    const height = Math.max(1, Number(tile.height));
    const gapX = Math.max(0, Number(tile.gapX));
    const gapY = Math.max(0, Number(tile.gapY));
    const stepX = Math.max(1, width + gapX);
    const stepY = Math.max(1, height + gapY);
    const placements = [];
    let row = 0;
    for (let centerY = -height; centerY <= pageSize.height + height; centerY += stepY) {
        const offset = row % 2 ? stepX / 2 : 0;
        for (let centerX = -width + offset; centerX <= pageSize.width + width; centerX += stepX) {
            placements.push({ centerX, centerY, width, height });
        }
        row += 1;
    }
    return placements;
}

function drawAtCenter(page, image, placement) {
    const { height: pageHeight } = page.getSize();
    const width = Math.max(1, Number(placement.width));
    const height = Math.max(1, Number(placement.height));
    const centerX = Number(placement.centerX);
    const centerY = pageHeight - Number(placement.centerY);
    const angle = -Number(placement.angle || 0);
    const radians = angle * Math.PI / 180;
    const rotatedCenterX = width / 2 * Math.cos(radians) - height / 2 * Math.sin(radians);
    const rotatedCenterY = width / 2 * Math.sin(radians) + height / 2 * Math.cos(radians);
    page.drawImage(image, {
        x: centerX - rotatedCenterX,
        y: centerY - rotatedCenterY,
        width,
        height,
        rotate: degrees(angle),
        opacity: Math.max(0.05, Math.min(1, Number(placement.opacity)))
    });
}