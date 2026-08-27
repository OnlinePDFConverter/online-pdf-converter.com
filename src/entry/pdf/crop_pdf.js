import '../common';
import '@css/upload.css';
import '@components/PdfViewer/theme/default.css';
import '@css/pdf/crop_pdf.css';
import { fileUpload, elements } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';
import PdfViewer from '@components/PdfViewer/PdfViewer';

const MIN_CROP_SIZE = 20;
const RATIO_VALUES = Object.freeze({
    '16:9': 16 / 9,
    '4:3': 4 / 3,
    '3:4': 3 / 4,
    '1:1': 1
});

let cropController;
let viewer;

function initCropTool() {
    const outputFileName = '{name}_cropped.pdf';
    const { startProcess } = initWorker({
        worker: new Worker(new URL('@src/workers/crop_pdf.worker.js', import.meta.url), { type: 'module' }),
        fileUpload,
        elements,
        outputFileName
    });

    viewer = new PdfViewer(elements.elPdfViewer, {
        renderTextLayer: false,
        respectPageRotation: true,
        sidebarCollapsed: true,
        toolbar: ['pagination', 'zoom', 'fullscreen'],
        onLoad: payload => cropController.onDocumentLoad(payload),
        onPageRendered: (pageNumber, item, viewport, page) => cropController.onPageRendered(pageNumber, item, page),
        onPageChange: pageNumber => cropController.onPageChange(pageNumber),
        onScaleChange: () => cropController.onScaleChange()
    });

    cropController = new CropController(viewer, document.querySelector('[data-crop-settings]'), () => {
        fileUpload.updateProcessButtonState();
    });

    fileUpload.setOption({
        acceptedFiles: '.pdf',
        singleMode: true,
        onAddedFile: file => {
            if (!file.accepted) return;
            cropController.reset();
            elements.elUploadWrapper.classList.add('d-hide');
            elements.elFileListWrapper.classList.add('d-hide');
            elements.elSettingsWrapper?.classList.remove('d-hide');
            document.querySelector('.viewer-wrapper')?.classList.remove('d-hide');
            viewer.load(file, { fileName: file.name });
        }
    });

    fileUpload.availableProcess = () => {
        return fileUpload.getAcceptedFiles().length > 0 && cropController.isReady();
    };

    fileUpload.onProcess = () => {
        const settings = cropController.getSettings();
        if (settings) startProcess({ settings });
    };

    fileUpload.init();
}

class CropController {
    constructor(pdfViewer, settingsRoot, onChange) {
        this.viewer = pdfViewer;
        this.settingsRoot = settingsRoot;
        this.onChange = onChange;
        this.pageStates = new Map();
        this.pageOverlays = new Map();
        this.currentPage = 1;
        this.totalPages = 0;
        this.documentGeneration = 0;
        this.renderFrame = 0;
        this.activeDrag = null;
        this.inputs = Object.fromEntries(
            [...settingsRoot.querySelectorAll('[data-crop-input]')]
                .map(input => [input.dataset.cropInput, input])
        );
        this.ratioInputs = [...settingsRoot.querySelectorAll('input[name="crop-ratio"]')];
        this.scopeInputs = [...settingsRoot.querySelectorAll('input[name="crop-scope"]')];
        this.bindSettings();
        this.setSettingsDisabled(true);
    }

    reset() {
        this.documentGeneration += 1;
        this.pageStates.clear();
        this.pageOverlays.forEach(record => record.overlay.remove());
        this.pageOverlays.clear();
        this.currentPage = 1;
        this.totalPages = 0;
        this.stopDrag();
        this.setSettingsDisabled(true);
        this.onChange();
    }

    async onDocumentLoad({ totalPages }) {
        this.totalPages = totalPages;
        this.currentPage = 1;
        await this.activatePage(1);
    }

    async onPageRendered(pageNumber, item, page) {
        const generation = this.documentGeneration;
        const state = await this.ensurePageState(pageNumber, page);
        if (!state || generation !== this.documentGeneration) return;
        const wrap = item?.canvas?.closest('.pv-canvas-wrap');
        if (!wrap) return;
        const record = this.ensureOverlay(pageNumber, wrap);
        record.overlay.classList.toggle('is-active', pageNumber === this.currentPage);
        this.renderOverlay(pageNumber);
    }

