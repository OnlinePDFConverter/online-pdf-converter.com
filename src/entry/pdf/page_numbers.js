import '../common';
import '@css/upload.css';
import '@css/pdf/page_numbers.css';
import { fileUpload, elements, setPreviewTemplate } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';
import { EVENTS } from '@src/common/hook';

const PAGE_SELECTOR = '.file-item[data-page-number]';

let previewTemplate = `
<div class="file-item">
    <span class="file-check"></span>
    <div class="file-icon pos-relative">
        <img data-dz-thumbnail data-page-preview />
        <span class="page-numbers-marker d-hide" data-page-numbers-marker></span>
    </div>
    <div class="file-meta">
        <strong data-dz-name></strong>
        <span class="upload-status" data-dz-errormessage></span>
    </div>
    <div class="file-pages-size">
        <span class="file-pages"></span>
        <span class="file-size"></span>
    </div>
    <button class="file-remove" type="button" data-dz-remove>×</button>
    <div class="file-progress d-hide">
        <div class="file-progress-info">
            <span data-progress-text></span>
            <span data-progress-percent>0%</span>
        </div>
        <div class="file-progress-bar"><span data-progress-bar></span></div>
    </div>
</div>
`;
setPreviewTemplate(previewTemplate);

const controls = {
    position: $D.get('[data-page-numbers-position]'),
    format: $D.get('[data-page-numbers-format]'),
    startPage: $D.get('[data-page-numbers-start-page]'),
    startNumber: $D.get('[data-page-numbers-start-number]'),
    fontSize: $D.get('[data-page-numbers-font-size]'),
    margin: $D.get('[data-page-numbers-margin]'),
    color: $D.get('[data-page-numbers-color]')
};

let previewFrame = null;
let previewResizeObserver = null;

const outputFileName = '{name}_page_numbers.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/page_numbers.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    elements,
    outputFileName
});

fileUpload.setOption({
    acceptedFiles: '.pdf',
    singleMode: true,
    previewMode: 'pdf'
});

fileUpload.availableProcess = () => fileUpload.getAcceptedFiles().length > 0;

fileUpload.onProcess = () => {
    startProcess({
        settings: getSettings()
    });
};

fileUpload.on('removedfile', resetPreview);
fileUpload.init();

$HOOK.on(EVENTS.FILE.PREVIEWED, e => {
    const fileItem = e.data.file.extend;
    controls.startPage.max = String(fileItem.pageCount);
    bindPreviewImages(fileItem.pageElements);
    queuePreviewUpdate();
});

[
    controls.position,
    controls.format,
    controls.startPage,
    controls.startNumber,
    controls.fontSize,
    controls.margin,
    controls.color
].forEach(control => {
    control.addEventListener('input', queuePreviewUpdate);
    control.addEventListener('change', queuePreviewUpdate);
});

function getSettings() {
    return {
        position: controls.position.value,
        format: controls.format.value,
        startPage: Number(controls.startPage.value),
        startNumber: Number(controls.startNumber.value),
        fontSize: Number(controls.fontSize.value),
        margin: Number(controls.margin.value),
        color: controls.color.value
    };
}

function resetPreview() {
    if (previewFrame !== null) {
        cancelAnimationFrame(previewFrame);
        previewFrame = null;
    }
    if (previewResizeObserver) {
        previewResizeObserver.disconnect();
        previewResizeObserver = null;
    }
    controls.startPage.removeAttribute('max');
}

function bindPreviewImages(pageElements) {
    if (previewResizeObserver) {
        previewResizeObserver.disconnect();
    }
    previewResizeObserver = typeof ResizeObserver === 'function'
        ? new ResizeObserver(queuePreviewUpdate)
        : null;

    pageElements.forEach(pageElement => {
        const image = pageElement.querySelector('[data-page-preview]');
        if (!image) return;

        image.addEventListener('load', queuePreviewUpdate);
        previewResizeObserver?.observe(image);
    });

    if (!previewResizeObserver) {
        window.addEventListener('resize', queuePreviewUpdate, { passive: true, once: true });
    }
}

function queuePreviewUpdate() {
    if (previewFrame !== null) {
        cancelAnimationFrame(previewFrame);
    }
    previewFrame = requestAnimationFrame(updatePreview);
}

function updatePreview() {
    previewFrame = null;
    const settings = getSettings();
    const pages = Array.from(elements.elFileList.querySelectorAll(PAGE_SELECTOR));
    const totalNumberedPages = Math.max(0, pages.length - settings.startPage + 1);

    pages.forEach(pageElement => {
        const pageNumber = Number(pageElement.getAttribute('data-page-number'));
        const marker = pageElement.querySelector('[data-page-numbers-marker]');
        const image = pageElement.querySelector('[data-page-preview]');
        const shouldShow = Number.isInteger(pageNumber)
            && pageNumber >= settings.startPage
            && totalNumberedPages > 0
            && image?.complete
            && image.naturalWidth > 0;

        if (!shouldShow) {
            marker.classList.add('d-hide');
            return;
        }

        const displayedNumber = settings.startNumber + pageNumber - settings.startPage;
        marker.textContent = formatPageNumber(settings, displayedNumber, totalNumberedPages);
        marker.style.color = settings.color;
        marker.classList.remove('d-hide');
        positionPreviewMarker(marker, image, settings);
    });
}

function formatPageNumber(settings, pageNumber, totalNumberedPages) {
    return settings.format
        .replace(/\{page\}/g, String(pageNumber))
        .replace(/\{total\}/g, String(totalNumberedPages));
}

function positionPreviewMarker(marker, image, settings) {
    const wrapper = image.closest('.file-icon');
    const wrapperRect = wrapper.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    const deviceScale = window.devicePixelRatio || 1;
    const pageWidth = image.naturalWidth / deviceScale;
    const pointScale = pageWidth > 0 ? imageRect.width / pageWidth : 1;
    const margin = Math.max(0, settings.margin * pointScale);
    const fontSize = Math.max(6, Math.min(28, settings.fontSize * pointScale));
    const imageLeft = imageRect.left - wrapperRect.left;
    const imageTop = imageRect.top - wrapperRect.top;

    marker.style.fontSize = `${fontSize}px`;
    marker.style.left = '0';
    marker.style.top = '0';

    const markerWidth = marker.offsetWidth;
    const markerHeight = marker.offsetHeight;
    const minX = imageLeft;
    const maxX = imageLeft + imageRect.width - markerWidth;
    const minY = imageTop;
    const maxY = imageTop + imageRect.height - markerHeight;
    const isTop = settings.position.startsWith('top');
    const isLeft = settings.position.endsWith('left');
    const isRight = settings.position.endsWith('right');

    let x = imageLeft + (imageRect.width - markerWidth) / 2;
    if (isLeft) x = imageLeft + margin;
    if (isRight) x = imageLeft + imageRect.width - margin - markerWidth;

    const y = isTop
        ? imageTop + margin
        : imageTop + imageRect.height - margin - markerHeight;

    marker.style.left = `${Math.max(minX, Math.min(maxX, x))}px`;
    marker.style.top = `${Math.max(minY, Math.min(maxY, y))}px`;
}
