import { LibreOfficeConverter } from "@src/libraries/libreoffice";
import { getPyodideDocxConverter } from '@src/libraries/pyodide_docx';
import PDFHelper from '@libs/PDFHelper';

const LIBREOFFICE_TIMEOUT = 10000;
let libreOfficeInstance = null;

self.addEventListener('message', async e => {
    const { type, files, settings } = e.data;
    if (type != 'process') return;

    try {
        const filesBlob = [];
        const fileExtra = [];
        for (const item of files) {
            const { fileId, file } = item;
            try {
                let reportedProgress = 0;
                const postProgress = (progress, progressText) => {
                    const numericProgress = Number(progress);
                    const normalizedProgress = Number.isFinite(numericProgress)
                        ? Math.max(0, Math.min(100, Math.round(numericProgress)))
                        : reportedProgress;
                    reportedProgress = Math.max(reportedProgress, normalizedProgress);

                    const message = {
                        type: 'file-progress',
                        fileId,
                        progress: reportedProgress
                    };
                    if (progressText !== undefined) {
                        message.progressText = progressText;
                    }
                    self.postMessage(message);
                };

                postProgress(0);

                let timeoutTimer;
                let resolveTimeout;
                let libreOfficeTimedOut = false;
                const timeoutPromise = new Promise(resolve => {
                    resolveTimeout = resolve;
                });
                const startTimeout = () => {
                    if (timeoutTimer) return;
                    timeoutTimer = setTimeout(() => {
                        libreOfficeTimedOut = true;
                        resolveTimeout(null);
                    }, LIBREOFFICE_TIMEOUT);
                };

                const callback = {
                    onBeforeInit: () => {
                        if (!libreOfficeTimedOut) postProgress(10);
                    },
                    onAfterInit: () => {
                        if (!libreOfficeTimedOut) postProgress(85);
                    },
                    onBeforeLoadCJK: () => {
                        if (!libreOfficeTimedOut) postProgress(20);
                    },
                    onAfterLoadCJK: () => {
                        if (!libreOfficeTimedOut) postProgress(40);
                    },
                    onWorkerBrowserProgress: (info) => {
                        startTimeout();
                        if (libreOfficeTimedOut) return;
                        const percent = Math.max(0, Math.min(100, Number(info.percent) || 0));
                        postProgress(40 + Math.round(percent * 0.45));
                    },
                    onConvert: (progress) => {
                        startTimeout();
                        if (!libreOfficeTimedOut) postProgress(progress);
                    }
                };
                if (!libreOfficeInstance) {
                    libreOfficeInstance = new LibreOfficeConverter({
                        includeCJKFont: true,
                        callback
                    });
                } else {
                    libreOfficeInstance.setCallback(callback);
                }
                const libreOffice = libreOfficeInstance;
                const libreOfficePromise = (async () => {
                    await libreOffice.initialize();
                    return libreOfficeTimedOut ? null : libreOffice.convertToPdf(file);
                })();

                let blob;
                try {
                    blob = await Promise.race([libreOfficePromise, timeoutPromise]);
                } finally {
                    clearTimeout(timeoutTimer);
                }

                if (blob === null) {
                    if (libreOfficeInstance === libreOffice) {
                        libreOfficeInstance = null;
                    }
                    void libreOffice.destroy().catch(() => {});

                    const fileExtension = file.name.split('.').pop()?.toLowerCase();
                    if (fileExtension === 'docx') {
                        const pyodideDocx = getPyodideDocxConverter({
                            callback: {
                                onBeforeInit: () => {
                                    postProgress(10);
                                },
                                onInitialize: (info) => {
                                    postProgress(info.percent);
                                },
                                onAfterInit: () => {
                                    postProgress(30);
                                },
                                onConvert: (progress) => {
                                    postProgress(progress);
                                }
                            }
                        });
                        await pyodideDocx.initialize();
                        blob = await pyodideDocx.convertToPdf(file);
                    } else {
                        const retryLibreOffice = new LibreOfficeConverter({
                            includeCJKFont: false,
                            callback: {
                                onBeforeInit: () => postProgress(10),
                                onAfterInit: () => postProgress(85),
                                onBeforeLoadCJK: () => {},
                                onAfterLoadCJK: () => {},
                                onWorkerBrowserProgress: (info) => {
                                    const percent = Math.max(0, Math.min(100, Number(info.percent) || 0));
                                    postProgress(40 + Math.round(percent * 0.45));
                                },
                                onConvert: (progress) => postProgress(progress)
                            }
                        });
                        try {
                            await retryLibreOffice.initialize();
                            blob = await retryLibreOffice.convertToPdf(file);
                        } finally {
                            await retryLibreOffice.destroy().catch(() => {});
                        }
                    }
                }
                filesBlob.push(blob);

                const pdfHelper = new PDFHelper({
                    data: await blob.arrayBuffer()
                });
                const pdfDoc = await pdfHelper.getPDFDocument();

                fileExtra.push({
                    pageCount: pdfDoc.numPages
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
