import { loadCoherentPDF, loadPyMuPDF } from '@libs/external';

const QUALITY_OPTIONS = {
    screen: {
        coherentQuality: 'low',
        dpi: 72,
        jpegQuality: 40
    },
    balanced: {
        coherentQuality: 'medium',
        dpi: 120,
        jpegQuality: 65
    },
    quality: {
        coherentQuality: 'high',
        dpi: 200,
        jpegQuality: 85
    },
    extreme: {
        coherentQuality: 'maximum',
        dpi: 300,
        jpegQuality: 95
    }
};

self.addEventListener('message', async e => {
    const { type, files, settings = {} } = e.data;
    if (type != 'process') return;

    try {
        const coherentpdf = await loadCoherentPDF();
        const pymupdf = await loadPyMuPDF();
        const quality = getQualityOptions(settings);
        const removeMetadata = settings.removeMetadata;
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
                const bytes = new Uint8Array(await file.arrayBuffer());
                const pdf = coherentpdf.fromMemory(bytes, '');

                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 20
                });

                if (removeMetadata) {
                    coherentpdf.setTitle(pdf, '');
                    coherentpdf.setAuthor(pdf, '');
                    coherentpdf.setSubject(pdf, '');
                    coherentpdf.setKeywords(pdf, '');
                    coherentpdf.setCreator(pdf, '');
                    coherentpdf.setProducer(pdf, '');
                }

                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 40
                });

                if (quality.coherentQuality !== 'maximum') {
                    coherentpdf.compress(pdf);
                }

                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 60
                });

                if (quality.coherentQuality === 'low' || quality.coherentQuality === 'medium') {
                    coherentpdf.squeezeInMemory(pdf);
                }

                let outputBytes;
                if (quality.coherentQuality === 'low') {
                    outputBytes = coherentpdf.toMemoryExt(
                        pdf,
                        false, // linearize
                        false, // make_id
                        false, // preserve_objstm
                        true,  // generate_objstm - create new object streams
                        true   // compress_objstm - compress object streams
                    );
                } else if (quality.coherentQuality === 'medium') {
                    outputBytes = coherentpdf.toMemoryExt(
                        pdf,
                        false, // linearize
                        false, // make_id
                        true,  // preserve_objstm
                        true,  // generate_objstm
                        true   // compress_objstm
                    );
                } else if (quality.coherentQuality === 'high') {
                    outputBytes = coherentpdf.toMemoryExt(
                        pdf,
                        false, // linearize
                        false, // make_id
                        true,  // preserve_objstm
                        false, // generate_objstm
                        true   // compress_objstm
                    );
                } else {
                    outputBytes = coherentpdf.toMemory(pdf, false, false);
                }
                const output = outputBytes instanceof Uint8Array ? outputBytes : new Uint8Array(outputBytes);
                const structureBlob = new Blob([output], { type: 'application/pdf' });

                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 80
                });

                const result = await pymupdf.compressPdf(structureBlob, {
                    scrub: {
                        metadata: !!removeMetadata,
                        xmlMetadata: !!removeMetadata,
                        attachedFiles: false,
                        embeddedFiles: false,
                        thumbnails: true,
                        resetFields: false,
                        resetResponses: false
                    },
                    images: {
                        enabled: true,
                        dpiThreshold: quality.dpi + 10,
                        dpiTarget: quality.dpi,
                        quality: quality.jpegQuality,
                        lossy: true,
                        lossless: true,
                        bitonal: false,
                        color: true,
                        gray: true,
                        convertToGray: false
                    },
                    subsetFonts: true,
                    save: {
                        garbage: 4,
                        deflate: true,
                        clean: true,
                        useObjstms: true
                    }
                });
                filesBlob.push(result.blob);
                fileExtra.push({
                    compressedSize: result.compressedSize,
                    originalSize: result.originalSize,
                    pageCount: result.pageCount,
                    savings: result.savings,
                    savingsPercent: result.savingsPercent
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

function getQualityOptions(settings) {
    if (settings.quality === 'custom') {
        return {
            coherentQuality: settings.customCoherentQuality,
            dpi: settings.customDpi,
            jpegQuality: settings.customJpegQuality
        };
    }

    return QUALITY_OPTIONS[settings.quality] || QUALITY_OPTIONS.balanced;
}
