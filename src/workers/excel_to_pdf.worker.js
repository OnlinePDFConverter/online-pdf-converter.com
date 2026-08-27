import { getLibreOfficeConverter } from "@src/libraries/libreoffice";
import PDFHelper from '@libs/PDFHelper';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

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

                let inputFile = file;
                if (file.name.endsWith('.csv')) {
                    postProgress(5);
                    inputFile = await csvToXlsx(file);
                    postProgress(10);
                }

                const libreOffice = await getLibreOfficeConverter({
                    includeCJKFont: false,
                    callback: {
                        onBeforeInit: () => {
                            postProgress(10);
                        },
                        onAfterInit: () => {
                            postProgress(85);
                        },
                        onBeforeLoadCJK: () => {
                            postProgress(20);
                        },
                        onAfterLoadCJK: () => {
                            postProgress(40);
                        },
                        onWorkerBrowserProgress: (info) => {
                            const percent = Math.max(0, Math.min(100, Number(info.percent) || 0));
                            postProgress(40 + Math.round(percent * 0.45));
                        },
                        onConvert: (progress) => {
                            postProgress(progress);
                        }
                    }
                });
                await libreOffice.initialize();
                const blob = await libreOffice.convertToPdf(inputFile);
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

async function csvToXlsx(file) {
    const csvText = await file.text();
    if (!csvText.trim()) {
        throw new Error('The CSV document is empty.');
    }

    const XLSX = await import('xlsx');
    const workbook = XLSX.read(csvText, {
        type: 'string',
        raw: true
    });
    if (!workbook.SheetNames.length) {
        throw new Error('No worksheet data was found in the CSV document.');
    }

    const xlsxBytes = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
    });
    const xlsxName = file.name.replace(/\.csv$/i, '') + '.xlsx';
    return new File([xlsxBytes], xlsxName, {
        type: XLSX_MIME,
        lastModified: file.lastModified
    });
}