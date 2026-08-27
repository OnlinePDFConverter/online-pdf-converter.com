import { loadQPDF } from '@src/libraries/external';

const DEFAULT_PERMISSIONS = {
    printing: true,
    modifying: true,
    copying: true,
    annotating: true,
    fillingForms: true,
    contentAccessibility: true,
    documentAssembly: true
};

self.addEventListener('message', async e => {
    const { type, files, settings } = e.data;
    if (type != 'process') return;

    try {
        const qpdf = await loadQPDF();
        const options = normalizeSettings(settings);
        const filesBlob = [];
        const fileExtra = [];
        for (const item of files) {
            const { fileId, file } = item;
            const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const inputPath = `/protect_input_${stamp}.pdf`;
            const outputPath = `/protect_output_${stamp}.pdf`;
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

                qpdf.callMain(buildEncryptArgs(inputPath, outputPath, options));
                const output = qpdf.FS.readFile(outputPath, { encoding: 'binary' });
                if (!output || !output.length) {
                    throw new Error('File read failed.');
                }

                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 80
                });

                filesBlob.push(new Blob([output], { type: 'application/pdf' }));
                fileExtra.push({
                    originalSize: bytes.length,
                    protectedSize: output.length
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


function normalizeSettings(settings) {
    return {
        userPassword: String(settings?.userPassword || ''),
        ownerPassword: String(settings?.ownerPassword || ''),
        permissions: Object.assign({}, DEFAULT_PERMISSIONS, settings?.permissions || {})
    };
}

function buildEncryptArgs(inputPath, outputPath, settings) {
    const userPassword = settings.userPassword;
    const ownerPassword = settings.ownerPassword || userPassword;
    const hasDistinctOwnerPassword = !!settings.ownerPassword
        && settings.ownerPassword !== settings.userPassword;
    const args = [inputPath, '--encrypt', userPassword, ownerPassword, '256'];

    if (hasDistinctOwnerPassword) {
        const permissions = settings.permissions;

        if (!permissions.modifying) {
            args.push('--modify=none');
        }
        if (!permissions.copying) {
            args.push('--extract=n');
        }
        if (!permissions.printing) {
            args.push('--print=none');
        }
        if (!permissions.contentAccessibility) {
            args.push('--accessibility=n');
        }
        if (!permissions.annotating) {
            args.push('--annotate=n');
        }
        if (!permissions.documentAssembly) {
            args.push('--assemble=n');
        }
        if (!permissions.fillingForms) {
            args.push('--form=n');
        }
    }

    args.push('--', outputPath);
    return args;
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