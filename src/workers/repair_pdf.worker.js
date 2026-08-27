import { loadQPDF } from '@src/libraries/external';

self.addEventListener('message', async e => {
    const { type, files, settings } = e.data;
    if (type != 'process') return;

    try {
        const qpdf = await loadQPDF();
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

                const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                const inputPath = `/repair_input_${stamp}.pdf`;
                const outputPath = `/repair_output_${stamp}.pdf`;
                const bytes = new Uint8Array(await file.arrayBuffer());
                qpdf.FS.writeFile(inputPath, bytes);
                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 20
                });
                
                const result = qpdf.callMain([inputPath, '--decrypt', outputPath]);
                const output = qpdf.FS.readFile(outputPath, { encoding: 'binary' });
                if (!output || !output.length) {
                    throw new Error('File read failed.');
                }

                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 40
                });

                filesBlob.push(new Blob([output], { type: 'application/pdf' }));
                fileExtra.push({
                    originalSize: bytes.length,
                    repairedSize: output.length
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
