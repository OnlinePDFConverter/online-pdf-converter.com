import { PDFDocument } from 'pdf-lib';



self.addEventListener('message', async e => {
    const { type, files, settings } = e.data;
    if (type != 'process') return;

    try {
        self.postMessage({
            type: 'progress',
            progress: 0
        });

        const filesBlob = [];
        const fileExtra = [];
        const { file } = files[0];
        const sourcePDF = await PDFDocument.load(await file.arrayBuffer());
        let pageIndex = 1;
        for  (let pages of settings.pages) {
            const pdfDoc = await PDFDocument.create();
            const copiedPages = await pdfDoc.copyPages(
                sourcePDF,
                pages.map(pageNumber => pageNumber - 1)
            );
            copiedPages.forEach((page) => {
                pdfDoc.addPage(page);
            });
            const bytes = await pdfDoc.save();
            const blob = new Blob([bytes], { type: 'application/pdf' });
            if (settings.pages.length > 1) {
                filesBlob.push(new File([blob], `${pageIndex}.pdf`));
            } else {
                filesBlob.push(blob);
            }
            fileExtra.push({
                pages: pages.length
            });
            self.postMessage({
                type: 'progress',
                progress: Math.round(pageIndex / settings.pages.length * 100)
            });
            pageIndex++;
        }
        self.postMessage({
            type: 'complete',
            blob: filesBlob,
            extra: fileExtra
        });
    } catch (e) {
        self.postMessage({ 
            type: 'error', 
            error: e.message ? e.message : String(e) 
        });
    }
});
