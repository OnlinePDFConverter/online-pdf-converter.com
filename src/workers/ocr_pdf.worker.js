import PDFHelper from '@libs/PDFHelper';
import { createWorker } from 'tesseract.js';
import { PDFDocument, degrees, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import latinFontUrl from '@assets/fonts/Carlito-Regular.ttf';
import cjkFontUrl from '@assets/fonts/NotoSansSC-Regular.ttf';
import arabicFontUrl from '@assets/fonts/NotoNaskhArabic-Regular.ttf';

const FONT_URLS = {
    latin: latinFontUrl,
    cjk: cjkFontUrl,
    arabic: arabicFontUrl
};

const CJK_PATTERN = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/u;
const ARABIC_PATTERN = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u;

self.addEventListener('message', async e => {
    const { type, files, settings } = e.data;
    if (type !== 'process') return;

    let worker = null;
    let pdfJsDocument = null;
    try {
        const filesBlob = [];
        const fileExtra = [];

        for (const item of files) {
            const { fileId, file } = item;
            try {
                let currentPage = 0;
                let totalPages = 1;
                let lastProgress = 0;
                let recognizing = false;
                const postProgress = progress => {
                    lastProgress = Math.max(lastProgress, Math.min(100, Math.round(progress)));
                    self.postMessage({ type: 'file-progress', fileId, progress: lastProgress });
                };

                const sourceBytes = await file.arrayBuffer();
                const pdfHelper = new PDFHelper({ data: sourceBytes.slice(0) });
                pdfJsDocument = await pdfHelper.getPDFDocument();
                totalPages = pdfJsDocument.numPages;
                postProgress(0);

                worker = await createWorker(settings.languages.join('+'), 1, {
                    logger: info => {
                        if (info && typeof info.progress === 'number') {
                            postProgress(recognizing
                                ? 5 + (currentPage + info.progress) / totalPages * 90
                                : info.progress * 5);
                        }
                    }
                });
                await worker.setParameters({ tessedit_pageseg_mode: '3' });

                const createSearchablePdf = settings.outputFormat === 'searchable-pdf';
                const outputPdf = createSearchablePdf
                    ? await PDFDocument.load(sourceBytes)
                    : null;
                const fonts = outputPdf ? await loadFonts(outputPdf, settings.languages) : null;
                const fullText = [];
                const warnings = [];
                recognizing = true;

                for (let i = 0; i < totalPages; i++) {
                    currentPage = i;
                    let pageData = null;
                    try {
                        pageData = await pdfHelper.getPageForWorker(i + 1, null, settings.scale);
                        const viewport = pageData.page.getViewport({ scale: settings.scale });
                        const result = await worker.recognize(pageData.canvas, {}, {
                            text: true,
                            blocks: true
                        });

                        fullText.push(result.data.text || '');
                        if (outputPdf && result.data.blocks) {
                            const drawStats = drawTextLayer(
                                outputPdf.getPage(i),
                                viewport,
                                result.data.blocks,
                                fonts
                            );
                            if (drawStats.droppedWords || drawStats.droppedSpaces) {
                                warnings.push({ page: i + 1, kind: 'draw-error', ...drawStats });
                            }
                        }
                    } catch (error) {
                        fullText.push('');
                        warnings.push({
                            page: i + 1,
                            kind: 'page-error',
                            message: error?.message || String(error)
                        });
                    } finally {
                        if (pageData) {
                            pageData.page.cleanup();
                            pageData.canvas.width = 0;
                            pageData.canvas.height = 0;
                        }
                    }

                    postProgress(5 + (i + 1) / totalPages * 90);
                }

                const blob = createSearchablePdf
                    ? new Blob([await outputPdf.save()], { type: 'application/pdf' })
                    : new Blob(['\uFEFF', fullText.join('\n\n')], { type: 'text/plain;charset=utf-8' });

                filesBlob.push(blob);
                fileExtra.push({ warnings, pages: totalPages });

                await cleanupPdfDocument(pdfJsDocument);
                pdfJsDocument = null;
                await terminateOcrWorker(worker);
                worker = null;

                postProgress(100);
                self.postMessage({ type: 'file-complete', fileId });
            } catch (error) {
                self.postMessage({
                    type: 'file-error',
                    fileId,
                    error: error?.message || String(error)
                });
                return;
            }
        }

        self.postMessage({
            type: 'complete',
            blob: filesBlob,
            extra: fileExtra,
            outputFormat: settings.outputFormat === 'searchable-pdf' ? 'pdf' : 'txt'
        });
    } catch (error) {
        self.postMessage({
            type: 'error',
            error: error?.message || String(error)
        });
    } finally {
        await cleanupPdfDocument(pdfJsDocument);
        await terminateOcrWorker(worker);
    }
});

function getFontType(text) {
    if (ARABIC_PATTERN.test(text)) return 'arabic';
    if (CJK_PATTERN.test(text)) return 'cjk';
    return 'latin';
}

async function loadFonts(pdfDoc, languages) {
    pdfDoc.registerFontkit(fontkit);
    const requiredTypes = new Set(['latin']);
    if (languages.some(language => ['chi_sim', 'chi_tra', 'jpn', 'kor'].includes(language))) {
        requiredTypes.add('cjk');
    }
    if (languages.includes('ara')) {
        requiredTypes.add('arabic');
    }

    const entries = await Promise.all([...requiredTypes].map(async type => {
        const url = FONT_URLS[type];
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load OCR font: ${type}`);
        }
        const bytes = await response.arrayBuffer();
        const font = await pdfDoc.embedFont(bytes, { subset: true });
        return [type, font];
    }));
    return Object.fromEntries(entries);
}

function cleanText(text) {
    return String(text || '').normalize('NFKC').replace(/[\p{Cc}\p{Cf}]/gu, '');
}

function getDistance(a, b) {
    return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

function getAngle(a, b) {
    return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
}

function fitFontSize(font, text, targetWidth, targetHeight) {
    let size = Math.max(targetHeight, 1);
    for (let i = 0; i < 10; i++) {
        const currentWidth = font.widthOfTextAtSize(text, size);
        if (!(currentWidth > 0)) break;
        const nextSize = size * targetWidth / currentWidth;
        if (Math.abs(nextSize - size) / size < 0.01) {
            size = nextSize;
            break;
        }
        size = nextSize;
    }
    return Math.max(1, Math.min(size, Math.max(targetHeight * 2, 1)));
}

function getLines(blocks) {
    const paragraphs = (blocks || []).flatMap(block => block.paragraphs || []);
    return paragraphs.flatMap(paragraph => (paragraph.lines || []).map(line => ({
        line,
        words: paragraph.is_ltr === false ? [...(line.words || [])].reverse() : (line.words || []),
        isLeftToRight: paragraph.is_ltr !== false
    })));
}

function drawTextLayer(pdfPage, viewport, blocks, fonts) {
    let droppedWords = 0;
    let droppedSpaces = 0;

    getLines(blocks).forEach(({ line, words, isLeftToRight }) => {
        const baseline = line.baseline;
        const baselineStart = baseline
            ? viewport.convertToPdfPoint(baseline.x0, baseline.y0)
            : null;
        const baselineEnd = baseline
            ? viewport.convertToPdfPoint(baseline.x1, baseline.y1)
            : null;

        words.forEach((word, index) => {
            const text = cleanText(word.text);
            const bbox = word.bbox;
            if (!text.trim() || !bbox) return;

            const bottomLeft = viewport.convertToPdfPoint(bbox.x0, bbox.y1);
            const bottomRight = viewport.convertToPdfPoint(bbox.x1, bbox.y1);
            const topLeft = viewport.convertToPdfPoint(bbox.x0, bbox.y0);
            const wordWidth = getDistance(bottomLeft, bottomRight);
            const wordHeight = getDistance(bottomLeft, topLeft);
            const font = fonts[getFontType(text)] || fonts.cjk || fonts.latin;

            try {
                const fontSize = fitFontSize(font, text, wordWidth, wordHeight);
                pdfPage.drawText(text, {
                    x: bottomLeft[0],
                    y: bottomLeft[1],
                    font,
                    size: fontSize,
                    color: rgb(0, 0, 0),
                    opacity: 0,
                    rotate: degrees(baselineStart && baselineEnd
                        ? getAngle(baselineStart, baselineEnd)
                        : getAngle(bottomLeft, bottomRight))
                });
            } catch (error) {
                droppedWords++;
            }

            if (index >= words.length - 1) return;
            const nextWord = words[index + 1];
            const nextText = cleanText(nextWord?.text);
            const nextBbox = nextWord?.bbox;
            if (!nextBbox || !line.bbox) return;
            if (CJK_PATTERN.test(text) && CJK_PATTERN.test(nextText)) return;
            if (isLeftToRight && nextBbox.x0 <= bbox.x1) return;
            if (!isLeftToRight && nextBbox.x1 >= bbox.x0) return;

            const gapStart = isLeftToRight
                ? viewport.convertToPdfPoint(bbox.x1, bbox.y1)
                : viewport.convertToPdfPoint(bbox.x0, bbox.y1);
            const gapEnd = isLeftToRight
                ? viewport.convertToPdfPoint(nextBbox.x0, nextBbox.y1)
                : viewport.convertToPdfPoint(nextBbox.x1, nextBbox.y1);
            const gapWidth = getDistance(gapStart, gapEnd);
            if (!(gapWidth > 0)) return;

            try {
                const lineBottom = viewport.convertToPdfPoint(line.bbox.x0, line.bbox.y1);
                const lineTop = viewport.convertToPdfPoint(line.bbox.x0, line.bbox.y0);
                const fontSize = Math.max(getDistance(lineBottom, lineTop), 1);
                pdfPage.drawText(' ', {
                    x: gapStart[0],
                    y: gapStart[1],
                    font,
                    size: fontSize,
                    color: rgb(0, 0, 0),
                    opacity: 0,
                    rotate: degrees(baselineStart && baselineEnd
                        ? getAngle(baselineStart, baselineEnd)
                        : getAngle(gapStart, gapEnd))
                });
            } catch (error) {
                droppedSpaces++;
            }
        });
    });

    return { droppedWords, droppedSpaces };
}

async function cleanupPdfDocument(pdfDocument) {
    if (!pdfDocument) return;

    try {
        if (typeof pdfDocument.cleanup === 'function') {
            await pdfDocument.cleanup();
        } else if (typeof pdfDocument.destroy === 'function') {
            await pdfDocument.destroy();
        }
    } catch (error) {
        // Resource cleanup must not turn a successfully generated result into an error.
    }
}

async function terminateOcrWorker(ocrWorker) {
    if (!ocrWorker || typeof ocrWorker.terminate !== 'function') return;

    try {
        await ocrWorker.terminate();
    } catch (error) {
        // The OCR result is already complete; termination errors are non-fatal.
    }
}