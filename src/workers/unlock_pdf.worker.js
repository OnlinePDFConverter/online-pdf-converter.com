import { loadQPDF } from '@src/libraries/external';

self.addEventListener('message', async e => {
    const { type, files, settings } = e.data;
    if (type != 'process') return;

    try {
        const qpdf = await loadQPDF();
        const password = String(settings?.password || '');
        const filesBlob = [];
        const fileExtra = [];
        for (const item of files) {
            const { fileId, file } = item;
            const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const inputPath = `/unlock_input_${stamp}.pdf`;
            const outputPath = `/unlock_output_${stamp}.pdf`;
            try {
                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 0
                });

                const bytes = new Uint8Array(await file.arrayBuffer());
                qpdf.FS.writeFile(inputPath, bytes);

                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 20
                });

                const result = qpdf.callMain([
                    inputPath,
                    `--password=${password}`,
                    '--decrypt',
                    outputPath
                ]);
                if (result !== 0) {
                    throw new Error('Invalid or incorrect PDF password.');
                }

                let output = null;
                try {
                    output = qpdf.FS.readFile(outputPath, { encoding: 'binary' });
                } catch (e) {
                    const raw = getQpdfError(result, e);
                    if (isPasswordError(raw)) {
                        throw new Error('Invalid or incorrect PDF password.');
                    }
                    throw new Error(raw || 'Unable to unlock this PDF.');
                }

                if (!output || !output.length) {
                    const raw = getQpdfError(result);
                    if (isPasswordError(raw)) {
                        throw new Error('Invalid or incorrect PDF password.');
                    }
                    throw new Error(raw || 'Unable to unlock this PDF.');
                }

                if (result.error) {
                    const raw = getQpdfError(result);
                    if (isPasswordError(raw)) {
                        throw new Error('Invalid or incorrect PDF password.');
                    }
                }

                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 80
                });

                filesBlob.push(new Blob([output], { type: 'application/pdf' }));
                fileExtra.push({
                    originalSize: bytes.length,
                    unlockedSize: output.length
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
            } finally {
                cleanup(qpdf, [inputPath, outputPath]);
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

function isPasswordError(message) {
    const lower = String(message || '').toLowerCase();
    return lower.includes('invalid password')
        || lower.includes('incorrect password')
        || lower.includes('wrong password')
        || lower.includes('password failed')
        || lower.includes('requires a password')
        || lower.includes('invalid/unknown/unsupported password');
}

function getQpdfError(result, error) {
    return [
        result.stderr,
        result.error && (result.error.message || String(result.error)),
        error && (error.message || String(error))
    ].filter(Boolean).join('\n');
}

function cleanup(qpdf, paths) {
    paths.forEach(path => {
        try {
            if (qpdf.FS.analyzePath(path).exists) {
                qpdf.FS.unlink(path);
            }
        } catch (e) {
            // Ignore cleanup failures.
        }
    });
}
