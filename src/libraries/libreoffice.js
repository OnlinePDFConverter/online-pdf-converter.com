import { WorkerBrowserConverter, loadFontsFromUrl } from '@matbee/libreoffice-converter/browser';

const DEFAULT_BASE_PATH = `${ASSETS_URL}libreoffice-wasm/`;
const CJK_FONT = `${ASSETS_URL}fonts/NotoSansCJKsc-Regular.zip`;
const PDF_MIME = 'application/pdf';

let converterInstance = null;

export class LibreOfficeConverter {
    constructor(options = {}) {
        if (typeof options === 'string') {
            options = { basePath: options };
        }

        const basePath = options.basePath || DEFAULT_BASE_PATH;
        this.basePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
        this.includeCJKFont = options.includeCJKFont !== false;
        this.verbose = options.verbose ?? false;
        this.converter = null;
        this.initialized = false;
        this.initPromise = null;
        this.callback = options.callback ?? {
            onBeforeInit: () => {},
            onAfterInit: () => {},
            onBeforeLoadCJK: () => {},
            onAfterLoadCJK: () => {},
            onWorkerBrowserProgress: () => {},
            onConvert: () => {}
        };
    }

    setCallback(callback) {
        if (callback) {
            this.callback = callback;
        }
    }

    async initialize() {
        if (this.initialized) return;
        if (this.initPromise) return this.initPromise;

        this.callback.onBeforeInit();
        this.initPromise = this.initializeConverter().finally(() => {
            this.initPromise = null;
            this.callback.onAfterInit();
        });
        return this.initPromise;
    }

    async initializeConverter() {
        let instance;
        try {
            const options = {
                sofficeJs: `${this.basePath}soffice.js`,
                sofficeWasm: `${this.basePath}soffice.wasm.bin`,
                sofficeData: `${this.basePath}soffice.data.bin`,
                sofficeWorkerJs: `${this.basePath}soffice.worker.js`,
                browserWorkerJs: `${this.basePath}browser.worker.global.js`,
                verbose: this.verbose,
                onProgress: info => {
                    this.callback.onWorkerBrowserProgress(info);
                    //info.phase, info.percent, info.message
                }
            };
            if (this.includeCJKFont) {
                this.callback.onBeforeLoadCJK();
                const cjkFont = await loadFontsFromUrl(CJK_FONT);
                options.fonts = cjkFont;
                this.callback.onAfterLoadCJK();
            }
            instance = new WorkerBrowserConverter(options);
            await instance.initialize();

            this.converter = instance;
            this.initialized = true;
        } catch (error) {
            if (instance) {
                await instance.destroy().catch(() => {});
            }
            this.converter = null;
            this.initialized = false;
            throw error;
        }
    }

    isReady() {
        return this.initialized && this.converter !== null;
    }

    async convertToPdf(file) {
        if (!this.isReady()) {
            throw new Error('Converter not initialized.');
        }
        if (!file || file.size === 0) {
            throw new Error('The document is empty.');
        }

        let progress = 85;
        const inputFormat = file.name.split('.').pop()?.toLowerCase() || '';
        this.callback.onConvert(progress);
        const timer = setInterval(() => {
            progress = Math.min(98, progress + 1);
            this.callback.onConvert(progress);
        }, 800);

        try {
            const uint8Array = new Uint8Array(await file.arrayBuffer());
            const result = await this.converter.convert(uint8Array, {
                inputFormat,
                outputFormat: 'pdf'
            }, file.name);

            const output = new Uint8Array(result.data);
            this.callback.onConvert(100);
            return new Blob([output], { type: result.mimeType || PDF_MIME });
        } finally {
            clearInterval(timer);
        }
    }

    wordToPdf(file) {
        return this.convertToPdf(file);
    }

    excelToPdf(file) {
        return this.convertToPdf(file);
    }

    pptToPdf(file) {
        return this.convertToPdf(file);
    }

    async destroy() {
        if (this.converter) {
            await this.converter.destroy();
        }
        this.converter = null;
        this.initialized = false;
        this.initPromise = null;
    }
}

export function getLibreOfficeConverter(options) {
    if (!converterInstance) {
        converterInstance = new LibreOfficeConverter(options);
    } else {
        converterInstance.setCallback(options?.callback);
    }
    return converterInstance;
}