    async onPageChange(pageNumber) {
        this.currentPage = pageNumber;
        await this.activatePage(pageNumber);
    }

    onScaleChange() {
        cancelAnimationFrame(this.renderFrame);
        this.renderFrame = requestAnimationFrame(() => {
            this.pageOverlays.forEach((record, pageNumber) => {
                record.overlay.classList.toggle('is-active', pageNumber === this.currentPage);
                this.renderOverlay(pageNumber);
            });
        });
    }

    isReady() {
        return Boolean(this.totalPages && this.pageStates.get(this.currentPage));
    }

    getSettings() {
        const state = this.pageStates.get(this.currentPage);
        if (!state) return null;
        return {
            scope: this.settingsRoot.querySelector('input[name="crop-scope"]:checked')?.value || 'current',
            pageNumber: this.currentPage,
            rect: {
                x: clamp(state.rect.x / state.pageSize.width, 0, 1),
                y: clamp(state.rect.y / state.pageSize.height, 0, 1),
                width: clamp(state.rect.width / state.pageSize.width, 0, 1),
                height: clamp(state.rect.height / state.pageSize.height, 0, 1)
            }
        };
    }

    bindSettings() {
        Object.entries(this.inputs).forEach(([name, input]) => {
            input.addEventListener('change', () => this.applyInput(name, input.value));
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    input.blur();
                }
            });
        });

        this.ratioInputs.forEach(input => {
            input.addEventListener('change', () => {
                if (!input.checked) return;
                const state = this.pageStates.get(this.currentPage);
                if (!state) return;
                state.ratioKey = input.value;
                state.ratio = RATIO_VALUES[input.value] || null;
                if (state.ratio) {
                    state.rect = largestCenteredRect(state.pageSize, state.ratio);
                }
                this.commitCurrentState();
            });
        });

        this.scopeInputs.forEach(input => {
            input.addEventListener('change', () => this.onChange());
        });
    }

    async activatePage(pageNumber) {
        const generation = this.documentGeneration;
        const state = await this.ensurePageState(pageNumber);
        if (!state || generation !== this.documentGeneration || pageNumber !== this.currentPage) return;
        this.pageOverlays.forEach((record, number) => {
            record.overlay.classList.toggle('is-active', number === pageNumber);
        });
        this.setSettingsDisabled(false);
        this.syncSettings(state);
        this.renderOverlay(pageNumber);
        this.onChange();
    }

    async ensurePageState(pageNumber, suppliedPage = null) {
        if (this.pageStates.has(pageNumber)) return this.pageStates.get(pageNumber);
        if (!this.viewer.pdf) return null;
        const generation = this.documentGeneration;
        const page = suppliedPage || await this.viewer.pdf.getPage(pageNumber);
        if (generation !== this.documentGeneration || !this.viewer.pdf) return null;
        const viewport = page.getViewport({
            scale: 1,
            rotation: this.viewer.getPageRotation(page)
        });
        const pageSize = { width: viewport.width, height: viewport.height };
        const state = {
            pageSize,
            rect: {
                x: pageSize.width * 0.1,
                y: pageSize.height * 0.1,
                width: pageSize.width * 0.8,
                height: pageSize.height * 0.8
            },
            ratioKey: 'custom',
            ratio: null
        };
        this.pageStates.set(pageNumber, state);
        return state;
    }

    ensureOverlay(pageNumber, wrap) {
        let record = this.pageOverlays.get(pageNumber);
        if (!record) {
            const overlay = document.createElement('div');
            overlay.className = 'crop-overlay';
            overlay.dataset.cropPage = pageNumber;
            overlay.innerHTML = `
                <div class="crop-mask" data-crop-mask="top"></div>
                <div class="crop-mask" data-crop-mask="right"></div>
                <div class="crop-mask" data-crop-mask="bottom"></div>
                <div class="crop-mask" data-crop-mask="left"></div>
                <div class="crop-box" data-crop-box role="region" aria-label="Crop area">
                    ${['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']
                        .map(direction => `<span class="crop-handle crop-handle-${direction}" data-crop-handle="${direction}"></span>`)
                        .join('')}
                </div>
            `;
            const box = overlay.querySelector('[data-crop-box]');
            box.addEventListener('pointerdown', event => this.startPointerAction(event, pageNumber));
            record = {
                overlay,
                box,
                masks: Object.fromEntries(
                    [...overlay.querySelectorAll('[data-crop-mask]')]
                        .map(mask => [mask.dataset.cropMask, mask])
                )
            };
            this.pageOverlays.set(pageNumber, record);
        }
        if (record.overlay.parentNode !== wrap) wrap.appendChild(record.overlay);
        return record;
    }

    renderOverlay(pageNumber) {
        const state = this.pageStates.get(pageNumber);
        const record = this.pageOverlays.get(pageNumber);
        if (!state || !record || !record.overlay.classList.contains('is-active')) return;
        const width = record.overlay.clientWidth;
        const height = record.overlay.clientHeight;
        if (!width || !height) return;
        const scaleX = width / state.pageSize.width;
        const scaleY = height / state.pageSize.height;
        const x = state.rect.x * scaleX;
        const y = state.rect.y * scaleY;
        const cropWidth = state.rect.width * scaleX;
        const cropHeight = state.rect.height * scaleY;

        setRectStyle(record.box, x, y, cropWidth, cropHeight);
        setRectStyle(record.masks.top, 0, 0, width, y);
        setRectStyle(record.masks.right, x + cropWidth, y, Math.max(0, width - x - cropWidth), cropHeight);
        setRectStyle(record.masks.bottom, 0, y + cropHeight, width, Math.max(0, height - y - cropHeight));
        setRectStyle(record.masks.left, 0, y, x, cropHeight);
    }

    startPointerAction(event, pageNumber) {
        if (event.button !== undefined && event.button !== 0) return;
        const state = this.pageStates.get(pageNumber);
        const record = this.pageOverlays.get(pageNumber);
        if (!state || !record || pageNumber !== this.currentPage) return;
        event.preventDefault();
        const handle = event.target.closest('[data-crop-handle]');
        this.activeDrag = {
            pageNumber,
            mode: handle ? 'resize' : 'move',
            direction: handle?.dataset.cropHandle || '',
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startRect: { ...state.rect },
            overlayWidth: record.overlay.clientWidth,
            overlayHeight: record.overlay.clientHeight
        };
        this.handlePointerMove = moveEvent => this.onPointerMove(moveEvent);
        this.handlePointerUp = upEvent => {
            if (upEvent.pointerId === this.activeDrag?.pointerId) this.stopDrag();
        };
        window.addEventListener('pointermove', this.handlePointerMove, { passive: false });
        window.addEventListener('pointerup', this.handlePointerUp);
        window.addEventListener('pointercancel', this.handlePointerUp);
        document.body.classList.add('is-cropping-pdf');
    }

    onPointerMove(event) {
        const drag = this.activeDrag;
        if (!drag || event.pointerId !== drag.pointerId) return;
        event.preventDefault();
        const state = this.pageStates.get(drag.pageNumber);
        if (!state || !drag.overlayWidth || !drag.overlayHeight) return;
        const dx = (event.clientX - drag.startX) * state.pageSize.width / drag.overlayWidth;
        const dy = (event.clientY - drag.startY) * state.pageSize.height / drag.overlayHeight;
        if (drag.mode === 'move') {
            state.rect = {
                ...drag.startRect,
                x: clamp(drag.startRect.x + dx, 0, state.pageSize.width - drag.startRect.width),
                y: clamp(drag.startRect.y + dy, 0, state.pageSize.height - drag.startRect.height)
            };
        } else if (state.ratio) {
            state.rect = resizeWithRatio(drag.startRect, drag.direction, dx, dy, state.pageSize, state.ratio);
        } else {
            state.rect = resizeFree(drag.startRect, drag.direction, dx, dy, state.pageSize);
        }
        this.commitCurrentState();
    }

    stopDrag() {
        if (this.handlePointerMove) window.removeEventListener('pointermove', this.handlePointerMove);
        if (this.handlePointerUp) {
            window.removeEventListener('pointerup', this.handlePointerUp);
            window.removeEventListener('pointercancel', this.handlePointerUp);
        }
        this.handlePointerMove = null;
        this.handlePointerUp = null;
        this.activeDrag = null;
        document.body.classList.remove('is-cropping-pdf');
    }

    applyInput(name, rawValue) {
        const state = this.pageStates.get(this.currentPage);
        const value = Number(rawValue);
        if (!state || !Number.isFinite(value)) {
            if (state) this.syncSettings(state);
            return;
        }
        const rect = { ...state.rect };
        if (name === 'x') {
            rect.x = clamp(value, 0, state.pageSize.width - rect.width);
        } else if (name === 'y') {
            rect.y = clamp(value, 0, state.pageSize.height - rect.height);
        } else if (name === 'width') {
            if (state.ratio) {
                const maxWidth = Math.min(
                    state.pageSize.width - rect.x,
                    (state.pageSize.height - rect.y) * state.ratio
                );
                const minWidth = Math.min(maxWidth, Math.max(MIN_CROP_SIZE, MIN_CROP_SIZE * state.ratio));
                rect.width = clamp(value, minWidth, maxWidth);
                rect.height = rect.width / state.ratio;
            } else {
                rect.width = clamp(value, Math.min(MIN_CROP_SIZE, state.pageSize.width - rect.x), state.pageSize.width - rect.x);
            }
        } else if (name === 'height') {
            if (state.ratio) {
                const maxHeight = Math.min(
                    state.pageSize.height - rect.y,
                    (state.pageSize.width - rect.x) / state.ratio
                );
                const minHeight = Math.min(maxHeight, Math.max(MIN_CROP_SIZE, MIN_CROP_SIZE / state.ratio));
                rect.height = clamp(value, minHeight, maxHeight);
                rect.width = rect.height * state.ratio;
            } else {
                rect.height = clamp(value, Math.min(MIN_CROP_SIZE, state.pageSize.height - rect.y), state.pageSize.height - rect.y);
            }
        }
        state.rect = normalizeRect(rect, state.pageSize);
        this.commitCurrentState();
    }

    commitCurrentState() {
        const state = this.pageStates.get(this.currentPage);
        if (!state) return;
        this.renderOverlay(this.currentPage);
        this.syncSettings(state);
        this.onChange();
    }

    syncSettings(state) {
        this.inputs.x.value = formatNumber(state.rect.x);
        this.inputs.y.value = formatNumber(state.rect.y);
        this.inputs.width.value = formatNumber(state.rect.width);
        this.inputs.height.value = formatNumber(state.rect.height);
        this.inputs.x.max = formatNumber(Math.max(0, state.pageSize.width - state.rect.width));
        this.inputs.y.max = formatNumber(Math.max(0, state.pageSize.height - state.rect.height));
        this.inputs.width.max = formatNumber(state.pageSize.width - state.rect.x);
        this.inputs.height.max = formatNumber(state.pageSize.height - state.rect.y);
        this.ratioInputs.forEach(input => {
            input.checked = input.value === state.ratioKey;
        });
    }

    setSettingsDisabled(disabled) {
        this.settingsRoot.querySelectorAll('input').forEach(input => {
            input.disabled = disabled;
        });
    }
}

