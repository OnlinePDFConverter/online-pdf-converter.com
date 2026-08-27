import { Control, FabricImage } from 'fabric';
import DialogConfirm from '@components/dialog/confirm';
import { EVENTS } from '@common/hook';
import ToolbarPlugin from '../ToolbarPlugin';
import SignatureStorage from './storage';
import template from './template.html';
import dialogTemplate from './dialog.html';
import './style.css';
import { createId } from '../../utils';

const DEFAULT_SIGNATURE_WIDTH = 180;
const DEFAULT_SIGNATURE_HEIGHT = 80;
const IMAGE_MAX_WIDTH = 1600;
const IMAGE_MAX_HEIGHT = 800;
const SIGNATURE_PADDING = 8;
const SIGNATURE_ALPHA_THRESHOLD = 8;
const SIGNATURE_BOUNDS_VERSION = 1;
const DELETE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M216,48H180V36A28,28,0,0,0,152,8H104A28,28,0,0,0,76,36V48H40a12,12,0,0,0,0,24h4V208a20,20,0,0,0,20,20H192a20,20,0,0,0,20-20V72h4a12,12,0,0,0,0-24ZM100,36a4,4,0,0,1,4-4h48a4,4,0,0,1,4,4V48H100Zm88,168H68V72H188ZM116,104v64a12,12,0,0,1-24,0V104a12,12,0,0,1,24,0Zm48,0v64a12,12,0,0,1-24,0V104a12,12,0,0,1,24,0Z"></path></svg>';
const ICON = Object.freeze({
    main: '<svg viewBox="0 0 24 24"><path d="m17.7 3.3 3 3a1 1 0 0 1 0 1.4L9.4 19H4v-5.4L15.3 2.3a1 1 0 0 1 1.4 0ZM6 14.4V17h2.6L18.6 7 16 4.4l-10 10ZM3 21h18v2H3v-2Z"/></svg>'
});
const FONT_STYLES = Object.freeze({
    cursive: {
        family: '"Brush Script MT", "Segoe Script", "Snell Roundhand", cursive',
        style: 'italic'
    },
    serif: {
        family: 'Georgia, "Times New Roman", serif',
        style: 'normal'
    },
    sans: {
        family: 'Arial, Helvetica, sans-serif',
        style: 'normal'
    },
    mono: {
        family: '"Courier New", Courier, monospace',
        style: 'normal'
    }
});

function isSupportedSignatureUrl(url) {
    return typeof url === 'string' && /^data:image\/(?:png|jpe?g);base64,/i.test(url);
}

