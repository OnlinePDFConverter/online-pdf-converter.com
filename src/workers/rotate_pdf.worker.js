import { PDFDocument, degrees } from 'pdf-lib';

self.addEventListener('message', async e => {
    const { type, files } = e.data;
    if (type != 'process') return;

    try {
        self.postMessage({
            type: 'progress',
            progress: 0
        });
        const pdfDoc = await PDFDocument.create();
        const sourcePDFs = new Map();
        const fileIds = new Set();

        let index = 0;
        for (const item of files) {
            const { fileId, file, pageNumber } = item;
            try {
                let sourcePDF = sourcePDFs.get(fileId);
                if (!sourcePDF) {
                    sourcePDF = await PDFDocument.load(await file.arrayBuffer());
                    sourcePDFs.set(fileId, sourcePDF);
                }

                if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > sourcePDF.getPageCount()) {
                    throw new Error('Invalid page number.');
                }

                const rotation = getRotation(item.rotation);

                const [page] = await pdfDoc.copyPages(sourcePDF, [pageNumber - 1]);
                pdfDoc.addPage(page);
                if (rotation !== null) {
                    page.setRotation(degrees(normalizeRotation(page.getRotation().angle + rotation)));
                }

                fileIds.add(fileId);
                self.postMessage({
                    type: 'progress',
                    progress: Math.round((index + 1) / files.length * 100)
                });
                index++;
            } catch (e) {
                self.postMessage({
                    type: 'error',
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
                pageCount: pdfDoc.getPageCount()
            }
        });
    } catch (e) {
        self.postMessage({
            type: 'error',
            error: e.message ? e.message : String(e)
        });
    }
});

function normalizeRotation(rotation) {
    return ((rotation % 360) + 360) % 360;
}

function getRotation(rotation) {
    if (rotation === null || typeof rotation === 'undefined') {
        return null;
    }
    const value = Number(rotation);
    if (!Number.isFinite(value) || value % 90 !== 0) {
        throw new Error('Invalid page rotation.');
    }
    return normalizeRotation(value);
}