function resizeFree(start, direction, dx, dy, pageSize) {
    let left = start.x;
    let top = start.y;
    let right = start.x + start.width;
    let bottom = start.y + start.height;
    if (direction.includes('w')) left = clamp(start.x + dx, 0, right - MIN_CROP_SIZE);
    if (direction.includes('e')) right = clamp(right + dx, left + MIN_CROP_SIZE, pageSize.width);
    if (direction.includes('n')) top = clamp(start.y + dy, 0, bottom - MIN_CROP_SIZE);
    if (direction.includes('s')) bottom = clamp(bottom + dy, top + MIN_CROP_SIZE, pageSize.height);
    return { x: left, y: top, width: right - left, height: bottom - top };
}

function resizeWithRatio(start, direction, dx, dy, pageSize, ratio) {
    const movesX = direction.includes('e') || direction.includes('w');
    const movesY = direction.includes('n') || direction.includes('s');
    const east = direction.includes('e');
    const south = direction.includes('s');

    if (movesX && movesY) {
        const anchorX = east ? start.x : start.x + start.width;
        const anchorY = south ? start.y : start.y + start.height;
        const desiredWidth = Math.max(1, start.width + (east ? dx : -dx));
        const desiredHeight = Math.max(1, start.height + (south ? dy : -dy));
        const maxWidth = east ? pageSize.width - anchorX : anchorX;
        const maxHeight = south ? pageSize.height - anchorY : anchorY;
        const primary = Math.abs(desiredWidth / start.width - 1) >= Math.abs(desiredHeight / start.height - 1)
            ? 'width'
            : 'height';
        const size = fitRatio(desiredWidth, desiredHeight, ratio, maxWidth, maxHeight, primary);
        return {
            x: east ? anchorX : anchorX - size.width,
            y: south ? anchorY : anchorY - size.height,
            ...size
        };
    }

    if (movesX) {
        const anchorX = east ? start.x : start.x + start.width;
        const centerY = start.y + start.height / 2;
        const desiredWidth = Math.max(1, start.width + (east ? dx : -dx));
        const maxWidth = east ? pageSize.width - anchorX : anchorX;
        const maxHeight = Math.max(1, 2 * Math.min(centerY, pageSize.height - centerY));
        const size = fitRatio(desiredWidth, desiredWidth / ratio, ratio, maxWidth, maxHeight, 'width');
        return {
            x: east ? anchorX : anchorX - size.width,
            y: centerY - size.height / 2,
            ...size
        };
    }

    const anchorY = south ? start.y : start.y + start.height;
    const centerX = start.x + start.width / 2;
    const desiredHeight = Math.max(1, start.height + (south ? dy : -dy));
    const maxHeight = south ? pageSize.height - anchorY : anchorY;
    const maxWidth = Math.max(1, 2 * Math.min(centerX, pageSize.width - centerX));
    const size = fitRatio(desiredHeight * ratio, desiredHeight, ratio, maxWidth, maxHeight, 'height');
    return {
        x: centerX - size.width / 2,
        y: south ? anchorY : anchorY - size.height,
        ...size
    };
}

