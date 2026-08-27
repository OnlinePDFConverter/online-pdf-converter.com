import scriptLoader from './script_loader';

async function loadCoherentPDF(beforeCall, afterCall) {
    if (typeof beforeCall === 'function') {
        beforeCall();
    }
    const modulePromise = import(
        /* webpackIgnore: true */
        `${ASSETS_URL}js/coherentpdf.browser.min.js`
    ).then(() => {
        if (typeof afterCall === 'function') {
            afterCall();
        }
        return self.coherentpdf;
    });
    return modulePromise;
}

async function loadPyMuPDF(beforeCall, afterCall) {
    if (typeof beforeCall === 'function') {
        beforeCall();
    }
    const modulePromise = import(
            /* webpackIgnore: true */
        `${ASSETS_URL}pymupdf/index.js`
    ).then(async module => {
        const pymupdf = new module.PyMuPDF({ 
            assetPath: `${ASSETS_URL}pymupdf/`,
            ghostscriptUrl: `${ASSETS_URL}ghostscript/`
        });
        await pymupdf.load();
        if (typeof afterCall === 'function') {
            afterCall();
        }
        return pymupdf;
    });
    return modulePromise;
}

async function loadGhostscript() {
    const ghostscriptPromise = import(
        /* webpackIgnore: true */
        `${ASSETS_URL}ghostscript/dist/index.js`
    ).then(module => module.loadGhostscriptWASM({
        baseUrl: `${ASSETS_URL}ghostscript/assets/`,
        print: text => console.log('[Ghostscript]', text),
        printErr: text => console.error('[Ghostscript]', text)
    })).catch(error => {
        throw error;
    });
    return ghostscriptPromise;
}

async function loadQPDF(beforeCall, afterCall) {
    if (typeof beforeCall === 'function') {
        beforeCall();
    }
    self.importScripts(`${ASSETS_URL}qpdf/qpdf.js`);
    const qpdf = await Module({
        locateFile: path => {
            if (path.endsWith('.wasm')) {
                return `${ASSETS_URL}qpdf/qpdf.wasm`;
            }
            return `${ASSETS_URL}qpdf/${path}`;
        }
    });
    if (typeof afterCall === 'function') {
        afterCall();
    }
    return qpdf;
}

async function loadDJVU() {
    return new Promise((resolve, reject) => {
        scriptLoader({
            id: 'djvu',
            src: `${ASSETS_URL}djvu/djvu.js`
        }, () => resolve(self.DjVu));
    });
}

export {
    loadCoherentPDF,
    loadPyMuPDF,
    loadGhostscript,
    loadQPDF,
    loadDJVU
}
