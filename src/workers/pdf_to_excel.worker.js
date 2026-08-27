import { loadPyMuPDF } from "@src/libraries/external";

self.addEventListener('message', async e => {
    const { type, files, settings } = e.data;
    if (type != 'process') return;

    try {
        const pymupdf = await loadPyMuPDF();
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

                const pdfDoc = await pymupdf.open(file);
                const pageCount = pdfDoc.pageCount;
                const allTables = [];

                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 30
                });

                try {
                    for (let i = 0; i < pageCount; i++) {
                        const page = pdfDoc.getPage(i);
                        const tables = page.findTables();
                        tables.forEach(table => {
                            allTables.push({
                                page: i + 1,
                                rows: table.rows
                            });
                        });
                    }
                } finally {
                    pdfDoc.close();
                }

                if (allTables.length === 0) {
                    throw new Error('No tables were found in the PDF.');
                }

                const XLSX = await import('xlsx');
                const workbook = XLSX.utils.book_new();

                if (allTables.length === 1) {
                    const worksheet = XLSX.utils.aoa_to_sheet(allTables[0].rows);
                    XLSX.utils.book_append_sheet(workbook, worksheet, 'Table');
                } else {
                    allTables.forEach((table, index) => {
                        const sheetName = `Table ${index + 1} (Page ${table.page})`.substring(0, 31);
                        const worksheet = XLSX.utils.aoa_to_sheet(table.rows);
                        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
                    });
                }

                const xlsxBytes = XLSX.write(workbook, {
                    bookType: 'xlsx',
                    type: 'array'
                });
                const blob = new Blob([xlsxBytes], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });

                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 50
                });

                filesBlob.push(blob);
                fileExtra.push({
                    pageCount
                });
                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 80
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
