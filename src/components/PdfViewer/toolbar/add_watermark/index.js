import { Control, FabricImage } from 'fabric';
import DialogConfirm from '@components/dialog/confirm';
import { EVENTS } from '@common/hook';
import ToolbarPlugin from '../ToolbarPlugin';
import template from './template.html';
import dialogTemplate from './dialog.html';
import './style.css';
import { createId } from '../../utils';

const IMAGE_MAX_WIDTH = 1600;
const IMAGE_MAX_HEIGHT = 1000;
const TEXT_SCALE = 2;
const SOURCE_PADDING = 16;
const ALPHA_THRESHOLD = 8;
const ICON = Object.freeze({
    main: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M174,47.75a254.19,254.19,0,0,0-41.45-38.3,8,8,0,0,0-9.18,0A254.19,254.19,0,0,0,82,47.75C54.51,79.32,40,112.6,40,144a88,88,0,0,0,176,0C216,112.6,201.49,79.32,174,47.75ZM128,216a72.08,72.08,0,0,1-72-72c0-57.23,55.47-105,72-118,16.53,13,72,60.75,72,118A72.08,72.08,0,0,1,128,216Zm55.89-62.66a57.6,57.6,0,0,1-46.56,46.55A8.75,8.75,0,0,1,136,200a8,8,0,0,1-1.32-15.89c16.57-2.79,30.63-16.85,33.44-33.45a8,8,0,0,1,15.78,2.68Z"></path></svg>'
});
const POSITIONS = Object.freeze([
    'top-left', 'top', 'top-right',
    'left', 'center', 'right',
    'bottom-left', 'bottom', 'bottom-right'
]);

function trimTransparentCanvas(sourceCanvas) {
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    if (!width || !height) return null;
    const context = sourceCanvas.getContext('2d', { willReadFrequently: true });
    const pixels = context.getImageData(0, 0, width, height).data;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            if (pixels[(y * width + x) * 4 + 3] <= ALPHA_THRESHOLD) continue;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
    }
    if (maxX < minX || maxY < minY) return null;
    const contentWidth = maxX - minX + 1;
    const contentHeight = maxY - minY + 1;
    const output = document.createElement('canvas');
    output.width = contentWidth + SOURCE_PADDING * 2;
    output.height = contentHeight + SOURCE_PADDING * 2;
    output.getContext('2d').drawImage(
        sourceCanvas,
        minX,
        minY,
        contentWidth,
        contentHeight,
        SOURCE_PADDING,
        SOURCE_PADDING,
        contentWidth,
        contentHeight
    );
    return output;
}

function renderDeleteControl(ctx, left, top, styleOverride, object) {
    const size = this.cornerSize;
    ctx.save();
    ctx.translate(left, top);
    ctx.rotate((object.angle || 0) * Math.PI / 180);
    ctx.fillStyle = '#ef3333';
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-5, -5);
    ctx.lineTo(5, 5);
    ctx.moveTo(5, -5);
    ctx.lineTo(-5, 5);
    ctx.stroke();
    ctx.restore();
}

function deleteWatermark(eventData, transform) {
    const object = transform.target;
    if (object.watermarkPlugin) {
        object.watermarkPlugin.removePageWatermark(object.watermarkPageNumber);
    }
    return true;
}

function clonePlacement(placement) {
    return placement ? { ...placement } : null;
}

export default class AddWatermarkToolbarPlugin extends ToolbarPlugin {
    constructor() {
        super({
            id: 'add_watermark',
            group: 'document',
            icon: ICON
        });
        this.instanceId = `pv-watermark-${createId()}`;
        this.models = new Map();
        this.changeCallbacks = new Set();
        this.totalPages = 0;
        this.activeType = 'text';
        this.imageDataUrl = '';
        this.imageReadGeneration = 0;
        this.editorGeneration = 0;
        this.rafId = 0;
        this.dialog = null;
    }

    render({ icon, button }) {
        return template({
            icon,
            button,
            label: $L.get('pdfviewer.add_watermark.button')
        });
    }

