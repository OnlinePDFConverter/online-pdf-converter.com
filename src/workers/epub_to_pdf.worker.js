import { loadPyMuPDF } from "@src/libraries/external";

self.addEventListener('message', async e => {
    const { type, files, settings } = e.data;
    if (type != 'process') return;

    try {
        const pymupdf = await loadPyMuPDF();
        const filesBlob = [];
        const fileExtra = [];
        for (const item of files) {
            const { fileId, file } = item;
            try {
                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 0
                });

                const blob = await pymupdf.epubToPdf(file);
                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 30
                });

                const doc = await pymupdf.open(file);
                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 50
                });

                filesBlob.push(blob);
                fileExtra.push({
                    pageCount: doc.pageCount
                });
                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 80
                });

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
