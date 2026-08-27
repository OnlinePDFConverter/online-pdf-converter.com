import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';


self.addEventListener('message', async e => {
    const { type, files, settings } = e.data;
    if (type !== 'process') return;

    try {
        self.postMessage({
            type: 'progress',
            progress: 0
        });
        settings.color = parseColor(settings.color);
        const filesBlob = [];
        const fileExtra = [];
        const { file } = files[0];

        const result = await addPageNumbers(file, settings, progress => {
            self.postMessage({
                type: 'progress',
                progress
            });
        });

        filesBlob.push(result.blob);
        fileExtra.push({
            pageCount: result.pageCount,
            numberedPages: result.numberedPages
        });

        self.postMessage({
            type: 'complete',
            blob: filesBlob,
            extra: fileExtra
        });
    } catch (error) {
        self.postMessage({
            type: 'error',
            error: error?.message || String(error)
        });
    }
});

async function addPageNumbers(file, settings, onProgress) {
    const pdfDoc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const numberedPages = Math.max(0, pages.length - settings.startPage + 1);

    if (numberedPages < 1) {
        throw new Error('The start page is outside this PDF.');
    }

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    for (let index = settings.startPage - 1; index < pages.length; index++) {
        const page = pages[index];
        const pageNumber = settings.startNumber + index - settings.startPage + 1;
        const text = formatPageNumber(settings, pageNumber, numberedPages);

        try {
            drawPageNumber(page, font, text, settings);
        } catch (error) {
            if (/WinAnsi|encode/i.test(error?.message || '')) {
                throw new Error('The custom format contains characters that are not supported.');
            }
            throw error;
        }

        const processedPages = index - settings.startPage + 2;
        onProgress(Math.round(processedPages / numberedPages * 100));
    }

    const bytes = await pdfDoc.save({ useObjectStreams: true });
    return {
        blob: new Blob([bytes], { type: 'application/pdf' }),
        pageCount: pages.length,
        numberedPages
    };
}

function drawPageNumber(page, font, text, settings) {
    const rotation = normalizeRotation(page.getRotation().angle);
    const { width, height } = page.getSize();
    const displayWidth = rotation === 90 || rotation === 270 ? height : width;
    const displayHeight = rotation === 90 || rotation === 270 ? width : height;
    const textWidth = font.widthOfTextAtSize(text, settings.fontSize);
    const visualPoint = getVisualPosition(
        settings.position,
        displayWidth,
        displayHeight,
        textWidth,
        settings.fontSize,
        settings.margin
    );
    const point = visualToPagePoint(visualPoint.x, visualPoint.y, width, height, rotation);

    page.drawText(text, {
        x: point.x,
        y: point.y,
        size: settings.fontSize,
        font,
        color: settings.color,
        rotate: degrees(rotation)
    });
}

function getVisualPosition(position, width, height, textWidth, fontSize, margin) {
    const isTop = position.startsWith('top');
    const isLeft = position.endsWith('left');
    const isRight = position.endsWith('right');
    const maxX = Math.max(0, width - textWidth);
    const maxY = Math.max(0, height - fontSize);

    let x = (width - textWidth) / 2;
    if (isLeft) x = margin;
    if (isRight) x = width - margin - textWidth;

    const y = isTop ? height - margin - fontSize : margin;
    return {
        x: Math.max(0, Math.min(maxX, x)),
        y: Math.max(0, Math.min(maxY, y))
    };
}

function visualToPagePoint(x, y, width, height, rotation) {
    switch (rotation) {
        case 90:
            return { x: width - y, y: x };
        case 180:
            return { x: width - x, y: height - y };
        case 270:
            return { x: y, y: height - x };
        default:
            return { x, y };
    }
}

function formatPageNumber(settings, pageNumber, totalNumberedPages) {
    return settings.format
        .replace(/\{page\}/g, String(pageNumber))
        .replace(/\{total\}/g, String(totalNumberedPages));
}

function parseColor(value) {
    const match = String(value || '#333333').trim().match(/^#?([0-9a-f]{6})$/i);
    const hex = match ? match[1] : '333333';
    const number = parseInt(hex, 16);
    return rgb(
        ((number >> 16) & 255) / 255,
        ((number >> 8) & 255) / 255,
        (number & 255) / 255
    );
}

function normalizeRotation(rotation) {
    return ((Number(rotation) || 0) % 360 + 360) % 360;
}