    mount(context) {
        super.mount(context);
        this.overlay = context.pageOverlay;
        this.unregisterOverlay = this.overlay.registerOwner('add_watermark', {
            onObjectModified: (record, options) => {
                if (!options.target) return;
                this.updateModelFromObject(record, options.target);
                this.emitChange();
            },
            onDelete: (_record, object) => this.removePageWatermark(object.watermarkPageNumber)
        });
        this.button = context.toolbar.querySelector('[data-action="add-watermark"]');
        this.handleButtonClick = () => this.openDialog();
        this.button.addEventListener('click', this.handleButtonClick);
    }

    update({ viewer }) {
        if (this.button) this.button.disabled = !viewer.pdf;
    }

    onDocumentLoad({ totalPages }) {
        this.totalPages = totalPages;
    }

    onDocumentDestroy() {
        this.editorGeneration += 1;
        this.totalPages = 0;
        if (this.dialog) this.dialog.close();
        this.clearWatermarks();
    }

    onPageRendered({ pageNumber, item, viewport }) {
        if (!this.models.has(pageNumber)) return;
        this.attachPageLayer(pageNumber, item, viewport).catch(error => {
            $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: error.message });
        });
    }

    onPageChange({ pageNumber }) {
        if (!this.models.has(pageNumber)) return;
        this.attachPageLayer(pageNumber).catch(error => {
            $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: error.message });
        });
    }

    onScaleChange() {
        cancelAnimationFrame(this.rafId);
        this.rafId = requestAnimationFrame(() => {
            this.overlay.records.forEach(record => {
                this.attachPageLayer(record.pageNumber).catch(error => {
                    $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: error.message });
                });
            });
        });
    }

    onChange(callback) {
        if (typeof callback !== 'function') {
            throw new TypeError('Add Watermark onChange callback must be a function.');
        }
        this.changeCallbacks.add(callback);
        return () => this.changeCallbacks.delete(callback);
    }

    emitChange() {
        const watermarks = this.getWatermarks();
        this.changeCallbacks.forEach(callback => callback(watermarks, this));
    }

    hasWatermarks() {
        return this.models.size > 0;
    }

    getWatermarks() {
        this.overlay.records.forEach(record => {
            const model = this.models.get(record.pageNumber);
            if (!model || model.tiled) return;
            const object = record.canvas.getObjects().find(item => item.pvOwner === 'add_watermark' && item.watermarkPageNumber === record.pageNumber);
            if (object) this.updateModelFromObject(record, object);
        });
        return [...this.models.values()]
            .sort((a, b) => a.pageNumber - b.pageNumber)
            .map(model => ({
                type: model.type,
                url: model.url,
                pageNumber: model.pageNumber,
                tiled: model.tiled,
                opacity: model.opacity,
                angle: model.angle,
                placement: clonePlacement(model.placement),
                tile: model.tile ? { ...model.tile } : null
            }));
    }

    clearWatermarks(emit = true) {
        const hadWatermarks = this.models.size > 0;
        this.editorGeneration += 1;
        this.models.clear();
        this.overlay?.removeOwnerObjects('add_watermark');
        this.updateExistingState();
        if (emit && hadWatermarks) this.emitChange();
    }

    removePageWatermark(pageNumber) {
        if (!this.models.delete(pageNumber)) return;
        this.overlay?.removeOwnerObjects('add_watermark', pageNumber);
        this.updateExistingState();
        this.emitChange();
    }

    openDialog() {
        if (!this.viewer || !this.viewer.pdf) return;
        if (!this.dialog) this.createDialog();
        this.resetEditor();
        this.dialog.open();
        window.setTimeout(() => this.textInput && this.textInput.focus(), 0);
    }

    createDialog() {
        const positionLabels = {
            'top-left': $L.get('pdfviewer.add_watermark.positionTopLeft'),
            top: $L.get('pdfviewer.add_watermark.positionTop'),
            'top-right': $L.get('pdfviewer.add_watermark.positionTopRight'),
            left: $L.get('pdfviewer.add_watermark.positionLeft'),
            center: $L.get('pdfviewer.add_watermark.positionCenter'),
            right: $L.get('pdfviewer.add_watermark.positionRight'),
            'bottom-left': $L.get('pdfviewer.add_watermark.positionBottomLeft'),
            bottom: $L.get('pdfviewer.add_watermark.positionBottom'),
            'bottom-right': $L.get('pdfviewer.add_watermark.positionBottomRight')
        };
        const body = dialogTemplate({
            idPrefix: this.instanceId,
            typeLabel: $L.get('pdfviewer.add_watermark.type'),
            typeText: $L.get('pdfviewer.add_watermark.typeText'),
            typeImage: $L.get('pdfviewer.add_watermark.typeImage'),
            applyAllPages: $L.get('pdfviewer.add_watermark.applyAllPages'),
            textLabel: $L.get('pdfviewer.add_watermark.text'),
            fontSize: $L.get('pdfviewer.add_watermark.fontSize'),
            color: $L.get('pdfviewer.add_watermark.color'),
            imageEmpty: $L.get('pdfviewer.add_watermark.imageEmpty'),
            imageAlt: $L.get('pdfviewer.add_watermark.imageAlt'),
            clearImage: $L.get('pdfviewer.add_watermark.clearImage'),
            previewLabel: $L.get('pdfviewer.add_watermark.preview'),
            opacity: $L.get('pdfviewer.add_watermark.opacity'),
            angle: $L.get('pdfviewer.add_watermark.angle'),
            position: $L.get('pdfviewer.add_watermark.position'),
            tile: $L.get('pdfviewer.add_watermark.tile'),
            existingWatermark: $L.get('pdfviewer.add_watermark.existingWatermark'),
            clearWatermark: $L.get('pdfviewer.add_watermark.clearWatermark'),
            positions: POSITIONS.map(value => ({ value, label: positionLabels[value] }))
        });
        this.dialog = new DialogConfirm({
            title: $L.get('pdfviewer.add_watermark.dialogTitle'),
            body,
            width: 680,
            height: null,
            mainClass: 'pv-plugin-dialog pv-watermark-dialog',
            no: $L.get('pdfviewer.add_watermark.cancel'),
            yes: $L.get('pdfviewer.add_watermark.add'),
            order: 'DESC',
            btnNoClass: 'btn btn-outline btn-red-outline',
            btnYesClass: 'btn btn-blue',
            overlayCloseClick: false,
            esc: true,
            initOpened: false,
            onClose: () => {
                this.editorGeneration += 1;
            },
            onYes: () => {
                void this.applyWatermark();
                return false;
            }
        });
        this.dialog.elNo.type = 'button';
        this.dialog.elYes.type = 'button';
        this.dialogRoot = this.dialog.elDialogBody.querySelector('.pv-watermark-editor');
        this.tabButtons = Array.from(this.dialogRoot.querySelectorAll('[data-watermark-tab]'));
        this.tabPanels = Array.from(this.dialogRoot.querySelectorAll('[data-watermark-panel]'));
        this.allPagesInput = this.dialogRoot.querySelector('[data-watermark-all-pages]');
        this.textInput = this.dialogRoot.querySelector('[data-watermark-text]');
        this.fontSizeInput = this.dialogRoot.querySelector('[data-watermark-font-size]');
        this.colorInput = this.dialogRoot.querySelector('[data-watermark-color]');
        this.imageInput = this.dialogRoot.querySelector('[data-watermark-image]');
        this.imageTrigger = this.dialogRoot.querySelector('[data-watermark-image-trigger]');
        this.imagePicker = this.dialogRoot.querySelector('[data-watermark-image-picker]');
        this.imagePickerPreview = this.dialogRoot.querySelector('[data-watermark-image-preview]');
        this.imagePreviewTiles = this.dialogRoot.querySelector('[data-watermark-image-preview-tiles]');
        this.imageClearButton = this.dialogRoot.querySelector('[data-watermark-image-clear]');
        this.preview = this.dialogRoot.querySelector('[data-watermark-preview]');
        this.previewText = this.dialogRoot.querySelector('[data-watermark-preview-text]');
        this.previewTiles = this.dialogRoot.querySelector('[data-watermark-preview-tiles]');
        this.opacityInput = this.dialogRoot.querySelector('[data-watermark-opacity]');
        this.opacityValue = this.dialogRoot.querySelector('[data-watermark-opacity-value]');
        this.angleInput = this.dialogRoot.querySelector('[data-watermark-angle]');
        this.angleValue = this.dialogRoot.querySelector('[data-watermark-angle-value]');
        this.tileInput = this.dialogRoot.querySelector('[data-watermark-tile]');
        this.positionGroup = this.dialogRoot.querySelector('[data-watermark-position-group]');
        this.existingState = this.dialogRoot.querySelector('[data-watermark-existing]');
        this.applyButton = this.dialog.elYes;
        this.bindDialogEvents();
    }

    bindDialogEvents() {
        this.handleTabClick = event => this.activateTab(event.currentTarget.dataset.watermarkTab);
        this.handleTabKeyDown = event => this.onTabKeyDown(event);
        this.handlePreviewChange = () => this.updatePreview();
        this.handleImageTrigger = () => this.imageInput.click();
        this.handleImageChange = () => this.readWatermarkImage();
        this.handleImageClear = () => this.clearImage();
        this.handleTileChange = () => {
            this.positionGroup.classList.toggle('is-disabled', this.tileInput.checked);
            this.positionGroup.disabled = this.tileInput.checked;
            this.updatePreview();
        };
        this.handleClearWatermarks = () => this.clearWatermarks();
        this.tabButtons.forEach(button => {
            button.addEventListener('click', this.handleTabClick);
            button.addEventListener('keydown', this.handleTabKeyDown);
        });
        [this.textInput, this.fontSizeInput, this.colorInput, this.opacityInput, this.angleInput]
            .forEach(input => input.addEventListener('input', this.handlePreviewChange));
        this.imageTrigger.addEventListener('click', this.handleImageTrigger);
        this.imageInput.addEventListener('change', this.handleImageChange);
        this.imageClearButton.addEventListener('click', this.handleImageClear);
        this.positionGroup.addEventListener('change', this.handlePreviewChange);
        this.tileInput.addEventListener('change', this.handleTileChange);
        this.dialogRoot.querySelector('[data-watermark-clear]').addEventListener('click', this.handleClearWatermarks);
    }

    resetEditor() {
        this.activateTab('text');
        this.allPagesInput.checked = false;
        this.textInput.value = 'CONFIDENTIAL';
        this.fontSizeInput.value = '50';
        this.colorInput.value = '#999999';
        this.opacityInput.value = '0.3';
        this.angleInput.value = '-45';
        this.tileInput.checked = false;
        this.positionGroup.disabled = false;
        this.positionGroup.classList.remove('is-disabled');
        const center = this.positionGroup.querySelector('input[value="center"]');
        if (center) center.checked = true;
        this.clearImage();
        this.updateExistingState();
        this.updatePreview();
    }

    activateTab(type, focus = false) {
        this.activeType = type;
        this.tabButtons.forEach(button => {
            const active = button.dataset.watermarkTab === type;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-selected', String(active));
            button.tabIndex = active ? 0 : -1;
            if (active && focus) button.focus();
        });
        this.tabPanels.forEach(panel => {
            const active = panel.dataset.watermarkPanel === type;
            panel.hidden = !active;
            panel.classList.toggle('pv-d-none', !active);
        });
        this.preview.classList.toggle('pv-d-none', type !== 'text');
        this.updatePreview();
    }

    onTabKeyDown(event) {
        const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        const currentIndex = this.tabButtons.indexOf(event.currentTarget);
        let nextIndex = currentIndex;
        if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + this.tabButtons.length) % this.tabButtons.length;
        if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % this.tabButtons.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = this.tabButtons.length - 1;
        this.activateTab(this.tabButtons[nextIndex].dataset.watermarkTab, true);
    }

    updatePreview() {
        if (!this.opacityInput) return;
        const opacity = Number(this.opacityInput.value);
        const angle = Number(this.angleInput.value);
        const transform = `rotate(${angle}deg)`;
        const text = this.textInput.value || $L.get('pdfviewer.add_watermark.textPlaceholder');
        const fontSize = Math.max(18, Math.min(64, Number(this.fontSizeInput.value) || 59));
        const positionInput = this.positionGroup.querySelector('input:checked');
        const position = positionInput ? positionInput.value : 'center';
        this.preview.dataset.position = position;
        this.imagePicker.dataset.position = position;
        this.opacityValue.textContent = `${Math.round(opacity * 100)}%`;
        this.angleValue.textContent = `${angle}°`;
        this.previewText.textContent = text;
        this.previewText.style.color = this.colorInput.value;
        this.previewText.style.fontSize = `${fontSize}px`;
        this.previewText.style.opacity = opacity;
        this.previewText.style.transform = transform;
        this.imagePickerPreview.style.opacity = opacity;
        this.imagePickerPreview.style.transform = transform;
        this.updateTiledPreview({ opacity, angle, text, fontSize });
    }

    updateTiledPreview({ opacity, angle, text, fontSize }) {
        const tiled = this.tileInput.checked;
        const textTiled = tiled && this.activeType === 'text';
        const imageTiled = tiled && this.activeType === 'image' && Boolean(this.imageDataUrl);
        this.preview.classList.toggle('is-tiled', textTiled);
        this.imagePicker.classList.toggle('is-tiled', imageTiled);
        this.previewTiles.replaceChildren();
        this.imagePreviewTiles.replaceChildren();
        if (!tiled || (this.activeType === 'image' && !this.imageDataUrl)) return;
        const tiles = this.activeType === 'text' ? this.previewTiles : this.imagePreviewTiles;
        for (let index = 0; index < 12; index += 1) {
            const tile = document.createElement('div');
            tile.className = 'pv-watermark-preview-tile';
            let content = null;
            if (this.activeType === 'text') {
                content = document.createElement('span');
                content.textContent = text;
                content.style.color = this.colorInput.value;
                content.style.fontSize = `${Math.max(9, Math.min(18, fontSize * 0.32))}px`;
            } else if (this.imageDataUrl) {
                content = document.createElement('img');
                content.src = this.imageDataUrl;
                content.alt = '';
            }
            if (content) {
                content.style.opacity = opacity;
                content.style.transform = `rotate(${angle}deg)`;
                tile.appendChild(content);
            }
            tiles.appendChild(tile);
        }
    }

    updateExistingState() {
        if (!this.existingState) return;
        this.existingState.classList.toggle('pv-d-none', !this.hasWatermarks());
    }

    clearImage() {
        this.imageReadGeneration += 1;
        this.imageDataUrl = '';
        if (this.imageInput) this.imageInput.value = '';
        if (this.imagePickerPreview) {
            this.imagePickerPreview.removeAttribute('src');
            this.imagePickerPreview.classList.add('pv-d-none');
        }
        this.imagePicker.classList.remove('has-image', 'is-tiled');
        if (this.imageTrigger) this.imageTrigger.classList.remove('pv-d-none');
        if (this.imageClearButton) this.imageClearButton.classList.add('pv-d-none');
        this.updatePreview();
    }

    readWatermarkImage() {
        const generation = ++this.imageReadGeneration;
        const file = this.imageInput.files && this.imageInput.files[0];
        if (!file) {
            this.clearImage();
            return;
        }
        if (!/^image\/(png|jpeg)$/i.test(file.type)) {
            this.clearImage();
            $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: $L.get('pdfviewer.add_watermark.invalidImage') });
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            if (generation !== this.imageReadGeneration) return;
            const url = String(reader.result || '');
            const image = new Image();
            image.onload = () => {
                if (generation !== this.imageReadGeneration) return;
                this.imageDataUrl = url;
                this.imagePickerPreview.src = url;
                this.imagePickerPreview.classList.remove('pv-d-none');
                this.imagePicker.classList.add('has-image');
                this.imageTrigger.classList.add('pv-d-none');
                this.imageClearButton.classList.remove('pv-d-none');
                this.updatePreview();
            };
            image.onerror = () => {
                if (generation !== this.imageReadGeneration) return;
                this.clearImage();
                $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: $L.get('pdfviewer.add_watermark.imageReadFailed') });
            };
            image.src = url;
        };
        reader.onerror = () => {
            if (generation !== this.imageReadGeneration) return;
            this.clearImage();
            $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: $L.get('pdfviewer.add_watermark.imageReadFailed') });
        };
        reader.readAsDataURL(file);
    }

    makeTextWatermark() {
        const text = this.textInput.value.trim();
        if (!text) return null;
        const fontSize = Math.max(8, Math.min(300, Number(this.fontSizeInput.value) || 59));
        const renderSize = fontSize * TEXT_SCALE;
        const measureCanvas = document.createElement('canvas');
        const measureContext = measureCanvas.getContext('2d');
        measureContext.font = `600 ${renderSize}px Arial, Helvetica, sans-serif`;
        const metrics = measureContext.measureText(text);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.ceil(metrics.width + SOURCE_PADDING * 4));
        canvas.height = Math.max(1, Math.ceil(renderSize * 1.5 + SOURCE_PADDING * 4));
        const context = canvas.getContext('2d');
        context.font = `600 ${renderSize}px Arial, Helvetica, sans-serif`;
        context.textBaseline = 'middle';
        context.fillStyle = this.colorInput.value;
        context.fillText(text, SOURCE_PADDING * 2, canvas.height / 2);
        const trimmed = trimTransparentCanvas(canvas);
        if (!trimmed) return null;
        return {
            url: trimmed.toDataURL('image/png'),
            width: trimmed.width / TEXT_SCALE,
            height: trimmed.height / TEXT_SCALE
        };
    }

    normalizeImage(dataUrl) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                const scale = Math.min(1, IMAGE_MAX_WIDTH / image.width, IMAGE_MAX_HEIGHT / image.height);
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(image.width * scale));
                canvas.height = Math.max(1, Math.round(image.height * scale));
                canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
                const trimmed = trimTransparentCanvas(canvas);
                resolve(trimmed ? {
                    url: trimmed.toDataURL('image/png'),
                    width: trimmed.width,
                    height: trimmed.height
                } : null);
            };
            image.onerror = () => reject(new Error($L.get('pdfviewer.add_watermark.imageReadFailed')));
            image.src = dataUrl;
        });
    }

    getInitialSize(source, pageSize, tiled) {
        const maximumWidth = pageSize.width * (tiled ? 0.3 : 0.55);
        const maximumHeight = pageSize.height * (tiled ? 0.12 : 0.25);
        const scale = Math.min(1, maximumWidth / source.width, maximumHeight / source.height);
        return {
            width: Math.max(1, source.width * scale),
            height: Math.max(1, source.height * scale)
        };
    }

    getPositionCenter(position, pageSize, size) {
        const margin = Math.max(24, Math.min(pageSize.width, pageSize.height) * 0.06);
        const horizontal = position.endsWith('left') || position === 'left'
            ? margin + size.width / 2
            : (position.endsWith('right') || position === 'right'
                ? pageSize.width - margin - size.width / 2
                : pageSize.width / 2);
        const vertical = position.startsWith('top') || position === 'top'
            ? margin + size.height / 2
            : (position.startsWith('bottom') || position === 'bottom'
                ? pageSize.height - margin - size.height / 2
                : pageSize.height / 2);
        return { centerX: horizontal, centerY: vertical };
    }

    async applyWatermark() {
        if (this.applyButton.disabled) return;
        const generation = ++this.editorGeneration;
        this.applyButton.disabled = true;
        try {
            let source = null;
            if (this.activeType === 'text') {
                source = this.makeTextWatermark();
            } else if (this.imageDataUrl) {
                source = await this.normalizeImage(this.imageDataUrl);
            }
            if (!source) {
                $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: $L.get('pdfviewer.add_watermark.emptyWatermark') });
                return;
            }
            if (generation !== this.editorGeneration || !this.viewer || !this.viewer.pdf) return;
            const pageNumbers = this.allPagesInput.checked
                ? Array.from({ length: this.totalPages }, (_, index) => index + 1)
                : [this.viewer.currentPage];
            const tiled = this.tileInput.checked;
            const opacity = Number(this.opacityInput.value);
            const angle = Number(this.angleInput.value);
            const positionInput = this.positionGroup.querySelector('input:checked');
            const position = positionInput ? positionInput.value : 'center';
            const models = await Promise.all(pageNumbers.map(async pageNumber => {
                const page = await this.viewer.pdf.getPage(pageNumber);
                const viewport = page.getViewport({ scale: 1, rotation: this.viewer.rotation });
                const pageSize = { width: viewport.width, height: viewport.height };
                const size = this.getInitialSize(source, pageSize, tiled);
                const center = this.getPositionCenter(position, pageSize, size);
                return {
                    groupId: this.instanceId,
                    type: this.activeType,
                    url: source.url,
                    pageNumber,
                    pageSize,
                    tiled,
                    opacity,
                    angle,
                    placement: tiled ? null : {
                        ...center,
                        width: size.width,
                        height: size.height,
                        angle,
                        opacity
                    },
                    tile: tiled ? {
                        width: size.width,
                        height: size.height,
                        gapX: size.width * 0.8,
                        gapY: size.height * 1.2
                    } : null
                };
            }));
            if (generation !== this.editorGeneration || !this.viewer || !this.viewer.pdf) return;
            this.clearWatermarks(false);
            this.editorGeneration = generation;
            models.forEach(model => this.models.set(model.pageNumber, model));
            await Promise.all(models.map(model => this.attachPageLayer(model.pageNumber)));
            this.updateExistingState();
            this.emitChange();
            this.dialog.close();
        } catch (error) {
            if (generation === this.editorGeneration) {
                $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: error.message });
            }
        } finally {
            this.applyButton.disabled = false;
        }
    }

    async attachPageLayer(pageNumber, suppliedItem = null, suppliedViewport = null) {
        if (!this.viewer || !this.viewer.pdf) return;
        const model = this.models.get(pageNumber);
        if (!model) return;
        const item = suppliedItem || this.viewer.getPageItem(pageNumber);
        const page = await this.viewer.pdf.getPage(pageNumber);
        const viewport = suppliedViewport || page.getViewport({
            scale: this.viewer.scale,
            rotation: this.viewer.getPageRotation(page)
        });
        const record = this.overlay.attach(pageNumber, item, viewport);
        if (!record) return;
        const baseViewport = page.getViewport({ scale: 1, rotation: this.viewer.getPageRotation(page) });
        record.watermarkPageSize = { width: baseViewport.width, height: baseViewport.height };
        model.pageSize = record.watermarkPageSize;
        if (!record.canvas.getWidth() || !record.canvas.getHeight()) return;
        if (record.watermarkModelRef !== model) await this.renderPageModel(record, model);
    }

    async renderPageModel(record, model) {
        const generation = (record.watermarkRenderGeneration || 0) + 1;
        record.watermarkRenderGeneration = generation;
        this.overlay.removeOwnerObjects('add_watermark', record.pageNumber);
        record.watermarkModelRef = model;
        if (model.tiled) {
            await this.renderTiledModel(record, model, generation);
        } else {
            await this.renderEditableModel(record, model, generation);
        }
        record.canvas.requestRenderAll();
    }

    async renderEditableModel(record, model, generation) {
        const image = await FabricImage.fromURL(model.url);
        if (generation !== record.watermarkRenderGeneration || this.models.get(model.pageNumber) !== model) return;
        const scaleX = record.canvas.getWidth() / model.pageSize.width;
        const scaleY = record.canvas.getHeight() / model.pageSize.height;
        image.controls = {
            ...image.controls,
            deleteControl: new Control({
                x: 0.5,
                y: -0.5,
                offsetX: 16,
                offsetY: -16,
                cursorStyle: 'pointer',
                mouseUpHandler: deleteWatermark,
                render: renderDeleteControl,
                cornerSize: 24
            })
        };
        image.set({
            left: model.placement.centerX * scaleX,
            top: model.placement.centerY * scaleY,
            originX: 'center',
            originY: 'center',
            scaleX: model.placement.width * scaleX / image.width,
            scaleY: model.placement.height * scaleY / image.height,
            angle: model.placement.angle,
            opacity: model.placement.opacity,
            watermarkPlugin: this,
            watermarkPageNumber: model.pageNumber,
            cornerColor: '#116bff',
            cornerStyle: 'circle',
            borderColor: '#116bff',
            transparentCorners: false,
            lockScalingFlip: true
        });
        this.overlay.addObject('add_watermark', record.pageNumber, image, { id: `watermark-${record.pageNumber}`, kind: 'watermark', zIndex: 20 });
        record.canvas.setActiveObject(image);
        image.setCoords();
    }

    getTilePlacements(model) {
        const { width, height, gapX, gapY } = model.tile;
        const stepX = Math.max(1, width + gapX);
        const stepY = Math.max(1, height + gapY);
        const placements = [];
        let row = 0;
        for (let centerY = -height; centerY <= model.pageSize.height + height; centerY += stepY) {
            const offset = row % 2 ? stepX / 2 : 0;
            for (let centerX = -width + offset; centerX <= model.pageSize.width + width; centerX += stepX) {
                placements.push({ centerX, centerY, width, height });
            }
            row += 1;
        }
        return placements;
    }

    async renderTiledModel(record, model, generation) {
        const scaleX = record.canvas.getWidth() / model.pageSize.width;
        const scaleY = record.canvas.getHeight() / model.pageSize.height;
        const placements = this.getTilePlacements(model);
        const images = await Promise.all(placements.map(() => FabricImage.fromURL(model.url)));
        if (generation !== record.watermarkRenderGeneration || this.models.get(model.pageNumber) !== model) return;
        images.forEach((image, index) => {
            const placement = placements[index];
            image.set({
                left: placement.centerX * scaleX,
                top: placement.centerY * scaleY,
                originX: 'center',
                originY: 'center',
                scaleX: placement.width * scaleX / image.width,
                scaleY: placement.height * scaleY / image.height,
                angle: model.angle,
                opacity: model.opacity,
                selectable: false,
                evented: false
            });
            this.overlay.addObject('add_watermark', record.pageNumber, image, { id: `watermark-${record.pageNumber}-${index}`, kind: 'watermark-tile', zIndex: 10 });
        });
    }

    updateModelFromObject(record, object) {
        const model = this.models.get(record.pageNumber);
        if (!model || model.tiled || !record.watermarkPageSize || object?.pvOwner !== 'add_watermark') return;
        const canvasWidth = record.canvas.getWidth();
        const canvasHeight = record.canvas.getHeight();
        if (!canvasWidth || !canvasHeight) return;
        const center = object.getCenterPoint();
        const scaleX = record.watermarkPageSize.width / canvasWidth;
        const scaleY = record.watermarkPageSize.height / canvasHeight;
        model.placement = {
            centerX: center.x * scaleX,
            centerY: center.y * scaleY,
            width: object.getScaledWidth() * scaleX,
            height: object.getScaledHeight() * scaleY,
            angle: object.angle || 0,
            opacity: object.opacity == null ? 1 : object.opacity
        };
        model.angle = model.placement.angle;
        model.opacity = model.placement.opacity;
    }

    destroyDialog() {
        if (!this.dialog) return;
        this.imageReadGeneration += 1;
        this.dialog.close();
        this.dialog.elDialog.remove();
        this.dialog = null;
        this.dialogRoot = null;
        this.tabButtons = null;
        this.tabPanels = null;
        this.imageDataUrl = '';
    }

    destroy() {
        cancelAnimationFrame(this.rafId);
        if (this.button) this.button.removeEventListener('click', this.handleButtonClick);
        this.changeCallbacks.clear();
        this.clearWatermarks(false);
        this.unregisterOverlay?.();
        this.destroyDialog();
        this.button = null;
        super.destroy();
    }
}
