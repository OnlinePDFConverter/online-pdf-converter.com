import fontkit from '@pdf-lib/fontkit';
import notoSansUrl from '@assets/fonts/NotoSansSC-Regular.ttf';
import { dataURLToBytes } from '@src/libraries/misc';
import { createCloudPoints } from '@components/PdfViewer/editor/geometry';
import { PDFDocument, LineCapStyle, degrees, rgb } from 'pdf-lib';

self.addEventListener('message', async event => {
    const { type, files, settings = {} } = event.data;
    if (type !== 'process') return;
    try {
        const source = files && files[0] && files[0].file;
        if (!source) throw new Error('No PDF file.');
        const items = Array.isArray(settings.items) ? settings.items.filter(item => item && item.visible) : [];
        self.postMessage({ 
            type: 'progress', 
            progress: 0 
        });
        const pdfDoc = await PDFDocument.load(await source.arrayBuffer());
        pdfDoc.registerFontkit(fontkit);
        const fontResponse = await fetch(notoSansUrl);
        if (!fontResponse.ok) throw new Error('Could not load the editor font.');
        const font = await pdfDoc.embedFont(await fontResponse.arrayBuffer(), { subset: false });
        const pages = pdfDoc.getPages();
        const imageCache = new Map();

        for (let index = 0; index < items.length; index += 1) {
            const item = items[index];
            const page = pages[Number(item.pageNumber) - 1];
            if (page) await drawItem(pdfDoc, page, font, item, imageCache);
            self.postMessage({ 
                type: 'progress',
                 progress: Math.round((index + 1) / Math.max(1, items.length) * 90) 
            });
        }

        const bytes = await pdfDoc.save();
        self.postMessage({ 
            type: 'progress', 
            progress: 100 
        });
        self.postMessage({ 
            type: 'complete', 
            blob: [new Blob([bytes], { type: 'application/pdf' })], 
            extra: [{ 
                pages: pages.length, 
                items: items.length 
            }] 
        });
    } catch (error) {
        self.postMessage({ 
            type: 'error', 
            error: error.message ? error.message : String(error) 
        });
    }
});

function color(value, fallback = '#000000') {
    const hex = /^#[0-9a-f]{6}$/i.test(value || '') ? value : fallback;
    return rgb(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255);
}

function opacity(item) { 
    return Math.max(.01, Math.min(1, Number(item.style?.opacity ?? 1))); 
}

function thickness(item) { 
    return Math.max(.25, Number(item.style?.strokeWidth || 2)); 
}

function dash(item) {
    if (item.style?.dash === 'dashed') return [10, 7];
    if (item.style?.dash === 'dotted') return [2, 5];
    return undefined;
}

function rotatePoint(point, center, angle) {
    const radians = Number(angle || 0) * Math.PI / 180;
    const cos = Math.cos(radians), sin = Math.sin(radians);
    const x = point.x - center.x, y = point.y - center.y;
    return { x: center.x + x * cos - y * sin, y: center.y + x * sin + y * cos };
}

function normalizedPoints(item) {
    const rect = item.rect;
    const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    return (item.data?.points || []).map(point => rotatePoint({
        x: rect.x + Number(point.x) * rect.width,
        y: rect.y + (1 - Number(point.y)) * rect.height
    }, center, item.angle));
}

function rotatedOrigin(rect, angle) {
    const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    const half = rotatePoint({ x: rect.x, y: rect.y }, center, angle);
    return { x: half.x, y: half.y };
}

async function drawItem(pdfDoc, page, font, item, imageCache) {
    if (!item.rect) return;
    if (item.type === 'text' || item.type === 'note') return drawTextItem(page, font, item);
    if (item.type === 'image') return drawImageItem(pdfDoc, page, item, imageCache);
    if (['highlight', 'underline', 'strikeout', 'squiggly'].includes(item.type)) return drawMarkup(page, item);
    if (item.type === 'rectangle' || item.type === 'cloud') return drawRectangleItem(page, item);
    if (item.type === 'ellipse') return drawEllipseItem(page, item);
    if (['line', 'arrow'].includes(item.type)) return drawLineItem(page, item);
    if (['polygon', 'polyline', 'pencil', 'highlighter'].includes(item.type)) return drawPathItem(page, item);
}