function fitRatio(desiredWidth, desiredHeight, ratio, maxWidth, maxHeight, primary) {
    const maxAllowedWidth = Math.max(1, Math.min(maxWidth, maxHeight * ratio));
    const minAllowedWidth = Math.min(maxAllowedWidth, Math.max(MIN_CROP_SIZE, MIN_CROP_SIZE * ratio));
    const requestedWidth = primary === 'height' ? desiredHeight * ratio : desiredWidth;
    const width = clamp(requestedWidth, minAllowedWidth, maxAllowedWidth);
    return { width, height: width / ratio };
}

function largestCenteredRect(pageSize, ratio) {
    let width = pageSize.width;
    let height = width / ratio;
    if (height > pageSize.height) {
        height = pageSize.height;
        width = height * ratio;
    }
    return {
        x: (pageSize.width - width) / 2,
        y: (pageSize.height - height) / 2,
        width,
        height
    };
}

function normalizeRect(rect, pageSize) {
    const width = clamp(rect.width, 1, pageSize.width);
    const height = clamp(rect.height, 1, pageSize.height);
    return {
        x: clamp(rect.x, 0, pageSize.width - width),
        y: clamp(rect.y, 0, pageSize.height - height),
        width,
        height
    };
}

function setRectStyle(element, x, y, width, height) {
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
}

function formatNumber(value) {
    return String(Math.round(value));
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), Math.max(min, max));
}

initCropTool();
