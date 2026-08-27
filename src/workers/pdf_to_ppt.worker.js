import PDFHelper from '@libs/PDFHelper';
import PptxGenJS from 'pptxgenjs';

const SLIDE_WIDTH = 10;



self.addEventListener('message', async e => {
    const { type, files } = e.data;
    if (type != 'process') return;

    try {
        const filesBlob = [];
        const fileExtra = [];

        for (const item of files) {
            const { fileId, file } = item;
            let pdfDoc = null;
            let firstPageData = null;

            try {
                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 0
                });

                const pdfHelper = new PDFHelper({
                    data: await file.arrayBuffer()
                });
                pdfDoc = await pdfHelper.getPDFDocument();

                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 10
                });

                firstPageData = await pdfHelper.getPageForWorker(1);
                const slideHeight = SLIDE_WIDTH * firstPageData.height / firstPageData.width;
                const presentation = new PptxGenJS();
                presentation.author = '';
                presentation.company = '';
                presentation.subject = '';
                presentation.title = '';
                presentation.defineLayout({
                    name: 'pdf to ppt',
                    width: SLIDE_WIDTH,
                    height: slideHeight
                });

                for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber++) {
                    const pageData = pageNumber === 1
                        ? firstPageData
                        : await pdfHelper.getPageForWorker(pageNumber);

                    try {
                        const imageBlob = await pageData.canvas.convertToBlob({ type: 'image/png' });
                        const imageData = new FileReaderSync().readAsDataURL(imageBlob);
                        const placement = getImagePlacement(
                            SLIDE_WIDTH,
                            slideHeight,
                            pageData.width,
                            pageData.height
                        );
                        const slide = presentation.addSlide();
                        slide.background = { color: 'FFFFFF' };
                        slide.addImage({
                            data: imageData,
                            ...placement
                        });
                    } finally {
                        destroyPage(pageData);
                        if (pageNumber === 1) {
                            firstPageData = null;
                        }
                    }

                    self.postMessage({
                        type: 'file-progress',
                        fileId,
                        progress: 10 + Math.round(pageNumber / pdfDoc.numPages * 90)
                    });
                }

                const output = await presentation.write({
                    outputType: 'arraybuffer',
                    compression: true
                });
                const blob = new Blob([output], { 
                    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
                });

                filesBlob.push(blob);
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
            } finally {
                destroyPage(firstPageData);
                if (pdfDoc && typeof pdfDoc.destroy === 'function') {
                    await pdfDoc.destroy();
                }
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


function getImagePlacement(slideWidth, slideHeight, pageWidth, pageHeight) {
    const pageRatio = pageWidth / pageHeight;
    const slideRatio = slideWidth / slideHeight;

    if (pageRatio > slideRatio) {
        const height = slideWidth / pageRatio;
        return {
            x: 0,
            y: (slideHeight - height) / 2,
            w: slideWidth,
            h: height
        };
    }

    const width = slideHeight * pageRatio;
    return {
        x: (slideWidth - width) / 2,
        y: 0,
        w: width,
        h: slideHeight
    };
}

function destroyPage(pageData) {
    if (!pageData) return;

    if (pageData.page && typeof pageData.page.cleanup === 'function') {
        pageData.page.cleanup();
    }
    if (pageData.canvas) {
        pageData.canvas.width = 1;
        pageData.canvas.height = 1;
    }
}
