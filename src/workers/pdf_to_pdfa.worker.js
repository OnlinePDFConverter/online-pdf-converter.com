import { loadGhostscript, loadPyMuPDF } from '@src/libraries/external';
import { convertToPdfA } from '@libs/pdfa';


self.addEventListener('message', async e => {
    const { type, files, settings } = e.data;
    if (type != 'process') return;

    try {
        const gs = await loadGhostscript();
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

                const originalBytes = new Uint8Array(await file.arrayBuffer());
                let inputBytes = originalBytes;
                self.postMessage({ 
                    type: 'file-progress', 
                    fileId, 
                    progress: 10 
                });

                if (settings.preFlatten) {
                    const pymupdf = await loadPyMuPDF();
                    const flattened = await pymupdf.rasterizePdf(
                        new Blob([originalBytes], { type: 'application/pdf' }),
                        { dpi: 300, format: 'png', alpha: false }
                    );
                    inputBytes = new Uint8Array(await flattened.arrayBuffer());
                }

                self.postMessage({ 
                    type: 'file-progress', 
                    fileId, 
                    progress: 40 
                });

                const output = await convertToPdfA(gs, inputBytes, settings.level);
                self.postMessage({ 
                    type: 'file-progress', 
                    fileId, 
                    progress: 90 
                });

                filesBlob.push(new Blob([output], { type: 'application/pdf' }));
                fileExtra.push({
                    originalSize: originalBytes.length,
                    convertedSize: output.length,
                    level: settings.level,
                    preFlatten: settings.preFlatten
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
