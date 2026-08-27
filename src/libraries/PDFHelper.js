import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = ASSETS_URL + 'js/pdfjs-dist/build/pdf.worker.min.mjs';
const cMapUrl = ASSETS_URL + 'js/pdfjs-dist/web/cmaps/';
const standardFontDataUrl = ASSETS_URL + 'js/pdfjs-dist/web/standard_fonts/';

class WorkerCanvasFactory {
    constructor({ enableHWA = false } = {}) {
        this.enableHWA = enableHWA;
    }

    create(width, height) {
        validateCanvasSize(width, height);
        const canvas = new OffscreenCanvas(width, height);
        return {
            canvas,
            context: canvas.getContext('2d', {
                willReadFrequently: !this.enableHWA
            })
        };
    }

    reset(canvasAndContext, width, height) {
        if (!canvasAndContext?.canvas) {
            throw new Error('Canvas is not specified');
        }
        validateCanvasSize(width, height);
        canvasAndContext.canvas.width = width;
        canvasAndContext.canvas.height = height;
    }

    destroy(canvasAndContext) {
        if (!canvasAndContext?.canvas) return;
        canvasAndContext.canvas.width = 0;
        canvasAndContext.canvas.height = 0;
        canvasAndContext.canvas = null;
        canvasAndContext.context = null;
    }
}

class WorkerFilterFactory {
    addFilter() { return 'none'; }
    addHCMFilter() { return 'none'; }
    addAlphaFilter() { return 'none'; }
    addLuminosityFilter() { return 'none'; }
    addKnockoutFilter() { return 'none'; }
    addHighlightHCMFilter() { return 'none'; }
    addSelectionHCMFilter() { return 'none'; }
    addSelectionFilter() { return 'none'; }
    createSelectionStyle() { return null; }
    destroy() {}
}

function validateCanvasSize(width, height) {
    if (!(width > 0) || !(height > 0)) {
        throw new Error('Invalid canvas size');
    }
}

function isWorkerEnvironment() {
    return typeof document === 'undefined' && typeof OffscreenCanvas === 'function';
}

class PDFHelper
{
    constructor(options = {}) {
        this.options = {
            cMapPacked: true,
            cMapUrl: cMapUrl,
            disableAutoFetch: false,
            disableFontFace: false,
            disableRange: false,
            disableStream: false,
            useSystemFonts: false,
            enableXfa: true,
            fontExtraProperties: false,
            isEvalSupported: true,
            pdfBug: false,
            standardFontDataUrl: standardFontDataUrl
        };
        if (isWorkerEnvironment()) {
            Object.assign(this.options, {
                CanvasFactory: WorkerCanvasFactory,
                FilterFactory: WorkerFilterFactory,
                disableFontFace: true,
                useSystemFonts: false
            });
        }
        Object.assign(this.options, options);
        this.loadingTask = null;
        this.document = null;
    }

    async getPDFDocument() {
        if (this.document) {
            return this.document;
        }
        if (!this.loadingTask) {
            this.loadingTask = pdfjsLib.getDocument(this.options);
        }
        try {
            this.document = await this.loadingTask.promise;
            return this.document;
        } catch (error) {
            const failedLoadingTask = this.loadingTask;
            this.loadingTask = null;
            try {
                if (failedLoadingTask && typeof failedLoadingTask.destroy === 'function') {
                    await failedLoadingTask.destroy();
                }
            } catch (destroyError) {
                // Preserve the original document loading error.
            }
            throw error;
        }
    }

    async getPage(num, canvasCallback) {
        const outputScale = window.devicePixelRatio || 1;
        num = parseInt(num);
        const pdf = await this.getPDFDocument();
        return pdf.getPage(num).then(async page => {
            const viewport = page.getViewport({scale: 1});
            const canvas = document.createElement('canvas');
            canvas.width = Math.floor(viewport.width * outputScale);
            canvas.height = Math.floor(viewport.height * outputScale);
            const context = canvas.getContext('2d');
            if (canvasCallback) {
                canvasCallback({
                    canvas,
                    context
                });
            }
            const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
            const renderContext = {
                canvasContext: context,
                transform,
                viewport
            };
            await page.render(renderContext).promise;
            return {
                page,
                canvas,
                width: viewport.width,
                height: viewport.height,
                pixelWidth: canvas.width,
                pixelHeight: canvas.height
            };
        });
    }

    async getPageForWorker(num, canvasCallback, renderScale = 2) {
        num = parseInt(num);
        renderScale = Math.max(0.1, Number(renderScale) || 2);
        const pdf = await this.getPDFDocument();
        const page = await pdf.getPage(num);
        let canvas = null;

        try {
            const baseViewport = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({ scale: renderScale });
            canvas = new OffscreenCanvas(Math.max(1, Math.floor(viewport.width)), Math.max(1, Math.floor(viewport.height)));
            const context = canvas.getContext('2d');
            if (canvasCallback) {
                canvasCallback({
                    canvas,
                    context
                });
            }
            // const context = canvas.getContext('2d', { alpha: false });
            // context.fillStyle = '#ffffff';
            // context.fillRect(0, 0, canvas.width, canvas.height);
            const renderContext = {
                canvasContext: context,
                viewport
            };
            await page.render(renderContext).promise;
            return {
                page,
                canvas,
                width: baseViewport.width,
                height: baseViewport.height,
                pixelWidth: canvas.width,
                pixelHeight: canvas.height
            };
        } catch (error) {
            this.releasePage({ page, canvas });
            throw error;
        }
    }

    cleanupPage(page) {
        if (!page || typeof page.cleanup !== 'function') return;

        try {
            page.cleanup();
        } catch (error) {
            // Page cleanup is best-effort and must not abort a completed render.
        }
    }

    releasePage(pageData) {
        if (!pageData) return;

        this.cleanupPage(pageData.page);
        if (pageData.canvas) {
            pageData.canvas.width = 1;
            pageData.canvas.height = 1;
        }
    }

    async destroy() {
        const pdfDocument = this.document;
        const loadingTask = this.loadingTask || pdfDocument?.loadingTask;
        this.document = null;
        this.loadingTask = null;

        try {
            if (pdfDocument && typeof pdfDocument.cleanup === 'function') {
                await pdfDocument.cleanup();
            }
        } catch (error) {
            // Cleanup errors must not replace a successful operation result.
        }

        try {
            if (loadingTask && typeof loadingTask.destroy === 'function') {
                await loadingTask.destroy();
            } else if (pdfDocument && typeof pdfDocument.destroy === 'function') {
                await pdfDocument.destroy();
            }
        } catch (error) {
            // Destroy errors are non-fatal once processing has completed or failed.
        }
    }
}

export default PDFHelper;