function trimTransparentCanvas(sourceCanvas) {
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    if (!width || !height) return null;

    const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
    const pixels = sourceContext.getImageData(0, 0, width, height).data;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const alpha = pixels[(y * width + x) * 4 + 3];
            if (alpha <= SIGNATURE_ALPHA_THRESHOLD) continue;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }

    if (maxX < minX || maxY < minY) return null;
    if (minX === 0 && minY === 0 && maxX === width - 1 && maxY === height - 1) {
        return sourceCanvas;
    }

    const contentWidth = maxX - minX + 1;
    const contentHeight = maxY - minY + 1;
    const output = document.createElement('canvas');
    output.width = contentWidth + SIGNATURE_PADDING * 2;
    output.height = contentHeight + SIGNATURE_PADDING * 2;
    output.getContext('2d').drawImage(
        sourceCanvas,
        minX,
        minY,
        contentWidth,
        contentHeight,
        SIGNATURE_PADDING,
        SIGNATURE_PADDING,
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

function deletePlacedSignature(eventData, transform) {
    const object = transform.target;
    const canvas = object.canvas;
    const plugin = object.signPdfPlugin;
    canvas.remove(object);
    canvas.requestRenderAll();
    if (plugin) plugin.emitChange();
    return true;
}

export default class SignPdfToolbarPlugin extends ToolbarPlugin {
    constructor() {
        super({
            id: 'sign_pdf',
            group: 'document',
            icon: ICON
        });
        this.instanceId = `pv-sign-${createId()}`;
        this.storage = new SignatureStorage();
        this.changeCallbacks = new Set();
        this.savedSignatures = [];
        this.currentSignature = null;
        this.placementGeneration = 0;
        this.activeType = 'text';
        this.dialog = null;
        this.dialogRoot = null;
        this.drawHasContent = false;
        this.imageDataUrl = '';
        this.imageReadGeneration = 0;
        this.imageTrigger = null;
        this.menuOpen = false;
        this.editorGeneration = 0;
        this.rafId = 0;
    }

    render({ icon, button }) {
        return template({
            icon,
            button,
            label: $L.get('pdfviewer.sign_pdf.button'),
            addNew: $L.get('pdfviewer.sign_pdf.addNewSignature'),
            menuId: `${this.instanceId}-menu`
        });
    }

    mount(context) {
        super.mount(context);
        const { viewer, toolbar } = context;
        this.overlay = context.pageOverlay;
        this.unregisterOverlay = this.overlay.registerOwner('sign_pdf', {
            cursor: 'crosshair',
            onToolCancel: () => this.cancelSigning(false),
            onMouseUp: (record, options) => {
                if (options.target || !this.currentSignature) return;
                void this.addSignature(record.pageNumber, options.e.clientX, options.e.clientY);
            },
            onObjectModified: () => this.emitChange(),
            onDelete: (record, object) => {
                record.canvas.remove(object);
                record.canvas.requestRenderAll();
                this.emitChange();
            }
        });
        this.menuAnchor = toolbar.querySelector('[data-sign-menu-anchor]');
        this.menu = this.menuAnchor.querySelector('[data-sign-menu]');
        this.menuList = this.menuAnchor.querySelector('[data-sign-menu-list]');
        this.button = this.menuAnchor.querySelector('[data-action="sign-pdf"]');
        this.button.setAttribute('aria-haspopup', 'menu');
        this.button.setAttribute('aria-expanded', 'false');
        this.button.setAttribute('aria-pressed', 'false');
        this.button.setAttribute('aria-controls', `${this.instanceId}-menu`);
        this.menu.setAttribute('aria-label', $L.get('pdfviewer.sign_pdf.savedSignatures'));
        this.unsubscribeToolChange = this.overlay.onToolChange(() => this.syncToolState());

        this.handleButtonClick = event => {
            event.stopPropagation();
            this.toggleMenu();
        };
        this.handleMenuClick = event => this.onMenuClick(event);
        this.handleDocumentPointerDown = event => {
            if (this.menuOpen && !this.menuAnchor.contains(event.target)) this.closeMenu();
        };
        this.handleDocumentKeyDown = event => {
            if (event.key !== 'Escape') return;
            if (this.dialog && this.dialog.elDialog && this.dialog.elDialog.classList.contains('__dialog_open')) {
                return;
            }
            if (this.menuOpen) {
                this.closeMenu();
                this.button.focus();
                return;
            }
            this.cancelSigning();
        };

        this.button.addEventListener('click', this.handleButtonClick);
        this.menu.addEventListener('click', this.handleMenuClick);
        document.addEventListener('pointerdown', this.handleDocumentPointerDown);
        document.addEventListener('keydown', this.handleDocumentKeyDown);
    }

    update({ viewer }) {
        if (this.button) this.button.disabled = !viewer.pdf;
        if (!viewer.pdf) this.closeMenu();
        this.syncToolState();
    }

    syncToolState() {
        if (!this.button) return;
        const active = Boolean(this.currentSignature && this.overlay?.isToolActive('sign_pdf'));
        this.button.classList.toggle('pv-active', active);
        this.button.setAttribute('aria-pressed', String(active));
    }

    onDocumentLoad({ totalPages }) {
        this.totalPages = totalPages;
    }

    onDocumentDestroy() {
        this.editorGeneration += 1;
        this.totalPages = 0;
        this.closeMenu();
        if (this.dialog) this.dialog.close();
        this.clearSignatures();
    }

    onPageRendered({ pageNumber, item, viewport }) {
        this.attachPageLayer(pageNumber, item, viewport).catch(error => {
            $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: error.message });
        });
    }

    onPageChange({ pageNumber }) {
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
            throw new TypeError('Sign PDF onChange callback must be a function.');
        }
        this.changeCallbacks.add(callback);
        return () => this.changeCallbacks.delete(callback);
    }

    emitChange() {
        const signatures = this.getSignatures();
        this.changeCallbacks.forEach(callback => callback(signatures, this));
    }

    hasSignatures() {
        return this.getSignatures().length > 0;
    }

    getSignatures() {
        const signatures = [];
        this.overlay.records.forEach(record => {
            record.canvas.getObjects().forEach(object => {
                if (object.pvOwner !== 'sign_pdf' || !object.signatureUrl || !record.signPageSize) return;
                const center = object.getCenterPoint();
                const canvasWidth = record.canvas.getWidth();
                const canvasHeight = record.canvas.getHeight();
                if (!canvasWidth || !canvasHeight) return;
                const scaleX = record.signPageSize.width / canvasWidth;
                const scaleY = record.signPageSize.height / canvasHeight;
                const width = object.getScaledWidth() * scaleX;
                const height = object.getScaledHeight() * scaleY;
                const centerX = center.x * scaleX;
                const centerY = center.y * scaleY;
                signatures.push({
                    url: object.signatureUrl,
                    placement: {
                        pageNumber: record.pageNumber,
                        x: centerX - width / 2,
                        y: centerY - height / 2,
                        centerX,
                        centerY,
                        width,
                        height,
                        angle: object.angle || 0,
                        opacity: object.opacity == null ? 1 : object.opacity
                    }
                });
            });
        });
        return signatures;
    }

    clearSignatures() {
        this.cancelSigning();
        const hadSignatures = this.hasSignatures();
        this.overlay?.removeOwnerObjects('sign_pdf');
        if (hadSignatures) this.emitChange();
    }

    async getSavedSignatures() {
        const records = await this.storage.getAll();
        const validRecords = records.filter(record => record && record.id && isSupportedSignatureUrl(record.url));
        const normalizedRecords = [];
        for (const record of validRecords) {
            normalizedRecords.push(await this.normalizeSavedSignature(record));
        }
        this.savedSignatures = normalizedRecords;
        return this.savedSignatures.slice();
    }

    async selectSavedSignature(id) {
        let record = await this.storage.get(id);
        if (!record || !isSupportedSignatureUrl(record.url)) {
            throw new Error($L.get('pdfviewer.sign_pdf.savedNotFound'));
        }
        record = await this.normalizeSavedSignature(record);
        return this.activateSignature({
            id: record.id,
            name: record.name,
            type: record.type,
            url: record.url,
            opacity: Number(record.opacity) || 1
        });
    }

    async deleteSavedSignature(id) {
        await this.storage.delete(id);
        if (this.currentSignature && this.currentSignature.id === id) {
            this.cancelSigning();
        }
        this.savedSignatures = this.savedSignatures.filter(record => record.id !== id);
    }

    async toggleMenu() {
        if (this.menuOpen) {
            this.closeMenu();
            return;
        }
        await this.openMenu();
    }

    async openMenu() {
        if (!this.viewer || !this.viewer.pdf) return;
        this.menuOpen = true;
        this.menu.classList.remove('pv-d-none');
        this.button.setAttribute('aria-expanded', 'true');
        this.renderMenuMessage($L.get('pdfviewer.sign_pdf.loadingSaved'), 'loading');
        try {
            const records = await this.getSavedSignatures();
            if (this.menuOpen) this.renderSavedMenu(records);
        } catch (error) {
            if (this.menuOpen) {
                this.renderMenuMessage($L.get('pdfviewer.sign_pdf.savedLoadFailed'), 'error');
            }
        }
    }

    closeMenu() {
        if (!this.menu) return;
        this.menuOpen = false;
        this.menu.classList.add('pv-d-none');
        this.button.setAttribute('aria-expanded', 'false');
    }

    renderMenuMessage(message, state) {
        this.menuList.innerHTML = '';
        const element = document.createElement('p');
        element.className = `pv-sign-menu-message is-${state}`;
        element.textContent = message;
        this.menuList.appendChild(element);
    }

    renderSavedMenu(records) {
        this.menuList.innerHTML = '';
        if (!records.length) {
            this.renderMenuMessage($L.get('pdfviewer.sign_pdf.noSavedSignatures'), 'empty');
            return;
        }
        records.forEach(record => {
            const item = document.createElement('div');
            item.className = 'pv-sign-menu-item';
            item.setAttribute('role', 'none');
            if (this.currentSignature && this.currentSignature.id === record.id) {
                item.classList.add('is-active');
            }

            const selectButton = document.createElement('button');
            selectButton.className = 'pv-sign-menu-select';
            selectButton.type = 'button';
            selectButton.dataset.signSelect = record.id;
            selectButton.setAttribute('role', 'menuitem');
            if (this.currentSignature && this.currentSignature.id === record.id) {
                selectButton.setAttribute('aria-current', 'true');
            }

            const preview = document.createElement('span');
            preview.className = 'pv-sign-menu-preview';
            const image = document.createElement('img');
            image.src = record.url;
            image.alt = '';
            preview.appendChild(image);

            const name = document.createElement('span');
            name.className = 'pv-sign-menu-name';
            name.textContent = record.name;
            selectButton.append(preview, name);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'pv-sign-menu-delete';
            deleteButton.type = 'button';
            deleteButton.dataset.signDelete = record.id;
            deleteButton.title = $L.get('pdfviewer.sign_pdf.deleteSaved');
            deleteButton.setAttribute('aria-label', `${deleteButton.title}: ${record.name}`);
            deleteButton.setAttribute('role', 'menuitem');
            deleteButton.innerHTML = DELETE_ICON;

            item.append(selectButton, deleteButton);
            this.menuList.appendChild(item);
        });
    }

    async onMenuClick(event) {
        const addButton = event.target.closest('[data-sign-menu-add]');
        if (addButton) {
            this.closeMenu();
            this.openDialog();
            return;
        }
        const deleteButton = event.target.closest('[data-sign-delete]');
        if (deleteButton) {
            event.stopPropagation();
            try {
                await this.deleteSavedSignature(deleteButton.dataset.signDelete);
                this.renderSavedMenu(this.savedSignatures);
            } catch (error) {
                $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: $L.get('pdfviewer.sign_pdf.savedDeleteFailed') });
            }
            return;
        }
        const selectButton = event.target.closest('[data-sign-select]');
        if (!selectButton) return;
        try {
            await this.selectSavedSignature(selectButton.dataset.signSelect);
            this.closeMenu();
        } catch (error) {
            $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: error.message });
        }
    }

    openDialog() {
        if (!this.viewer || !this.viewer.pdf) return;
        this.closeMenu();
        if (!this.dialog) this.createDialog();
        this.resetEditor();
        this.dialog.open();
        window.setTimeout(() => this.textInput && this.textInput.focus(), 0);
    }

    createDialog() {
        const body = dialogTemplate({
            idPrefix: this.instanceId,
            typeLabel: $L.get('pdfviewer.sign_pdf.type'),
            typeDraw: $L.get('pdfviewer.sign_pdf.typeDraw'),
            typeText: $L.get('pdfviewer.sign_pdf.typeText'),
            typeImage: $L.get('pdfviewer.sign_pdf.typeImage'),
            font: $L.get('pdfviewer.sign_pdf.font'),
            typePlaceholder: $L.get('pdfviewer.sign_pdf.typePlaceholder'),
            strokeWidth: $L.get('pdfviewer.sign_pdf.strokeWidth'),
            opacity: $L.get('pdfviewer.sign_pdf.opacity'),
            signatureText: $L.get('pdfviewer.sign_pdf.signatureText'),
            color: $L.get('pdfviewer.sign_pdf.color'),
            clear: $L.get('pdfviewer.sign_pdf.clearSignature'),
            imageEmpty: $L.get('pdfviewer.sign_pdf.imageEmpty'),
            saveSignature: $L.get('pdfviewer.sign_pdf.saveSignature')
        });
        this.dialog = new DialogConfirm({
            title: $L.get('pdfviewer.sign_pdf.addSignature'),
            body,
            width: 720,
            height: null,
            mainClass: 'pv-plugin-dialog pv-sign-dialog',
            no: $L.get('pdfviewer.sign_pdf.cancel'),
            yes: $L.get('pdfviewer.sign_pdf.add'),
            order: 'DESC',
            btnNoClass: 'btn btn-outline btn-red-outline',
            btnYesClass: 'btn btn-blue',
            overlayCloseClick: false,
            esc: true,
            initOpened: false,
            onYes: () => {
                void this.applySignature();
                return false;
            }
        });
        this.dialog.elNo.type = 'button';
        this.dialog.elYes.type = 'button';
        this.dialogRoot = this.dialog.elDialogBody.querySelector('.pv-sign-editor');
        this.tabButtons = Array.from(this.dialogRoot.querySelectorAll('[data-sign-tab]'));
        this.tabPanels = Array.from(this.dialogRoot.querySelectorAll('[data-sign-panel]'));
        this.fontInput = this.dialogRoot.querySelector('[data-sign-font]');
        this.textColorInput = this.dialogRoot.querySelector('[data-sign-text-color]');
        this.textInput = this.dialogRoot.querySelector('[data-sign-text]');
        this.strokeWidthInput = this.dialogRoot.querySelector('[data-sign-stroke-width]');
        this.strokeWidthValue = this.dialogRoot.querySelector('[data-sign-stroke-width-value]');
        this.drawColorInput = this.dialogRoot.querySelector('[data-sign-draw-color]');
        this.drawCanvas = this.dialogRoot.querySelector('[data-sign-draw-canvas]');
        this.imageInput = this.dialogRoot.querySelector('[data-sign-image]');
        this.imageTrigger = this.dialogRoot.querySelector('[data-sign-image-trigger]');
        this.imagePreviewContainer = this.dialogRoot.querySelector('[data-sign-image-preview-container]');
        this.imagePreview = null;
        this.imageEmpty = this.dialogRoot.querySelector('[data-sign-image-empty]');
        this.opacityInput = this.dialogRoot.querySelector('[data-sign-opacity]');
        this.opacityValue = this.dialogRoot.querySelector('[data-sign-opacity-value]');
        this.saveInput = this.dialogRoot.querySelector('[data-sign-save]');
        this.applyButton = this.dialog.elYes;
        this.bindDialogEvents();
    }

    bindDialogEvents() {
        this.handleTabClick = event => this.activateTab(event.currentTarget.dataset.signTab);
        this.handleTabKeyDown = event => this.onTabKeyDown(event);
        this.handleFontChange = () => this.updateTypePreview();
        this.handleTextColorChange = () => this.updateTypePreview();
        this.handleStrokeChange = () => {
            this.strokeWidthValue.textContent = this.strokeWidthInput.value;
        };
        this.handleOpacityChange = () => {
            this.opacityValue.textContent = `${Math.round(Number(this.opacityInput.value) * 100)}%`;
            this.updatePreviewOpacity();
        };
        this.handleImageTrigger = () => this.imageInput.click();
        this.handleImageChange = () => this.readSignatureImage();
        this.handleClearText = () => {
            this.textInput.value = '';
            this.textInput.focus();
        };
        this.handleClearDraw = () => this.clearDrawing();
        this.handleClearImage = () => this.clearImage();
        this.tabButtons.forEach(button => {
            button.addEventListener('click', this.handleTabClick);
            button.addEventListener('keydown', this.handleTabKeyDown);
        });
        this.fontInput.addEventListener('change', this.handleFontChange);
        this.textColorInput.addEventListener('input', this.handleTextColorChange);
        this.strokeWidthInput.addEventListener('input', this.handleStrokeChange);
        this.opacityInput.addEventListener('input', this.handleOpacityChange);
        this.imageTrigger.addEventListener('click', this.handleImageTrigger);
        this.imageInput.addEventListener('change', this.handleImageChange);
        this.dialogRoot.querySelector('[data-sign-clear-text]').addEventListener('click', this.handleClearText);
        this.dialogRoot.querySelector('[data-sign-clear-draw]').addEventListener('click', this.handleClearDraw);
        this.dialogRoot.querySelector('[data-sign-clear-image]').addEventListener('click', this.handleClearImage);
        this.bindDrawingCanvas();
    }

    resetEditor() {
        this.activateTab('text');
        this.fontInput.value = 'serif';
        this.textColorInput.value = '#111827';
        this.textInput.value = '';
        this.strokeWidthInput.value = '4';
        this.strokeWidthValue.textContent = '4';
        this.drawColorInput.value = '#111827';
        this.opacityInput.value = '1';
        this.opacityValue.textContent = '100%';
        this.saveInput.checked = true;
        this.clearDrawing();
        this.clearImage();
        this.updateTypePreview();
        this.updatePreviewOpacity();
    }

    activateTab(type, focus = false) {
        this.activeType = type;
        this.tabButtons.forEach(button => {
            const active = button.dataset.signTab === type;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-selected', String(active));
            button.tabIndex = active ? 0 : -1;
            if (active && focus) button.focus();
        });
        this.tabPanels.forEach(panel => {
            const active = panel.dataset.signPanel === type;
            panel.hidden = !active;
            panel.classList.toggle('pv-d-none', !active);
        });
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
        this.activateTab(this.tabButtons[nextIndex].dataset.signTab, true);
    }

    updateTypePreview() {
        const font = FONT_STYLES[this.fontInput.value] || FONT_STYLES.cursive;
        this.textInput.style.fontFamily = font.family;
        this.textInput.style.fontStyle = font.style;
        this.textInput.style.color = this.textColorInput.value;
    }

    updatePreviewOpacity() {
        const opacity = this.opacityInput.value;
        this.textInput.style.opacity = opacity;
        this.drawCanvas.style.opacity = opacity;
        if (this.imagePreview) this.imagePreview.style.opacity = opacity;
    }

    bindDrawingCanvas() {
        const canvas = this.drawCanvas;
        const context = canvas.getContext('2d');
        const getPoint = event => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: (event.clientX - rect.left) * canvas.width / rect.width,
                y: (event.clientY - rect.top) * canvas.height / rect.height
            };
        };
        this.handleDrawStart = event => {
            canvas.setPointerCapture(event.pointerId);
            const point = getPoint(event);
            const lineWidth = Number(this.strokeWidthInput.value) || 4;
            context.lineWidth = lineWidth;
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.strokeStyle = this.drawColorInput.value || '#111827';
            context.beginPath();
            context.moveTo(point.x, point.y);
            context.lineTo(point.x + 0.01, point.y + 0.01);
            context.stroke();
            this.drawHasContent = true;
        };
        this.handleDrawMove = event => {
            if (!canvas.hasPointerCapture(event.pointerId)) return;
            const point = getPoint(event);
            context.lineWidth = Number(this.strokeWidthInput.value) || 4;
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.strokeStyle = this.drawColorInput.value || '#111827';
            context.lineTo(point.x, point.y);
            context.stroke();
            this.drawHasContent = true;
        };
        this.handleDrawEnd = event => {
            if (canvas.hasPointerCapture(event.pointerId)) {
                canvas.releasePointerCapture(event.pointerId);
            }
        };
        canvas.addEventListener('pointerdown', this.handleDrawStart);
        canvas.addEventListener('pointermove', this.handleDrawMove);
        canvas.addEventListener('pointerup', this.handleDrawEnd);
        canvas.addEventListener('pointercancel', this.handleDrawEnd);
    }

    clearDrawing() {
        if (!this.drawCanvas) return;
        this.drawCanvas.getContext('2d').clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
        this.drawHasContent = false;
    }

    clearImage() {
        this.imageReadGeneration += 1;
        this.imageDataUrl = '';
        if (this.imageInput) this.imageInput.value = '';
        if (this.imagePreview) {
            this.imagePreview.remove();
            this.imagePreview = null;
        }
        if (this.imageEmpty) this.imageEmpty.classList.remove('pv-d-none');
    }

    readSignatureImage() {
        const generation = ++this.imageReadGeneration;
        this.imageDataUrl = '';
        if (this.imagePreview) {
            this.imagePreview.remove();
            this.imagePreview = null;
        }
        if (this.imageEmpty) this.imageEmpty.classList.remove('pv-d-none');
        const file = this.imageInput.files && this.imageInput.files[0];
        if (!file) {
            this.clearImage();
            return;
        }
        if (!/^image\/(png|jpeg)$/i.test(file.type)) {
            this.clearImage();
            $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: $L.get('pdfviewer.sign_pdf.invalidImage') });
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            if (generation !== this.imageReadGeneration || !this.imagePreviewContainer) return;
            const url = String(reader.result || '');
            if (!url) {
                this.clearImage();
                return;
            }
            const image = new Image();
            image.alt = $L.get('pdfviewer.sign_pdf.signatureImage');
            image.onload = () => {
                if (generation !== this.imageReadGeneration || !this.imagePreviewContainer) return;
                this.imageDataUrl = url;
                this.imagePreview = image;
                this.imagePreviewContainer.appendChild(image);
                this.updatePreviewOpacity();
                if (this.imageEmpty) this.imageEmpty.classList.add('pv-d-none');
            };
            image.onerror = () => {
                if (generation !== this.imageReadGeneration) return;
                this.clearImage();
                $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: $L.get('pdfviewer.sign_pdf.imageReadFailed') });
            };
            image.src = url;
        };
        reader.onerror = () => {
            if (generation !== this.imageReadGeneration) return;
            this.clearImage();
            $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: $L.get('pdfviewer.sign_pdf.imageReadFailed') });
        };
        reader.readAsDataURL(file);
    }

    getCanvasFont(fontKey, size) {
        const font = FONT_STYLES[fontKey] || FONT_STYLES.cursive;
        return `${font.style} ${size}px ${font.family}`;
    }

    makeTextSignature() {
        const value = this.textInput.value.trim();
        if (!value) return '';
        const measureCanvas = document.createElement('canvas');
        const measureContext = measureCanvas.getContext('2d');
        let fontSize = 86;
        measureContext.font = this.getCanvasFont(this.fontInput.value, fontSize);
        let textWidth = measureContext.measureText(value).width;
        if (textWidth > 1500) {
            fontSize = Math.max(32, fontSize * 1500 / textWidth);
            measureContext.font = this.getCanvasFont(this.fontInput.value, fontSize);
            textWidth = measureContext.measureText(value).width;
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(260, Math.ceil(textWidth + 56));
        canvas.height = 150;
        const context = canvas.getContext('2d');
        context.font = this.getCanvasFont(this.fontInput.value, fontSize);
        context.textBaseline = 'middle';
        context.fillStyle = this.textColorInput.value || '#111827';
        context.fillText(value, 28, canvas.height / 2);
        const trimmedCanvas = trimTransparentCanvas(canvas);
        return trimmedCanvas ? trimmedCanvas.toDataURL('image/png') : '';
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
                const trimmedCanvas = trimTransparentCanvas(canvas);
                resolve(trimmedCanvas ? trimmedCanvas.toDataURL('image/png') : '');
            };
            image.onerror = () => reject(new Error($L.get('pdfviewer.sign_pdf.imageReadFailed')));
            image.src = dataUrl;
        });
    }

    async normalizeSavedSignature(record) {
        if (record.boundsVersion === SIGNATURE_BOUNDS_VERSION) return record;
        try {
            const url = await this.normalizeImage(record.url);
            if (!url) return record;
            const normalizedRecord = {
                ...record,
                url,
                boundsVersion: SIGNATURE_BOUNDS_VERSION
            };
            await this.storage.save(normalizedRecord);
            return normalizedRecord;
        } catch (error) {
            return record;
        }
    }

    getSignatureBaseName(type) {
        const names = {
            text: $L.get('pdfviewer.sign_pdf.typeSignatureName'),
            draw: $L.get('pdfviewer.sign_pdf.drawSignatureName'),
            image: $L.get('pdfviewer.sign_pdf.imageSignatureName')
        };
        return names[type] || names.text;
    }

    createSignatureName(type, records) {
        const baseName = this.getSignatureBaseName(type);
        const usedNumbers = records
            .map(record => {
                if (record.name === baseName) return 1;
                if (!record.name.startsWith(`${baseName} `)) return 0;
                const suffix = Number(record.name.slice(baseName.length + 1));
                return Number.isInteger(suffix) ? suffix : 0;
            })
            .filter(Boolean);
        if (!usedNumbers.length) return baseName;
        return `${baseName} ${Math.max(...usedNumbers) + 1}`;
    }

    async applySignature() {
        if (this.applyButton.disabled) return;
        const applyButton = this.applyButton;
        const generation = this.editorGeneration;
        applyButton.disabled = true;
        try {
            let url = '';
            if (this.activeType === 'text') {
                url = this.makeTextSignature();
            } else if (this.activeType === 'draw' && this.drawHasContent) {
                const trimmedCanvas = trimTransparentCanvas(this.drawCanvas);
                url = trimmedCanvas ? trimmedCanvas.toDataURL('image/png') : '';
            } else if (this.activeType === 'image' && this.imageDataUrl) {
                url = await this.normalizeImage(this.imageDataUrl);
            }
            if (!url) {
                $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: $L.get('pdfviewer.sign_pdf.emptySignature') });
                return;
            }
            if (generation !== this.editorGeneration || !this.viewer || !this.viewer.pdf) return;

            const signature = {
                id: null,
                name: null,
                type: this.activeType,
                url,
                opacity: Number(this.opacityInput.value) || 1
            };
            this.activateSignature(signature);

            if (this.saveInput.checked) {
                try {
                    const records = await this.getSavedSignatures();
                    const record = {
                        ...signature,
                        id: createId(),
                        name: this.createSignatureName(this.activeType, records),
                        createdAt: Date.now(),
                        boundsVersion: SIGNATURE_BOUNDS_VERSION
                    };
                    await this.storage.save(record);
                    this.savedSignatures = [record, ...records];
                    if (generation === this.editorGeneration) {
                        this.activateSignature({ ...record });
                    }
                } catch (error) {
                    if (generation === this.editorGeneration) {
                        $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: $L.get('pdfviewer.sign_pdf.savedSaveFailed') });
                    }
                }
            }
            if (generation === this.editorGeneration && this.dialog) this.dialog.close();
        } catch (error) {
            if (generation === this.editorGeneration) {
                $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: error.message });
            }
        } finally {
            applyButton.disabled = false;
        }
    }

    setSignatureReady(ready) {
        if (!this.viewer || !this.viewer.app) return;
        this.viewer.app.classList.toggle('pv-sign-ready', ready);
    }

    activateSignature(signature) {
        this.placementGeneration += 1;
        this.currentSignature = signature;
        this.overlay?.activateTool('sign_pdf');
        this.setSignatureReady(true);
        return this.currentSignature;
    }

    cancelSigning(updateOverlay = true) {
        const wasActive = Boolean(this.currentSignature);
        this.placementGeneration += 1;
        this.currentSignature = null;
        if (updateOverlay) this.overlay?.deactivateTool('sign_pdf');
        this.setSignatureReady(false);
        if (this.menuList) {
            this.menuList.querySelectorAll('.pv-sign-menu-item.is-active').forEach(item => {
                item.classList.remove('is-active');
            });
            this.menuList.querySelectorAll('[aria-current="true"]').forEach(item => {
                item.removeAttribute('aria-current');
            });
        }
        return wasActive;
    }

    async attachPageLayer(pageNumber, suppliedItem = null, suppliedViewport = null) {
        if (!this.viewer || !this.viewer.pdf) return;
        const item = suppliedItem || this.viewer.getPageItem(pageNumber);
        const page = await this.viewer.pdf.getPage(pageNumber);
        const viewport = suppliedViewport || page.getViewport({
            scale: this.viewer.scale,
            rotation: this.viewer.getPageRotation(page)
        });
        const record = this.overlay.attach(pageNumber, item, viewport);
        if (!record) return;
        const baseViewport = page.getViewport({ scale: 1, rotation: this.viewer.getPageRotation(page) });
        record.signPageSize = { width: baseViewport.width, height: baseViewport.height };
    }

    getInitialSignatureScale(sourceWidth, sourceHeight, canvasWidth, canvasHeight) {
        const maximumWidth = Math.max(1, Math.min(DEFAULT_SIGNATURE_WIDTH, canvasWidth * 0.45));
        const maximumHeight = Math.max(1, Math.min(DEFAULT_SIGNATURE_HEIGHT, canvasHeight * 0.25));
        return Math.min(
            maximumWidth / Math.max(1, Number(sourceWidth) || 1),
            maximumHeight / Math.max(1, Number(sourceHeight) || 1)
        );
    }

    async addSignature(pageNumber, clientX, clientY) {
        const record = this.overlay.records.get(pageNumber);
        if (!record || !record.signPageSize || !this.currentSignature) return;
        const signature = this.currentSignature;
        const placementGeneration = this.placementGeneration;
        const rect = record.canvas.upperCanvasEl.getBoundingClientRect();
        const image = await FabricImage.fromURL(signature.url);
        if (
            placementGeneration !== this.placementGeneration
            || !this.currentSignature
            || this.overlay.records.get(pageNumber) !== record
        ) {
            return;
        }
        image.controls = {
            ...image.controls,
            deleteControl: new Control({
                x: 0.5,
                y: -0.5,
                offsetX: 16,
                offsetY: -16,
                cursorStyle: 'pointer',
                mouseUpHandler: deletePlacedSignature,
                render: renderDeleteControl,
                cornerSize: 24
            })
        };
        image.set({
            left: clientX - rect.left,
            top: clientY - rect.top,
            originX: 'center',
            originY: 'center',
            opacity: signature.opacity,
            signatureUrl: signature.url,
            signPdfPlugin: this,
            cornerColor: '#116bff',
            cornerStyle: 'circle',
            borderColor: '#116bff',
            transparentCorners: false,
            lockScalingFlip: true
        });
        image.scale(this.getInitialSignatureScale(
            image.width,
            image.height,
            record.canvas.getWidth(),
            record.canvas.getHeight()
        ));
        this.overlay.addObject('sign_pdf', pageNumber, image, { id: createId(), kind: 'signature', zIndex: 50 });
        record.canvas.setActiveObject(image);
        record.canvas.requestRenderAll();
        this.viewer.setCurrentPage(pageNumber);
        this.emitChange();
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
        this.fontInput = null;
        this.textColorInput = null;
        this.textInput = null;
        this.strokeWidthInput = null;
        this.strokeWidthValue = null;
        this.drawColorInput = null;
        this.drawCanvas = null;
        this.imageInput = null;
        this.imageTrigger = null;
        this.imagePreviewContainer = null;
        this.imagePreview = null;
        this.imageEmpty = null;
        this.opacityInput = null;
        this.opacityValue = null;
        this.saveInput = null;
        this.applyButton = null;
    }

    destroy() {
        this.editorGeneration += 1;
        cancelAnimationFrame(this.rafId);
        this.closeMenu();
        if (this.button) this.button.removeEventListener('click', this.handleButtonClick);
        if (this.menu) this.menu.removeEventListener('click', this.handleMenuClick);
        document.removeEventListener('pointerdown', this.handleDocumentPointerDown);
        document.removeEventListener('keydown', this.handleDocumentKeyDown);
        this.changeCallbacks.clear();
        this.clearSignatures();
        this.unsubscribeToolChange?.();
        this.unregisterOverlay?.();
        this.destroyDialog();
        this.storage.close();
        this.savedSignatures = [];
        this.menuAnchor = null;
        this.menu = null;
        this.menuList = null;
        this.button = null;
        super.destroy();
    }
}