function drawTextItem(page, font, item) {
    const rect = item.rect;
    const style = item.style || {};
    const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    if (item.type === 'note') {
        const origin = rotatedOrigin(rect, item.angle);
        page.drawRectangle({ x: origin.x, y: origin.y, width: rect.width, height: rect.height, rotate: degrees(item.angle || 0), color: color(style.fillColor, '#fff176'), opacity: opacity(item), borderColor: color(style.color), borderWidth: 1 });
    }
    const size = Math.max(8, Math.min(96, Number(style.fontSize || 20)));
    const lines = wrapText(String(item.data?.text || ''), font, size, Math.max(1, rect.width - 12));
    const lineHeight = size * 1.2;
    lines.slice(0, Math.max(1, Math.floor((rect.height - 10) / lineHeight))).forEach((line, index) => {
        let x = rect.x + 6;
        const width = font.widthOfTextAtSize(line, size);
        if (style.alignment === 'center') x = rect.x + (rect.width - width) / 2;
        if (style.alignment === 'right') x = rect.x + rect.width - width - 6;
        const origin = rotatePoint({ x, y: rect.y + rect.height - size - 5 - index * lineHeight }, center, item.angle);
        page.drawText(line, { x: origin.x, y: origin.y, size, font, color: color(style.color), opacity: opacity(item), rotate: degrees(item.angle || 0) });
    });
}

function wrapText(text, font, size, width) {
    const result = [];
    String(text).split(/\r?\n/).forEach(paragraph => {
        let line = '';
        Array.from(paragraph || ' ').forEach(character => {
            const next = line + character;
            if (line && font.widthOfTextAtSize(next, size) > width) { result.push(line); line = character; }
            else line = next;
        });
        result.push(line.trimEnd());
    });
    return result;
}

async function drawImageItem(pdfDoc, page, item, cache) {
    const url = item.data?.url;
    if (!url) return;
    let image = cache.get(url);
    if (!image) {
        const bytes = dataURLToBytes(url);
        image = /^data:image\/jpe?g/i.test(url) ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes);
        cache.set(url, image);
    }
    const rect = item.rect;
    const scale = Math.min(rect.width / image.width, rect.height / image.height);
    const width = image.width * scale, height = image.height * scale;
    const centered = { x: rect.x + (rect.width - width) / 2, y: rect.y + (rect.height - height) / 2, width, height };
    const origin = rotatedOrigin(centered, item.angle);
    page.drawImage(image, { x: origin.x, y: origin.y, width, height, rotate: degrees(item.angle || 0), opacity: opacity(item) });
}

function markupRects(item) {
    const rect = item.rect;
    return (item.data?.rects || [{ x: 0, y: 0, width: 1, height: 1 }]).map(value => ({
        x: rect.x + value.x * rect.width,
        y: rect.y + (1 - value.y - value.height) * rect.height,
        width: value.width * rect.width,
        height: value.height * rect.height
    }));
}

function drawMarkup(page, item) {
    markupRects(item).forEach(rect => {
        if (item.type === 'highlight') page.drawRectangle({ ...rect, color: color(item.style?.fillColor || item.style?.color, '#fff176'), opacity: opacity(item) });
        else if (item.type === 'squiggly') {
            const step = Math.max(3, rect.height * .18);
            let previous = { x: rect.x, y: rect.y + 1 };
            for (let x = rect.x + step; x <= rect.x + rect.width + step; x += step) {
                const next = { x: Math.min(x, rect.x + rect.width), y: rect.y + (Math.round((x - rect.x) / step) % 2 ? step * .55 : 1) };
                page.drawLine({ start: previous, end: next, thickness: thickness(item), color: color(item.style?.color), opacity: opacity(item) });
                previous = next;
            }
        } else {
            const y = item.type === 'underline' ? rect.y + 1 : rect.y + rect.height * .5;
            page.drawLine({ start: { x: rect.x, y }, end: { x: rect.x + rect.width, y }, thickness: thickness(item), color: color(item.style?.color), opacity: opacity(item) });
        }
    });
}

function shapeOptions(item) {
    const style = item.style || {};
    return {
        borderColor: color(style.color, '#ef3e3e'), borderWidth: thickness(item), borderOpacity: opacity(item), borderDashArray: dash(item),
        color: style.fillColor && style.fillColor !== 'transparent' ? color(style.fillColor) : undefined,
        opacity: opacity(item)
    };
}

