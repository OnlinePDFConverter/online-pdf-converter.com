import { dataURLToBytes } from '@src/libraries/misc';
import { PDFDocument, degrees } from 'pdf-lib';

self.addEventListener('message', async e => {
    const { type, files, settings = {} } = e.data;
    if (type !== 'process') return;

    try {
        self.postMessage({
            type: 'progress',
            progress: 0
        });
        const signatures = Array.isArray(settings.signatures) ? settings.signatures : [];
        if (!signatures.length) {
            throw new Error('No signature.');
        }

        const filesBlob = [];
        const fileExtra = [];
        const { file } = files[0];
        const pdf = await PDFDocument.load(await file.arrayBuffer());
        const pages = pdf.getPages();
        const embeddedImages = new Map();
        for (let index = 0; index < signatures.length; index += 1) {
            const signature = signatures[index];
            const placement = signature.placement;
            const pageIndex = Number(placement.pageNumber) - 1;
            let image = embeddedImages.get(signature.url);
            if (!image) {
                const bytes = dataURLToBytes(signature.url);
                image = /^data:image\/jpe?g[;,]/i.test(signature.url)
                    ? await pdf.embedJpg(bytes)
                    : await pdf.embedPng(bytes);
                embeddedImages.set(signature.url, image);
            }

            const page = pages[pageIndex];
            const { height: pageHeight } = page.getSize();
            const width = Math.max(1, Number(placement.width));
            const height = Math.max(1, Number(placement.height));
            const centerX = Number(placement.centerX);
            const centerY = pageHeight - Number(placement.centerY);
            const angle = -Number(placement.angle || 0);
            const radians = angle * Math.PI / 180;
            const rotatedCenterX = width / 2 * Math.cos(radians) - height / 2 * Math.sin(radians);
            const rotatedCenterY = width / 2 * Math.sin(radians) + height / 2 * Math.cos(radians);

            page.drawImage(image, {
                x: centerX - rotatedCenterX,
                y: centerY - rotatedCenterY,
                width,
                height,
                rotate: degrees(angle),
                opacity: Math.max(0.1, Math.min(1, Number(placement.opacity)))
            });
            self.postMessage({
                type: 'progress',
                progress: Math.round((index + 1) / signatures.length * 90)
            });
        }

        const signedBytes = await pdf.save();
        filesBlob.push(new Blob([signedBytes], { type: 'application/pdf' }));
        fileExtra.push({
            pages: pages.length,
            signatures: signatures.length
        });
        self.postMessage({
            type: 'progress',
            progress: 100
        });

        self.postMessage({
            type: 'complete',
            blob: filesBlob,
            extra: fileExtra
        });
    } catch (error) {
        self.postMessage({
            type: 'error',
            error: error.message ? error.message : String(error)
        });
    }
});
