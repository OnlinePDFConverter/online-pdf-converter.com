import { PDFDocument } from 'pdf-lib';

self.addEventListener('message', async e => {
    const { type, files } = e.data;
    if (type != 'process') return;

    try {
        const pdfDoc = await PDFDocument.create();
        let pageCount = 0;
        for (const item of files) {
            const { fileId, file } = item;
            let sourcePDF;
            try {
                sourcePDF = await PDFDocument.load(await file.arrayBuffer());
            } catch (e) {
                self.postMessage({
                    type: 'file-error',
                    fileId,
                    error: e.message ? e.message : String(e)
                });
                return;
            }

            const copiedPages = await pdfDoc.copyPages(
                sourcePDF,
                sourcePDF.getPageIndices()
            );
            copiedPages.forEach((page, pageIndex) => {
                pdfDoc.addPage(page);
                pageCount++;
                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: Math.round((pageIndex + 1) / copiedPages.length * 100)
                });
            });
            self.postMessage({
                type: 'file-complete',
                fileId
            });
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