function drawRectangleItem(page, item) {
    const rect = item.rect;
    if (item.type === 'cloud') return drawCloud(page, item);
    const origin = rotatedOrigin(rect, item.angle);
    page.drawRectangle({ x: origin.x, y: origin.y, width: rect.width, height: rect.height, rotate: degrees(item.angle || 0), ...shapeOptions(item) });
}

function drawEllipseItem(page, item) {
    const rect = item.rect;
    page.drawEllipse({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, xScale: rect.width / 2, yScale: rect.height / 2, rotate: degrees(item.angle || 0), ...shapeOptions(item) });
}

function lineEnds(item) {
    const points = normalizedPoints(item);
    if (points.length >= 2) return [points[0], points[1]];
    const rect = item.rect;
    const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    return [rotatePoint({ x: rect.x, y: rect.y }, center, item.angle), rotatePoint({ x: rect.x + rect.width, y: rect.y + rect.height }, center, item.angle)];
}

function drawLineItem(page, item) {
    const [start, end] = lineEnds(item);
    page.drawLine({ start, end, thickness: thickness(item), color: color(item.style?.color), opacity: opacity(item), dashArray: dash(item), lineCap: LineCapStyle.Round });
    drawTerminator(page, start, end, item.style?.lineStart, item);
    drawTerminator(page, end, start, item.type === 'arrow' && item.style?.lineEnd == null ? 'arrow' : item.style?.lineEnd, item);
}

function drawTerminator(page, point, other, type, item) {
    if (!type || type === 'none') return;
    const angle = Math.atan2(point.y - other.y, point.x - other.x);
    const stroke = color(item.style?.color, '#ef3e3e');
    if (type === 'circle') return page.drawCircle({ x: point.x, y: point.y, size: 4, color: stroke, opacity: opacity(item) });
    if (type === 'square') return page.drawSquare({ x: point.x - 3, y: point.y - 3, size: 6, color: stroke, opacity: opacity(item) });
    const length = 11;
    [-.55, .55].forEach(offset => page.drawLine({ start: point, end: { x: point.x - Math.cos(angle + offset) * length, y: point.y - Math.sin(angle + offset) * length }, thickness: Math.max(1, thickness(item)), color: stroke, opacity: opacity(item) }));
}

function drawPathItem(page, item) {
    const points = normalizedPoints(item);
    if (points.length < 2) return;
    const isClosed = item.type === 'polygon';
    const lineOpacity = item.type === 'highlighter' ? .3 : opacity(item);
    if (isClosed && item.style?.fillColor && item.style.fillColor !== 'transparent') {
        const path = `${points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${-point.y}`).join(' ')} Z`;
        page.drawSvgPath(path, { color: color(item.style.fillColor), opacity: opacity(item) });
    }
    for (let index = 1; index < points.length; index += 1) {
        page.drawLine({ start: points[index - 1], end: points[index], thickness: thickness(item), color: color(item.style?.color), opacity: lineOpacity, dashArray: dash(item), lineCap: LineCapStyle.Round });
    }
    if (isClosed) page.drawLine({ start: points[points.length - 1], end: points[0], thickness: thickness(item), color: color(item.style?.color), opacity: lineOpacity, dashArray: dash(item), lineCap: LineCapStyle.Round });
    if (item.type === 'polyline') {
        drawTerminator(page, points[0], points[1], item.style?.lineStart, item);
        drawTerminator(page, points[points.length - 1], points[points.length - 2], item.style?.lineEnd, item);
    }
}

function drawCloud(page, item) {
    const rect = item.rect;
    const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    const points = createCloudPoints(rect.width, rect.height, rect.x, rect.y).map(point => rotatePoint(point, center, item.angle));
    if (item.style?.fillColor && item.style.fillColor !== 'transparent') {
        const path = `${points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${-point.y}`).join(' ')} Z`;
        page.drawSvgPath(path, { color: color(item.style.fillColor), opacity: opacity(item) });
    }
    for (let index = 1; index < points.length; index += 1) page.drawLine({ start: points[index - 1], end: points[index], thickness: thickness(item), color: color(item.style?.color), opacity: opacity(item), dashArray: dash(item), lineCap: LineCapStyle.Round });
}
