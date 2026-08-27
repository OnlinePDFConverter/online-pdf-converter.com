import PDFHelper from '@libs/PDFHelper';

const fileMimes = {
    jpg: 'image/jpeg',
    webp: 'image/webp',
    png: 'image/png',
    bmp: 'image/bmp'
};

self.addEventListener('message', async e => {
    const { type, files, settings } = e.data;
    if (type != 'process') return;

    try {
        const filesBlob = [];
        const fileExtra = [];
        for (const item of files) {
            const { fileId, file } = item;
            let pdfHelper = null;
            let pdfDoc = null;

            try {
                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 0
                });

                pdfHelper = new PDFHelper({
                    data: await file.arrayBuffer()
                });
                pdfDoc = await pdfHelper.getPDFDocument();
                const pages = Array.from({ length: pdfDoc.numPages }, (_, index) => index + 1);
                const groups = createPageGroups(pages, settings.layout);
                let pageIndex = 1;
                let processedPages = 0;
                for (const group of groups) {
                    const blob = await renderGroup(pdfHelper, pdfDoc, group, settings);
                    filesBlob.push(new File([blob], `${pageIndex}.${settings.outputFormat}`));
                    fileExtra.push({
                        sourceName: file.name,
                        pages: group
                    });

                    processedPages += group.length;
                    self.postMessage({
                        type: 'file-progress',
                        fileId,
                        progress: Math.round(processedPages / pdfDoc.numPages * 100)
                    });
                    pageIndex++;
                }

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
                if (pdfHelper) {
                    await pdfHelper.destroy();
                }
            }
        }

        self.postMessage({
            type: 'complete',
            blob: filesBlob,
            extra: fileExtra,
            outputFormat: settings.outputFormat
        });
    } catch (e) {
        self.postMessage({ 
            type: 'error', 
            error: e.message ? e.message : String(e) 
        });
    }
});

function createPageGroups(pages, layout) {
    const pagesPerImage = layout.columns * layout.rows;
    const groups = [];

    for (let index = 0; index < pages.length; index += pagesPerImage) {
        groups.push(pages.slice(index, index + pagesPerImage));
    }
    return groups;
}

async function renderGroup(pdfHelper, pdfDoc, group, settings) {
    const cellSize = await getCellSize(pdfHelper, pdfDoc, group, settings.scale);
    const canvas = new OffscreenCanvas(
        cellSize.width * settings.layout.columns,
        cellSize.height * settings.layout.rows
    );
    const context = canvas.getContext('2d', { alpha: false });
    fillWhiteBackground({
        canvas,
        context
    });

    try {
        for (let index = 0; index < group.length; index++) {
            const pageData = await pdfHelper.getPageForWorker(group[index], fillWhiteBackground, settings.scale);

            try {
                const column = index % settings.layout.columns;
                const row = Math.floor(index / settings.layout.columns);
                const x = column * cellSize.width + (cellSize.width - pageData.pixelWidth) / 2;
                const y = row * cellSize.height + (cellSize.height - pageData.pixelHeight) / 2;
                context.drawImage(pageData.canvas, x, y);
            } finally {
                pdfHelper.releasePage(pageData);
            }
        }

        return await canvas.convertToBlob(getBlobOptions(settings));
    } finally {
        canvas.width = 1;
        canvas.height = 1;
    }
}

async function getCellSize(pdfHelper, pdfDoc, group, scale) {
    let width = 1;
    let height = 1;

    for (const pageNumber of group) {
        let page = null;
        try {
            page = await pdfDoc.getPage(pageNumber);
            const viewport = page.getViewport({ scale });
            width = Math.max(width, Math.floor(viewport.width));
            height = Math.max(height, Math.floor(viewport.height));
        } finally {
            pdfHelper.cleanupPage(page);
        }
    }

    return { width, height };
}

function fillWhiteBackground({ canvas, context }) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function getBlobOptions(options) {
    const type = fileMimes[options.outputFormat];
    const result = {
        type
    };
    if (options.outputFormat != 'png') {
        result.quality = options.quality;
    }
    return result;
}
