import {
    Circle,
    Control,
    FabricImage,
    FabricText,
    FixedLayout,
    Group,
    LayoutManager,
    Line,
    Rect
} from 'fabric';
import bwipjs from 'bwip-js';
import {
    PDFArray,
    PDFButton,
    PDFCheckBox,
    PDFDict,
    PDFDocument,
    PDFDropdown,
    PDFName,
    PDFOptionList,
    PDFRadioGroup,
    PDFRef,
    PDFSignature,
    PDFString,
    PDFTextField,
    TextAlignment
} from 'pdf-lib';
import { EVENTS } from '@common/hook';
import ToolbarPlugin from '../ToolbarPlugin';
import toolbarTemplate from './template.html';
import panelTemplate from './panel.html';
import propertiesTemplate from './dialog.html';
import propertiesPanelTemplate from './properties_panel.html';
import { clamp, createId } from '../../utils';
import './style.css';

const FIELD_TYPES = Object.freeze([
    'text', 'checkbox', 'radio', 'dropdown', 'optionlist',
    'button', 'signature', 'date', 'barcode'
]);
const DATE_FORMATS = Object.freeze([
    'm/d', 'm/d/yy', 'm/d/yyyy', 'mm/dd/yy', 'mm/dd/yyyy', 'mm/yy', 'mm/yyyy',
    'd-mmm', 'd-mmm-yy', 'd-mmm-yyyy', 'dd-mmm-yy', 'dd-mmm-yyyy', 'yy-mm-dd',
    'yyyy-mm-dd', 'mmm-yy', 'mmm-yyyy', 'mmm d, yyyy', 'mmmm-yy', 'mmmm-yyyy',
    'mmmm d, yyyy', 'dd/mm/yy', 'dd/mm/yyyy', 'yyyy/mm/dd', 'dd.mm.yy',
    'dd.mm.yyyy', 'm/d/yy h:MM tt', 'm/d/yyyy h:MM tt', 'm/d/yy HH:MM',
    'm/d/yyyy HH:MM', 'yyyy-mm', 'yyyy'
]);
const MAIN_ICON = '<svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H4V2h2Zm8 2H6v16h12V8h-4V4Zm2 1.4V6h.6L16 5.4ZM8 10h8v2H8v-2Zm0 4h8v2H8v-2Z"/></svg>';
const FIELD_ICONS = Object.freeze({
    text: '<svg viewBox="0 0 24 24"><path d="M5 4v3h5v13h4V7h5V4H5Z"/></svg>',
    checkbox: '<svg viewBox="0 0 24 24"><path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm1 2v14h14V5H5Zm3 6 2.5 2.5L16 8l1.5 1.5-7 7L6.5 12.5 8 11Z"/></svg>',
    radio: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/></svg>',
    dropdown: '<svg viewBox="0 0 24 24"><path d="M3 4h18v16H3V4Zm2 2v12h14V6H5Zm4 4h6l-3 4-3-4Z"/></svg>',
    optionlist: '<svg viewBox="0 0 24 24"><path d="M4 5h3v3H4V5Zm5 0h11v3H9V5ZM4 10.5h3v3H4v-3Zm5 0h11v3H9v-3ZM4 16h3v3H4v-3Zm5 0h11v3H9v-3Z"/></svg>',
    button: '<svg viewBox="0 0 24 24"><path d="M3 4h18v14H10l-4 3v-3H3V4Zm2 2v10h3v1l1.4-1H19V6H5Zm5 2 7 3-3 1 2 3-2 1-2-3-2 2V8Z"/></svg>',
    signature: '<svg viewBox="0 0 24 24"><path d="m18.7 2.3 3 3-12 12-4 1 1-4 12-12ZM4 20h17v2H3a1 1 0 0 1-1-1c0-3 2-5 4-5v2c-1 0-1.7.7-2 2Z"/></svg>',
    date: '<svg viewBox="0 0 24 24"><path d="M6 2h2v2h8V2h2v2h3v18H3V4h3V2Zm13 8H5v10h14V10ZM5 6v2h14V6H5Zm3 6h3v3H8v-3Z"/></svg>',
    barcode: '<svg viewBox="0 0 24 24"><path d="M3 3h7v2H5v5H3V3Zm11 0h7v7h-2V5h-5V3ZM3 14h2v5h5v2H3v-7Zm16 0h2v7h-7v-2h5v-5ZM7 7h2v10H7V7Zm4 0h1v10h-1V7Zm3 0h3v10h-3V7Z"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><path d="M3 3h18v18H3V3Zm2 2v4h4V5H5Zm6 0v4h4V5h-4Zm6 0v4h2V5h-2ZM5 11v4h4v-4H5Zm6 0v4h4v-4h-4Zm6 0v4h2v-4h-2ZM5 17v2h4v-2H5Zm6 0v2h4v-2h-4Zm6 0v2h2v-2h-2Z"/></svg>',
    clear: '<svg viewBox="0 0 24 24"><path d="M8 3h8l1 2h4v2H3V5h4l1-2Zm-2 6h12l-1 12H7L6 9Zm3 2v8h2v-8H9Zm4 0v8h2v-8h-2Z"/></svg>'
});

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

function deleteFieldControl(eventData, transform) {
    const target = transform.target;
    if (target.formsPlugin && target.formsFieldId) {
        target.formsPlugin.removeField(target.formsFieldId);
    }
    return true;
}

function cloneField(field) {
    return JSON.parse(JSON.stringify(field));
}

function nameOf(value) {
    if (!value) return '';
    return String(value).replace(/^\//, '');
}

function textOf(value) {
    if (!value) return '';
    if (typeof value.decodeText === 'function') {
        try { return value.decodeText(); } catch (error) { return ''; }
    }
    return String(value);
}

function getDictValue(dict, key) {
    return dict instanceof PDFDict ? dict.get(PDFName.of(key)) : null;
}

function getActionInfo(dict) {
    const action = getDictValue(dict, 'A');
    if (!(action instanceof PDFDict)) return { action: 'none' };
    const subtype = nameOf(getDictValue(action, 'S'));
    if (subtype === 'ResetForm') return { action: 'reset' };
    if (subtype === 'URI') return { action: 'url', actionUrl: textOf(getDictValue(action, 'URI')) };
    if (subtype !== 'JavaScript') return { action: 'none' };
    const script = textOf(getDictValue(action, 'JS'));
    if (script.includes('buttonImportIcon')) return { action: 'importIcon', jsScript: script };
    if (/\bprint\s*\(/.test(script)) return { action: 'print', jsScript: script };
    const visibility = script.match(/getField\(["'](.+?)["']\).*?display\s*=\s*display\.(visible|hidden)/s);
    if (visibility) {
        return {
            action: 'showHide',
            targetFieldName: visibility[1],
            visibilityAction: visibility[2] === 'visible' ? 'show' : 'hide'
        };
    }
    return { action: 'js', jsScript: script };
}

function getDateFormat(field) {
    const aa = getDictValue(field.acroField && field.acroField.dict, 'AA');
    if (!(aa instanceof PDFDict)) return '';
    const formatAction = getDictValue(aa, 'F');
    if (!(formatAction instanceof PDFDict)) return '';
    const script = textOf(getDictValue(formatAction, 'JS'));
    const match = script.match(/AFDate_FormatEx\(["'](.+?)["']\)/);
    return match ? match[1] : '';
}

function normalizeOptions(value) {
    return String(value || '')
        .split(/[\n,]/)
        .map(item => item.trim())
        .filter((item, index, values) => item && values.indexOf(item) === index);
}

function pdfColorToHex(values, fallback = '#000000') {
    if (!Array.isArray(values) || !values.length) return fallback;
    const channels = values.length === 1 ? [values[0], values[0], values[0]] : values.slice(0, 3);
    if (channels.length < 3) return fallback;
    return `#${channels.map(value => clamp(Math.round(Number(value) * 255), 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function makeLine(points, color = '#4b5f7d', width = 1) {
    return new Line(points, { stroke: color, strokeWidth: width, selectable: false, evented: false });
}

function getPointBounds(points) {
    const xValues = points.map(point => point[0]);
    const yValues = points.map(point => point[1]);
    const left = Math.min(...xValues);
    const top = Math.min(...yValues);
    return {
        left,
        top,
        width: Math.max(...xValues) - left,
        height: Math.max(...yValues) - top
    };
}

export default class FormsToolbarPlugin extends ToolbarPlugin {
    constructor() {
        super({ id: 'forms', group: 'forms', icon: Object.freeze({ main: MAIN_ICON }) });
        this.instanceId = `pv-forms-${createId()}`;
        this.fields = [];
        this.importedFieldNames = new Set();
        this.changeCallbacks = new Set();
        this.fieldCounter = 0;
        this.activeTool = null;
        this.gridEnabled = true;
        this.gridVisible = false;
        this.gridColumns = 2;
        this.gridRows = 2;
        this.dirty = false;
        this.documentGeneration = 0;
        this.rafId = 0;
        this.editingFieldId = null;
        this.panelOpen = false;
        this.propertiesUpdateTimer = 0;
        this.barcodePreviewTimer = 0;
    }

    render({ icon }) {
        const labels = {
            text: $L.get('pdfviewer.forms.text'),
            checkbox: $L.get('pdfviewer.forms.checkbox'),
            radio: $L.get('pdfviewer.forms.radio'),
            dropdown: $L.get('pdfviewer.forms.dropdown'),
            optionlist: $L.get('pdfviewer.forms.list'),
            button: $L.get('pdfviewer.forms.button'),
            signature: $L.get('pdfviewer.forms.signature'),
            date: $L.get('pdfviewer.forms.date'),
            barcode: $L.get('pdfviewer.forms.barcode')
        };
        this.panelHtml = panelTemplate({
            icon: FIELD_ICONS,
            panelId: `${this.instanceId}-toolbar`,
            fieldsLabel: $L.get('pdfviewer.forms.fields'),
            tools: FIELD_TYPES.map(type => ({ type, label: labels[type] })),
            gridLabel: $L.get('pdfviewer.forms.grid'),
            gridSizeLabel: $L.get('pdfviewer.forms.gridSize'),
            gridColumns: $L.get('pdfviewer.forms.gridColumns'),
            gridRows: $L.get('pdfviewer.forms.gridRows'),
            clearAll: $L.get('pdfviewer.forms.clearAll')
        });
        return toolbarTemplate({
            icon,
            panelId: `${this.instanceId}-toolbar`,
            fieldsLabel: $L.get('pdfviewer.forms.fields')
        });
    }

    mount(context) {
        super.mount(context);
        this.overlay = context.pageOverlay;
        this.unregisterOverlay = this.overlay.registerOwner('forms', {
            cursor: 'crosshair',
            onToolCancel: () => this.cancelPlacement(false),
            onMouseDown: (_record, options) => {
                if (options.target?.formsFieldId) this.openProperties(options.target.formsFieldId);
            },
            onMouseUp: (record, options) => {
                if (options.target || !this.activeTool) return;
                void this.placeAtEventPoint(record, options.e);
            },
            onObjectMoving: (record, options) => this.keepObjectInside(record, options.target),
            onObjectScaling: (record, options) => this.onObjectScaling(record, options.target),
            onObjectModified: (record, options) => {
                if (!options.target) return;
                this.updateModelFromObject(record, options.target);
                this.emitChange(true);
            },
            onSelected: (_record, object) => {
                if (object.formsFieldId) this.openProperties(object.formsFieldId);
            },
            onSelectionCleared: record => this.handleSelectionCleared(record),
            onDelete: (_record, object) => this.removeField(object.formsFieldId)
        });
        this.button = context.toolbar.querySelector('[data-action="forms"]');
        const panelHost = document.createElement('div');
        panelHost.innerHTML = this.panelHtml.trim();
        this.root = panelHost.firstElementChild;
        context.toolbar.insertAdjacentElement('afterend', this.root);
        this.toolButtons = Array.from(this.root.querySelectorAll('[data-form-tool]'));
        this.gridButton = this.root.querySelector('[data-form-grid]');
        this.gridColumnsInput = this.root.querySelector('[data-form-grid-columns]');
        this.gridRowsInput = this.root.querySelector('[data-form-grid-rows]');
        this.clearButton = this.root.querySelector('[data-form-clear]');
        this.createPropertiesPanel();
        this.handleToggleClick = () => this.setPanelOpen(!this.panelOpen);
        this.handleToolbarClick = event => {
            const tool = event.target.closest('[data-form-tool]');
            if (tool) {
                this.selectTool(tool.dataset.formTool);
                return;
            }
            if (event.target.closest('[data-form-grid]')) {
                this.gridVisible = !this.gridVisible;
                this.updateGridState();
                return;
            }
            if (event.target.closest('[data-form-clear]') && this.fields.length) {
                if (window.confirm($L.get('pdfviewer.forms.confirmClear'))) this.clearFields();
            }
        };
        this.handleGridChange = () => {
            this.gridColumns = clamp(parseInt(this.gridColumnsInput.value, 10) || 2, 2, 14);
            this.gridRows = clamp(parseInt(this.gridRowsInput.value, 10) || 2, 2, 14);
            this.gridColumnsInput.value = String(this.gridColumns);
            this.gridRowsInput.value = String(this.gridRows);
            this.updateGridState();
        };
        this.handleDocumentKeyDown = event => this.onDocumentKeyDown(event);
        this.button.addEventListener('click', this.handleToggleClick);
        this.root.addEventListener('click', this.handleToolbarClick);
        this.gridColumnsInput.addEventListener('change', this.handleGridChange);
        this.gridRowsInput.addEventListener('change', this.handleGridChange);
        document.addEventListener('keydown', this.handleDocumentKeyDown);
    }

    update({ viewer }) {
        const disabled = !viewer.pdf;
        this.button.disabled = disabled;
        if (disabled) this.setPanelOpen(false);
        this.toolButtons.forEach(button => { button.disabled = disabled; });
        this.gridButton.disabled = disabled;
        this.gridColumnsInput.disabled = disabled;
        this.gridRowsInput.disabled = disabled;
        this.clearButton.disabled = disabled || !this.fields.length;
    }

    onDocumentLoad({ pdf }) {
        const generation = ++this.documentGeneration;
        this.setPanelOpen(false);
        this.resetDocumentState();
        void this.importExistingFields(pdf, generation);
    }

    onDocumentDestroy() {
        this.documentGeneration += 1;
        this.setPanelOpen(false);
        this.resetDocumentState();
    }

    onPageRendered({ pageNumber, item, viewport }) {
        void this.attachPageLayer(pageNumber, viewport, item);
    }

    onScaleChange() {
        cancelAnimationFrame(this.rafId);
        this.rafId = requestAnimationFrame(() => {
            this.overlay.records.forEach(record => void this.attachPageLayer(record.pageNumber));
        });
    }

    onChange(callback) {
        if (typeof callback !== 'function') throw new TypeError('Forms onChange callback must be a function.');
        this.changeCallbacks.add(callback);
        return () => this.changeCallbacks.delete(callback);
    }

    getFields() {
        this.syncAllModels();
        this.fields.forEach(field => {
            if (field.type === 'barcode' && !field.barcodePng && field.barcodeValue) {
                try {
                    const canvas = document.createElement('canvas');
                    bwipjs.toCanvas(canvas, {
                        bcid: field.barcodeFormat || 'qrcode',
                        text: field.barcodeValue,
                        scale: 3,
                        includetext: !['qrcode', 'datamatrix'].includes(field.barcodeFormat)
                    });
                    field.barcodePng = canvas.toDataURL('image/png');
                } catch (error) {
                    // Property validation reports invalid barcode data before export.
                }
            }
        });
        return this.fields.map(cloneField);
    }

    getFormData() {
        return {
            fields: this.getFields(),
            importedFieldNames: Array.from(this.importedFieldNames)
        };
    }

    hasFields() {
        return this.fields.length > 0;
    }

    hasChanges() {
        return this.dirty;
    }

    emitChange(markDirty = true) {
        if (markDirty) this.dirty = true;
        const fields = this.fields.map(cloneField);
        this.changeCallbacks.forEach(callback => callback(fields, this));
        if (this.viewer) this.viewer.updateToolbar();
    }

    clearFields(emit = true) {
        const hadFields = this.fields.length > 0;
        this.closeProperties(false);
        this.fields = [];
        this.cancelPlacement();
        this.overlay?.removeOwnerObjects('forms');
        if (emit && (hadFields || this.importedFieldNames.size)) this.emitChange(true);
        else if (this.viewer) this.viewer.updateToolbar();
    }

    selectTool(type) {
        if (!FIELD_TYPES.includes(type)) throw new Error(`Unknown Forms field type "${type}".`);
        if (!this.viewer || !this.viewer.pdf) return false;
        this.closeProperties();
        this.activeTool = this.activeTool === type ? null : type;
        this.updatePlacementState();
        return Boolean(this.activeTool);
    }

    setPanelOpen(open) {
        this.panelOpen = Boolean(open && this.button && !this.button.disabled);
        if (this.root) this.root.hidden = !this.panelOpen;
        if (this.button) {
            this.button.classList.toggle('is-active', this.panelOpen);
            this.button.setAttribute('aria-expanded', String(this.panelOpen));
        }
    }

    cancelPlacement(updateOverlay = true) {
        const wasActive = Boolean(this.activeTool);
        this.activeTool = null;
        if (updateOverlay) this.overlay?.deactivateTool('forms');
        this.updatePlacementState();
        return wasActive;
    }

    updatePlacementState() {
        if (this.activeTool) this.overlay?.activateTool('forms');
        else this.overlay?.deactivateTool('forms');
        if (this.viewer && this.viewer.app) this.viewer.app.classList.toggle('pv-forms-ready', Boolean(this.activeTool));
        this.toolButtons?.forEach(button => {
            const active = button.dataset.formTool === this.activeTool;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }

    updateGridState() {
        if (this.gridButton) {
            this.gridButton.classList.toggle('is-active', this.gridVisible);
            this.gridButton.setAttribute('aria-pressed', String(this.gridVisible));
        }
        this.overlay.records.forEach(record => this.applyGrid(record));
    }

    applyGrid(record) {
        this.overlay.setDecoration('forms', record.pageNumber, 'pv-forms-grid-visible', this.gridEnabled && this.gridVisible);
        record.layer.style.setProperty('--pv-forms-grid-size', `${100 / this.gridColumns}% ${100 / this.gridRows}%`);
    }

    onDocumentKeyDown(event) {
        if (event.key === 'Escape' && this.propertiesPanel && !this.propertiesPanel.hidden) {
            this.closeProperties();
            return;
        }
        if (this.propertiesPanel && this.propertiesPanel.contains(event.target)) return;
        if (event.key === 'Escape' && this.activeTool) {
            this.cancelPlacement();
            return;
        }
        if (event.key !== 'Delete' && event.key !== 'Backspace') return;
        const tagName = event.target && event.target.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return;
        const active = this.getActiveFieldObject();
        if (active) {
            event.preventDefault();
            this.removeField(active.formsFieldId);
        }
    }

    onObjectScaling(record, object) {
        const field = this.getField(object?.formsFieldId);
        if (field && (field.type === 'checkbox'
            || field.type === 'radio'
            || (field.type === 'barcode' && field.barcodeFormat === 'qrcode'))) {
            const size = Math.max(object.getScaledWidth(), object.getScaledHeight());
            object.scaleX = size / object.width;
            object.scaleY = size / object.height;
        }
        this.keepObjectInside(record, object);
    }

    handleSelectionCleared(record) {
        if (record.formsSelectionGuard) return;
        queueMicrotask(() => {
            if (record.formsSelectionGuard || this.getActiveFieldObject() || !this.editingFieldId) return;
            this.closeProperties();
        });
    }

    async attachPageLayer(pageNumber, suppliedViewport = null, suppliedItem = null) {
        if (!this.viewer || !this.viewer.pdf) return;
        const item = suppliedItem || this.viewer.getPageItem(pageNumber);
        const page = await this.viewer.pdf.getPage(pageNumber);
        const viewport = suppliedViewport || page.getViewport({
            scale: this.viewer.scale,
            rotation: this.viewer.getPageRotation(page)
        });
        const record = this.overlay.attach(pageNumber, item, viewport);
        if (!record) return;
        this.applyGrid(record);
        await this.renderPageFields(record);
    }

    async renderPageFields(record) {
        if (!record.viewport) return;
        const generation = (record.formsRenderGeneration || 0) + 1;
        record.formsRenderGeneration = generation;
        const activeObject = record.canvas.getActiveObject();
        const activeFieldId = activeObject && activeObject.formsFieldId;
        const editingField = this.getField(this.editingFieldId);
        const restoreFieldId = activeFieldId
            || (editingField && editingField.pageNumber === record.pageNumber ? editingField.id : null);
        let restoredObject = null;
        record.formsSelectionGuard = (record.formsSelectionGuard || 0) + 1;
        try {
            this.overlay.removeOwnerObjects('forms', record.pageNumber);
            const pageFields = this.fields.filter(field => field.pageNumber === record.pageNumber);
            for (const field of pageFields) {
                const object = await this.createFieldObject(record, field);
                if (generation !== record.formsRenderGeneration || !this.getField(field.id)) return;
                this.overlay.addObject('forms', record.pageNumber, object, { id: field.id, kind: field.type, zIndex: 40 });
                if (field.id === restoreFieldId) restoredObject = object;
            }
            if (restoredObject && (activeFieldId || this.editingFieldId === restoreFieldId)) {
                record.canvas.setActiveObject(restoredObject);
            }
            record.canvas.requestRenderAll();
        } finally {
            record.formsSelectionGuard = Math.max(0, (record.formsSelectionGuard || 0) - 1);
        }
    }

    placeAtEventPoint(record, event) {
        const rect = record.canvas.upperCanvasEl.getBoundingClientRect();
        return this.placeAtClientPoint(record.pageNumber, event.clientX ?? rect.left, event.clientY ?? rect.top);
    }

    pdfRectToScreen(record, rect) {
        return getPointBounds([
            record.viewport.convertToViewportPoint(rect.x, rect.y),
            record.viewport.convertToViewportPoint(rect.x + rect.width, rect.y),
            record.viewport.convertToViewportPoint(rect.x, rect.y + rect.height),
            record.viewport.convertToViewportPoint(rect.x + rect.width, rect.y + rect.height)
        ]);
    }

    screenRectToPdf(record, rect) {
        const bounds = getPointBounds([
            record.viewport.convertToPdfPoint(rect.left, rect.top),
            record.viewport.convertToPdfPoint(rect.left + rect.width, rect.top),
            record.viewport.convertToPdfPoint(rect.left, rect.top + rect.height),
            record.viewport.convertToPdfPoint(rect.left + rect.width, rect.top + rect.height)
        ]);
        return {
            x: bounds.left,
            y: bounds.top,
            width: bounds.width,
            height: bounds.height
        };
    }

    async createFieldObject(record, field) {
        const screen = this.pdfRectToScreen(record, field.rect);
        const width = Math.max(12, screen.width);
        const height = Math.max(12, screen.height);
        const stroke = field.hideBorder ? 'transparent' : (field.borderColor || '#000000');
        const fill = field.transparentBackground ? 'rgba(255,255,255,0)' : '#ffffff';
        const children = [new Rect({
            left: 0,
            top: 0,
            width,
            height,
            originX: 'left',
            originY: 'top',
            fill,
            stroke,
            strokeWidth: field.hideBorder ? 0 : 1,
            rx: field.type === 'button' ? 3 : 0,
            ry: field.type === 'button' ? 3 : 0,
            selectable: false,
            evented: false
        })];
        await this.addFieldPreview(children, field, width, height);
        const group = new Group(children, {
            left: screen.left,
            top: screen.top,
            width,
            height,
            originX: 'left',
            originY: 'top',
            layoutManager: new LayoutManager(new FixedLayout()),
            clipPath: new Rect({
                width,
                height,
                originX: 'center',
                originY: 'center'
            }),
            formsPlugin: this,
            formsFieldId: field.id,
            cornerColor: '#116bff',
            cornerStyle: 'circle',
            borderColor: '#116bff',
            transparentCorners: false,
            lockRotation: true,
            lockScalingFlip: true,
            minScaleLimit: 0.08
        });
        group.controls = {
            ...group.controls,
            deleteControl: new Control({
                x: 0.5,
                y: -0.5,
                offsetX: 16,
                offsetY: -16,
                cursorStyle: 'pointer',
                mouseUpHandler: deleteFieldControl,
                render: renderDeleteControl,
                cornerSize: 24
            })
        };
        group.setControlsVisibility({
            mtr: false,
            ...(field.type === 'barcode' ? { ml: false, mr: false, mt: false, mb: false } : {})
        });
        return group;
    }

    async addFieldPreview(children, field, width, height) {
        const color = field.textColor || '#18233a';
        const fontSize = Math.max(9, Math.min(height * 0.58, (field.fontSize || 12) * (height / Math.max(20, field.rect.height))));
        const addText = (text, options = {}) => {
            let left = options.left == null ? 7 : options.left;
            const preview = new FabricText(String(text || ''), {
                left,
                top: options.top == null ? Math.max(2, (height - fontSize) / 2) : options.top,
                originX: 'left',
                originY: 'top',
                fontSize: options.fontSize || fontSize,
                fill: options.fill || color,
                fontFamily: 'Arial, sans-serif',
                selectable: false,
                evented: false
            });
            const maxWidth = Math.max(1, options.maxWidth == null ? width - left - 4 : options.maxWidth);
            if (preview.width > maxWidth) preview.scaleX = maxWidth / preview.width;
            const renderedWidth = preview.width * preview.scaleX;
            if (options.alignment === 'center') left = Math.max(2, (width - renderedWidth) / 2);
            else if (options.alignment === 'right') left = Math.max(2, width - renderedWidth - 7);
            preview.left = left;
            children.push(preview);
        };
        if (field.type === 'checkbox') {
            if (field.checked) {
                children.push(makeLine([width * .22, height * .52, width * .43, height * .74], color, 2));
                children.push(makeLine([width * .43, height * .74, width * .8, height * .25], color, 2));
            }
        } else if (field.type === 'radio') {
            const radius = Math.max(2, (Math.min(width, height) - 6) / 2);
            const center = { left: width / 2, top: height / 2, originX: 'center', originY: 'center' };
            children.push(new Circle({ ...center, radius, fill: 'transparent', stroke: color, strokeWidth: 1, selectable: false, evented: false }));
            if (field.checked) children.push(new Circle({ ...center, radius: Math.max(1, radius * .44), fill: color, selectable: false, evented: false }));
        } else if (field.type === 'dropdown') {
            addText(field.defaultValue || (field.options && field.options[0]) || field.name, {
                maxWidth: Math.max(1, width - 32)
            });
            addText('▾', { left: Math.max(4, width - 18), maxWidth: 14, fill: '#4b5f7d' });
        } else if (field.type === 'optionlist') {
            const options = (field.options || []).slice(0, 3);
            options.forEach((option, index) => addText(option, { top: 3 + index * Math.max(10, height / 3), fontSize: Math.min(12, height / 4) }));
        } else if (field.type === 'button') {
            children[0].set({ fill: field.transparentBackground ? 'transparent' : '#edf3ff' });
            addText(field.label || field.name, { alignment: 'center', maxWidth: Math.max(1, width - 14) });
        } else if (field.type === 'signature') {
            addText($L.get('pdfviewer.forms.signature'), { alignment: 'center', maxWidth: Math.max(1, width - 14), fill: '#60708a' });
        } else if (field.type === 'date') {
            addText(field.dateFormat || 'mm/dd/yyyy', { maxWidth: Math.max(1, width - 34) });
            addText('▣', { left: Math.max(4, width - 20), maxWidth: 16, fill: '#60708a' });
        } else if (field.type === 'barcode' && field.barcodePng) {
            try {
                const image = await FabricImage.fromURL(field.barcodePng);
                const padding = field.hideBorder ? 0 : 3;
                const availableWidth = Math.max(1, width - padding * 2);
                const availableHeight = Math.max(1, height - padding * 2);
                const scale = Math.min(
                    availableWidth / Math.max(1, image.width),
                    availableHeight / Math.max(1, image.height)
                );
                const imageWidth = image.width * scale;
                const imageHeight = image.height * scale;
                image.set({
                    left: padding + (availableWidth - imageWidth) / 2,
                    top: padding + (availableHeight - imageHeight) / 2,
                    originX: 'left',
                    originY: 'top',
                    scaleX: scale,
                    scaleY: scale,
                    selectable: false,
                    evented: false
                });
                children.push(image);
            } catch (error) {
                addText(field.barcodeValue || 'Barcode');
            }
        } else {
            addText(field.defaultValue || field.name, {
                alignment: field.type === 'text' ? field.alignment : 'left',
                maxWidth: Math.max(1, width - 14)
            });
        }
    }

    keepObjectInside(record, object) {
        if (!object) return;
        const width = object.getScaledWidth();
        const height = object.getScaledHeight();
        object.left = clamp(object.left, 0, Math.max(0, record.canvas.getWidth() - width));
        object.top = clamp(object.top, 0, Math.max(0, record.canvas.getHeight() - height));
    }

    updateModelFromObject(record, object) {
        const field = this.getField(object.formsFieldId);
        if (!field || !record.viewport) return;
        field.rect = this.screenRectToPdf(record, {
            left: object.left,
            top: object.top,
            width: object.getScaledWidth(),
            height: object.getScaledHeight()
        });
    }

    syncAllModels() {
        this.overlay.records.forEach(record => {
            record.canvas.getObjects()
                .filter(object => object.pvOwner === 'forms')
                .forEach(object => this.updateModelFromObject(record, object));
        });
    }

    async placeAtClientPoint(pageNumber, clientX, clientY) {
        const type = this.activeTool;
        if (!type) return;
        await this.attachPageLayer(pageNumber);
        const record = this.overlay.records.get(pageNumber);
        if (!record || !record.viewport || type !== this.activeTool) return;
        const canvasRect = record.canvas.upperCanvasEl.getBoundingClientRect();
        const point = record.viewport.convertToPdfPoint(clientX - canvasRect.left, clientY - canvasRect.top);
        const defaultSize = type === 'checkbox' || type === 'radio'
            ? { width: 30, height: 30 }
            : type === 'barcode'
                ? { width: 150, height: 150 }
                : { width: 150, height: 30 };
        const page = await this.viewer.pdf.getPage(pageNumber);
        const view = page.view;
        const minX = Math.min(view[0], view[2]);
        const minY = Math.min(view[1], view[3]);
        const maxX = Math.max(view[0], view[2]);
        const maxY = Math.max(view[1], view[3]);
        const rect = {
            x: clamp(point[0] - defaultSize.width / 2, minX, maxX - defaultSize.width),
            y: clamp(point[1] - defaultSize.height / 2, minY, maxY - defaultSize.height),
            ...defaultSize
        };
        const field = this.createDefaultField(type, pageNumber, rect);
        this.fields.push(field);
        this.cancelPlacement();
        this.emitChange(true);
        await this.renderPageFields(record);
        const object = record.canvas.getObjects().find(item => item.formsFieldId === field.id);
        if (object) record.canvas.setActiveObject(object);
        this.openProperties(field.id);
    }

    createDefaultField(type, pageNumber, rect) {
        this.fieldCounter += 1;
        const typeName = type.charAt(0).toUpperCase() + type.slice(1);
        const name = `${typeName}_${this.fieldCounter}`;
        return {
            id: `field-${createId()}`,
            fieldKey: type === 'radio' ? `radio:${name}` : `new:${createId()}`,
            imported: false,
            type,
            pageNumber,
            rect,
            name,
            defaultValue: '',
            fontSize: 12,
            alignment: 'left',
            textColor: '#000000',
            required: false,
            readOnly: false,
            tooltip: '',
            combCells: 0,
            maxLength: 0,
            multiline: false,
            options: type === 'dropdown' || type === 'optionlist' ? ['Option 1', 'Option 2', 'Option 3'] : [],
            checked: false,
            exportValue: 'Yes',
            groupName: type === 'radio' ? name : '',
            label: type === 'signature'
                ? $L.get('pdfviewer.forms.signature')
                : $L.get('pdfviewer.forms.button'),
            action: 'none',
            actionUrl: '',
            jsScript: '',
            targetFieldName: '',
            visibilityAction: 'toggle',
            dateFormat: 'mm/dd/yyyy',
            borderColor: '#000000',
            hideBorder: false,
            transparentBackground: false,
            barcodeFormat: 'qrcode',
            barcodeValue: 'https://example.com',
            barcodePng: ''
        };
    }

    getField(id) {
        return this.fields.find(field => field.id === id) || null;
    }

    getActiveFieldObject() {
        for (const record of this.overlay.records.values()) {
            const object = record.canvas.getActiveObject();
            if (object?.pvOwner === 'forms' && object.formsFieldId) return object;
        }
        return null;
    }

    removeField(id) {
        const field = this.getField(id);
        if (!field) return false;
        if (this.editingFieldId === id) this.closeProperties(false);
        this.fields = this.fields.filter(item => item.id !== id);
        const record = this.overlay.records.get(field.pageNumber);
        if (record) void this.renderPageFields(record);
        this.emitChange(true);
        return true;
    }

    resetDocumentState() {
        this.closeProperties(false);
        this.cancelPlacement();
        this.fields = [];
        this.importedFieldNames.clear();
        this.fieldCounter = 0;
        this.dirty = false;
        this.overlay?.removeOwnerObjects('forms');
        if (this.viewer) this.viewer.updateToolbar();
    }

    async importExistingFields(pdf, generation) {
        try {
            const bytes = await pdf.getData();
            const pdfDoc = await PDFDocument.load(bytes, { updateMetadata: false });
            if (generation !== this.documentGeneration) return;
            const form = pdfDoc.getForm();
            const pages = pdfDoc.getPages();
            const pageByRef = new Map();
            const pageByDict = new Map();
            pages.forEach((page, index) => {
                pageByRef.set(page.ref.toString(), index + 1);
                const annots = page.node.get(PDFName.of('Annots'));
                const array = annots instanceof PDFArray ? annots : pdfDoc.context.lookupMaybe(annots, PDFArray);
                if (!array) return;
                array.asArray().forEach(entry => {
                    if (entry instanceof PDFRef) pageByRef.set(entry.toString(), index + 1);
                    const dict = pdfDoc.context.lookupMaybe(entry, PDFDict);
                    if (dict) pageByDict.set(dict, index + 1);
                });
            });
            const imported = [];
            for (const pdfField of form.getFields()) {
                const supported = pdfField instanceof PDFTextField
                    || pdfField instanceof PDFCheckBox
                    || pdfField instanceof PDFRadioGroup
                    || pdfField instanceof PDFDropdown
                    || pdfField instanceof PDFOptionList
                    || pdfField instanceof PDFButton
                    || pdfField instanceof PDFSignature;
                if (!supported) continue;
                const widgets = pdfField.acroField.getWidgets();
                // Acrobat image-upload buttons rely on reader-specific
                // JavaScript. Keep existing ones in the source PDF, but do
                // not import them into the Forms editor.
                if (pdfField instanceof PDFButton
                    && widgets.some(widget => getActionInfo(widget.dict).action === 'importIcon')) {
                    continue;
                }
                const radioOptions = pdfField instanceof PDFRadioGroup ? pdfField.getOptions() : [];
                let importedCount = 0;
                for (let widgetIndex = 0; widgetIndex < widgets.length; widgetIndex += 1) {
                    const widget = widgets[widgetIndex];
                    let pageNumber = null;
                    const pageRef = widget.P();
                    if (pageRef instanceof PDFRef) pageNumber = pageByRef.get(pageRef.toString()) || null;
                    if (!pageNumber) {
                        const widgetRef = pdfDoc.context.getObjectRef(widget.dict);
                        if (widgetRef) pageNumber = pageByRef.get(widgetRef.toString()) || null;
                    }
                    if (!pageNumber) pageNumber = pageByDict.get(widget.dict) || null;
                    if (!pageNumber) continue;
                    const model = this.extractFieldModel(pdfField, widget, widgetIndex, radioOptions, pageNumber);
                    imported.push(model);
                    importedCount += 1;
                }
                if (importedCount) this.importedFieldNames.add(pdfField.getName());
            }
            if (generation !== this.documentGeneration) return;
            this.fields = imported;
            this.dirty = false;
            this.emitChange(false);
            const renderedPages = new Set(imported.map(field => field.pageNumber));
            renderedPages.forEach(pageNumber => void this.attachPageLayer(pageNumber));
        } catch (error) {
            if (generation === this.documentGeneration) {
                $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: $L.get('pdfviewer.forms.importFailed') });
            }
        }
    }

    extractFieldModel(pdfField, widget, widgetIndex, radioOptions, pageNumber) {
        this.fieldCounter += 1;
        const name = pdfField.getName();
        const rectangle = widget.getRectangle();
        let type = 'signature';
        if (pdfField instanceof PDFTextField) type = getDateFormat(pdfField) ? 'date' : 'text';
        else if (pdfField instanceof PDFCheckBox) type = 'checkbox';
        else if (pdfField instanceof PDFRadioGroup) type = 'radio';
        else if (pdfField instanceof PDFDropdown) type = 'dropdown';
        else if (pdfField instanceof PDFOptionList) type = 'optionlist';
        else if (pdfField instanceof PDFButton) type = 'button';
        const field = this.createDefaultField(type, pageNumber, {
            x: rectangle.x,
            y: rectangle.y,
            width: rectangle.width,
            height: rectangle.height
        });
        field.id = `imported-${createId()}`;
        field.fieldKey = `existing:${name}`;
        field.imported = true;
        field.name = name;
        field.groupName = type === 'radio' ? name : '';
        field.tooltip = textOf(getDictValue(widget.dict, 'TU'));
        field.required = pdfField.isRequired();
        field.readOnly = pdfField.isReadOnly();
        const appearance = widget.getAppearanceCharacteristics();
        const borderStyle = widget.getBorderStyle();
        if (appearance) {
            const borderColor = appearance.getBorderColor();
            const backgroundColor = appearance.getBackgroundColor();
            if (borderColor) field.borderColor = pdfColorToHex(borderColor);
            field.transparentBackground = !backgroundColor;
        }
        field.hideBorder = Boolean(borderStyle && borderStyle.getWidth() === 0);
        if (pdfField instanceof PDFTextField) {
            field.defaultValue = pdfField.getText() || '';
            field.multiline = pdfField.isMultiline();
            const maxLength = pdfField.getMaxLength();
            if (maxLength) {
                if (pdfField.isCombed()) field.combCells = maxLength;
                else field.maxLength = maxLength;
            }
            const alignment = pdfField.getAlignment();
            field.alignment = alignment === TextAlignment.Center ? 'center' : alignment === TextAlignment.Right ? 'right' : 'left';
            field.dateFormat = getDateFormat(pdfField) || field.dateFormat;
        } else if (pdfField instanceof PDFCheckBox) {
            field.checked = pdfField.isChecked();
        } else if (pdfField instanceof PDFRadioGroup) {
            field.exportValue = radioOptions[widgetIndex] || 'Yes';
            field.checked = pdfField.getSelected() === field.exportValue;
        } else if (pdfField instanceof PDFDropdown || pdfField instanceof PDFOptionList) {
            field.options = pdfField.getOptions();
            field.defaultValue = pdfField.getSelected()[0] || '';
        } else if (pdfField instanceof PDFButton) {
            const action = getActionInfo(widget.dict);
            Object.assign(field, action);
            const captions = appearance ? appearance.getCaptions() : {};
            field.label = captions.normal || $L.get('pdfviewer.forms.button');
        }
        return field;
    }

    createPropertiesPanel() {
        const body = propertiesTemplate({
            idPrefix: this.instanceId,
            fieldName: $L.get('pdfviewer.forms.fieldName'),
            tooltip: $L.get('pdfviewer.forms.tooltip'),
            defaultValue: $L.get('pdfviewer.forms.defaultValue'),
            maxLength: $L.get('pdfviewer.forms.maxLength'),
            combCells: $L.get('pdfviewer.forms.combCells'),
            fontSize: $L.get('pdfviewer.forms.fontSize'),
            textColor: $L.get('pdfviewer.forms.textColor'),
            alignment: $L.get('pdfviewer.forms.alignment'),
            left: $L.get('pdfviewer.forms.left'),
            center: $L.get('pdfviewer.forms.center'),
            right: $L.get('pdfviewer.forms.right'),
            multiline: $L.get('pdfviewer.forms.multiline'),
            checked: $L.get('pdfviewer.forms.checked'),
            radioGroup: $L.get('pdfviewer.forms.radioGroup'),
            exportValue: $L.get('pdfviewer.forms.exportValue'),
            options: $L.get('pdfviewer.forms.options'),
            optionsHelp: $L.get('pdfviewer.forms.optionsHelp'),
            selectedOption: $L.get('pdfviewer.forms.selectedOption'),
            label: $L.get('pdfviewer.forms.label'),
            action: $L.get('pdfviewer.forms.action'),
            actionNone: $L.get('pdfviewer.forms.actionNone'),
            actionReset: $L.get('pdfviewer.forms.actionReset'),
            actionPrint: $L.get('pdfviewer.forms.actionPrint'),
            actionUrl: $L.get('pdfviewer.forms.actionUrl'),
            actionJs: $L.get('pdfviewer.forms.actionJs'),
            actionShowHide: $L.get('pdfviewer.forms.actionShowHide'),
            url: $L.get('pdfviewer.forms.url'),
            javascript: $L.get('pdfviewer.forms.javascript'),
            javascriptHelp: $L.get('pdfviewer.forms.javascriptHelp'),
            targetField: $L.get('pdfviewer.forms.targetField'),
            visibility: $L.get('pdfviewer.forms.visibility'),
            show: $L.get('pdfviewer.forms.show'),
            hide: $L.get('pdfviewer.forms.hide'),
            toggle: $L.get('pdfviewer.forms.toggle'),
            signatureHelp: $L.get('pdfviewer.forms.signatureHelp'),
            dateFormat: $L.get('pdfviewer.forms.dateFormat'),
            customDateFormat: $L.get('pdfviewer.forms.customDateFormat'),
            dateHelp: $L.get('pdfviewer.forms.dateHelp'),
            barcodeFormat: $L.get('pdfviewer.forms.barcodeFormat'),
            barcodeValue: $L.get('pdfviewer.forms.barcodeValue'),
            borderColor: $L.get('pdfviewer.forms.borderColor'),
            required: $L.get('pdfviewer.forms.required'),
            readOnly: $L.get('pdfviewer.forms.readOnly'),
            hideBorder: $L.get('pdfviewer.forms.hideBorder'),
            transparentBackground: $L.get('pdfviewer.forms.transparentBackground'),
            deleteField: $L.get('pdfviewer.forms.deleteField')
        });
        const panelHost = document.createElement('div');
        panelHost.innerHTML = propertiesPanelTemplate({
            panelTitleId: `${this.instanceId}-properties-title`,
            title: $L.get('pdfviewer.forms.properties'),
            closeLabel: $L.get('pdfviewer.forms.closeProperties'),
            body
        });
        this.propertiesPanel = panelHost.firstElementChild;
        this.propertiesRoot = this.propertiesPanel.querySelector('[data-forms-properties]');
        this.viewer.container.querySelector('.pv-body').appendChild(this.propertiesPanel);
        this.handlePropertiesInput = event => this.onPropertyInput(event);
        this.handlePropertiesSubmit = event => event.preventDefault();
        this.handlePropertiesClose = () => this.closeProperties();
        this.handlePropertiesDelete = () => {
            if (this.editingFieldId) this.removeField(this.editingFieldId);
        };
        this.propertiesRoot.addEventListener('input', this.handlePropertiesInput);
        this.propertiesRoot.addEventListener('change', this.handlePropertiesInput);
        this.propertiesRoot.addEventListener('submit', this.handlePropertiesSubmit);
        this.propertiesCloseButton = this.propertiesPanel.querySelector('[data-properties-close]');
        this.propertiesDeleteButton = this.propertiesRoot.querySelector('[data-delete-field]');
        this.propertiesCloseButton.addEventListener('click', this.handlePropertiesClose);
        this.propertiesDeleteButton.addEventListener('click', this.handlePropertiesDelete);
        const dateSelect = this.propertiesRoot.querySelector('[data-prop="dateFormat"]');
        DATE_FORMATS.forEach(value => dateSelect.add(new Option(value, value)));
        dateSelect.add(new Option($L.get('pdfviewer.forms.custom'), 'custom'));
    }

    openProperties(id) {
        const field = this.getField(id);
        if (!field) return;
        if (this.editingFieldId === id && !this.propertiesPanel.hidden) return;
        if (this.editingFieldId) this.applyProperties();
        this.clearPropertiesTimers();
        this.editingFieldId = id;
        this.populateProperties(field);
        this.propertiesPanel.hidden = false;
    }

    closeProperties(apply = true) {
        if (!this.propertiesPanel) return;
        if (apply && this.editingFieldId) this.applyProperties();
        this.clearPropertiesTimers();
        this.propertiesPanel.hidden = true;
        this.editingFieldId = null;
        this.clearPropertyError();
    }

    setPropertyValue(name, value) {
        const input = this.propertiesRoot.querySelector(`[data-prop="${name}"]`);
        if (!input) return;
        if (input.type === 'checkbox') input.checked = Boolean(value);
        else input.value = value == null ? '' : String(value);
    }

    populateProperties(field) {
        this.propertiesRoot.querySelectorAll('[data-type-panel]').forEach(panel => {
            panel.hidden = !panel.dataset.typePanel.split(',').includes(field.type);
        });
        Object.entries(field).forEach(([name, value]) => this.setPropertyValue(name, value));
        this.setPropertyValue('options', (field.options || []).join('\n'));
        this.populateOptionSelect(field.options || [], field.defaultValue);
        this.populateTargetFields(field);
        this.populateRadioGroups(field);
        const customDate = !DATE_FORMATS.includes(field.dateFormat);
        this.setPropertyValue('dateFormat', customDate ? 'custom' : field.dateFormat);
        this.setPropertyValue('customDateFormat', customDate ? field.dateFormat : '');
        this.updateConditionalPanels();
        this.updateBarcodePreview();
        this.clearPropertyError();
    }

    populateOptionSelect(options, selected) {
        const select = this.propertiesRoot.querySelector('[data-prop="defaultOption"]');
        select.innerHTML = '';
        select.add(new Option($L.get('pdfviewer.forms.none'), ''));
        options.forEach(option => select.add(new Option(option, option)));
        select.value = selected || '';
    }

    populateTargetFields(field) {
        const select = this.propertiesRoot.querySelector('[data-prop="targetFieldName"]');
        select.innerHTML = '';
        select.add(new Option($L.get('pdfviewer.forms.none'), ''));
        Array.from(new Set(this.fields.filter(item => item.id !== field.id).map(item => item.name)))
            .sort()
            .forEach(name => select.add(new Option(name, name)));
        select.value = field.targetFieldName || '';
    }

    populateRadioGroups(field) {
        const datalist = this.propertiesRoot.querySelector('[data-radio-groups]');
        datalist.innerHTML = '';
        Array.from(new Set(this.fields.filter(item => item.type === 'radio' && item.id !== field.id).map(item => item.name)))
            .sort()
            .forEach(name => datalist.appendChild(new Option(name)));
    }

    onPropertyInput(event) {
        const prop = event.target.dataset.prop;
        const editingField = this.getField(this.editingFieldId);
        if (!prop || !editingField) return;
        if (editingField && editingField.type === 'radio') {
            if (prop === 'name') this.setPropertyValue('groupName', event.target.value);
            if (prop === 'groupName') this.setPropertyValue('name', event.target.value);
        }
        if (prop === 'options') {
            const selected = this.propertiesRoot.querySelector('[data-prop="defaultOption"]').value;
            this.populateOptionSelect(normalizeOptions(event.target.value), selected);
        }
        if (prop === 'action' || prop === 'dateFormat') this.updateConditionalPanels();
        if (prop === 'barcodeFormat' || prop === 'barcodeValue') this.scheduleBarcodePreview();
        const immediate = event.type === 'change'
            || event.target.type === 'checkbox'
            || event.target.type === 'color'
            || event.target.tagName === 'SELECT';
        this.queuePropertiesUpdate(immediate);
    }

    queuePropertiesUpdate(immediate = false) {
        window.clearTimeout(this.propertiesUpdateTimer);
        if (immediate) {
            this.propertiesUpdateTimer = 0;
            this.applyProperties();
            return;
        }
        this.propertiesUpdateTimer = window.setTimeout(() => {
            this.propertiesUpdateTimer = 0;
            this.applyProperties();
        }, 180);
    }

    scheduleBarcodePreview() {
        window.clearTimeout(this.barcodePreviewTimer);
        this.barcodePreviewTimer = window.setTimeout(() => {
            this.barcodePreviewTimer = 0;
            this.updateBarcodePreview();
        }, 140);
    }

    clearPropertiesTimers() {
        window.clearTimeout(this.propertiesUpdateTimer);
        window.clearTimeout(this.barcodePreviewTimer);
        this.propertiesUpdateTimer = 0;
        this.barcodePreviewTimer = 0;
    }

    updateConditionalPanels() {
        const action = this.propertiesRoot.querySelector('[data-prop="action"]').value;
        this.propertiesRoot.querySelectorAll('[data-action-panel]').forEach(panel => {
            panel.hidden = panel.dataset.actionPanel !== action;
        });
        const dateFormat = this.propertiesRoot.querySelector('[data-prop="dateFormat"]').value;
        this.propertiesRoot.querySelector('[data-custom-date]').hidden = dateFormat !== 'custom';
    }

    updateBarcodePreview() {
        const field = this.getField(this.editingFieldId);
        if (!field || field.type !== 'barcode') return;
        const canvas = this.propertiesRoot.querySelector('[data-barcode-preview]');
        const format = this.propertiesRoot.querySelector('[data-prop="barcodeFormat"]').value;
        const value = this.propertiesRoot.querySelector('[data-prop="barcodeValue"]').value.trim();
        if (!value) {
            canvas.width = 0;
            canvas.height = 0;
            return;
        }
        try {
            bwipjs.toCanvas(canvas, {
                bcid: format,
                text: value,
                scale: 2,
                includetext: !['qrcode', 'datamatrix'].includes(format)
            });
        } catch (error) {
            canvas.width = 0;
            canvas.height = 0;
        }
    }

    readProperty(name) {
        const input = this.propertiesRoot.querySelector(`[data-prop="${name}"]`);
        if (!input) return null;
        return input.type === 'checkbox' ? input.checked : input.value;
    }

    applyProperties() {
        const field = this.getField(this.editingFieldId);
        if (!field || !this.propertiesRoot) return false;
        this.clearPropertyError();
        const draft = cloneField(field);
        draft.name = String(this.readProperty('name') || '').trim();
        if (!draft.name) return this.setPropertyError($L.get('pdfviewer.forms.nameRequired'), true);
        const duplicate = this.fields.find(item => item.id !== field.id && item.name === draft.name && item.fieldKey !== field.fieldKey);
        if (duplicate && !(field.type === 'radio' && duplicate.type === 'radio')) {
            return this.setPropertyError($L.get('pdfviewer.forms.nameDuplicate'), true);
        }
        draft.tooltip = this.readProperty('tooltip') || '';
        draft.required = Boolean(this.readProperty('required'));
        draft.readOnly = Boolean(this.readProperty('readOnly'));
        draft.borderColor = this.readProperty('borderColor') || '#000000';
        draft.hideBorder = Boolean(this.readProperty('hideBorder'));
        draft.transparentBackground = Boolean(this.readProperty('transparentBackground'));
        if (draft.type === 'text') {
            draft.defaultValue = this.readProperty('defaultValue') || '';
            draft.maxLength = Math.max(0, parseInt(this.readProperty('maxLength'), 10) || 0);
            draft.combCells = Math.max(0, parseInt(this.readProperty('combCells'), 10) || 0);
            if (draft.combCells) draft.maxLength = 0;
            const limit = draft.combCells || draft.maxLength;
            if (limit) draft.defaultValue = draft.defaultValue.slice(0, limit);
            draft.fontSize = clamp(parseInt(this.readProperty('fontSize'), 10) || 12, 8, 72);
            draft.textColor = this.readProperty('textColor') || '#000000';
            draft.alignment = this.readProperty('alignment') || 'left';
            draft.multiline = Boolean(this.readProperty('multiline'));
        } else if (draft.type === 'checkbox') {
            draft.checked = Boolean(this.readProperty('checked'));
        } else if (draft.type === 'radio') {
            const groupName = String(this.readProperty('groupName') || draft.name).trim();
            draft.name = groupName || draft.name;
            const groupConflict = this.fields.find(item => item.id !== field.id && item.name === draft.name && item.type !== 'radio');
            if (groupConflict) return this.setPropertyError($L.get('pdfviewer.forms.nameDuplicate'), true);
            draft.groupName = draft.name;
            draft.fieldKey = `radio:${draft.name}`;
            draft.exportValue = String(this.readProperty('exportValue') || 'Yes').trim() || 'Yes';
            draft.checked = Boolean(this.readProperty('checked'));
        } else if (draft.type === 'dropdown' || draft.type === 'optionlist') {
            draft.options = normalizeOptions(this.readProperty('options'));
            if (!draft.options.length) {
                return this.setPropertyError($L.get('pdfviewer.forms.optionsRequired'));
            }
            const selected = this.readProperty('defaultOption');
            draft.defaultValue = draft.options.includes(selected) ? selected : '';
        } else if (draft.type === 'button') {
            draft.label = this.readProperty('label') || $L.get('pdfviewer.forms.button');
            draft.action = this.readProperty('action') || 'none';
            draft.actionUrl = String(this.readProperty('actionUrl') || '').trim();
            draft.jsScript = this.readProperty('jsScript') || '';
            draft.targetFieldName = this.readProperty('targetFieldName') || '';
            draft.visibilityAction = this.readProperty('visibilityAction') || 'toggle';
            if (draft.action === 'url' && !/^https?:\/\//i.test(draft.actionUrl)) {
                return this.setPropertyError($L.get('pdfviewer.forms.invalidUrl'));
            }
            if (draft.action === 'js' && !draft.jsScript.trim()) {
                return this.setPropertyError($L.get('pdfviewer.forms.javascriptRequired'));
            }
            if (draft.action === 'showHide' && !draft.targetFieldName) {
                return this.setPropertyError($L.get('pdfviewer.forms.targetRequired'));
            }
        } else if (draft.type === 'date') {
            const value = this.readProperty('dateFormat');
            draft.dateFormat = value === 'custom' ? String(this.readProperty('customDateFormat') || '').trim() : value;
            if (!draft.dateFormat) {
                return this.setPropertyError($L.get('pdfviewer.forms.dateFormatRequired'));
            }
        } else if (draft.type === 'barcode') {
            draft.barcodeFormat = this.readProperty('barcodeFormat') || 'qrcode';
            draft.barcodeValue = String(this.readProperty('barcodeValue') || '').trim();
            if (!draft.barcodeValue) {
                return this.setPropertyError($L.get('pdfviewer.forms.barcodeRequired'));
            }
            try {
                const canvas = document.createElement('canvas');
                bwipjs.toCanvas(canvas, {
                    bcid: draft.barcodeFormat,
                    text: draft.barcodeValue,
                    scale: 3,
                    includetext: !['qrcode', 'datamatrix'].includes(draft.barcodeFormat)
                });
                draft.barcodePng = canvas.toDataURL('image/png');
            } catch (error) {
                return this.setPropertyError($L.get('pdfviewer.forms.invalidBarcode'));
            }
        }
        const affected = this.fields.filter(item => item.fieldKey === field.fieldKey);
        if (JSON.stringify(field) === JSON.stringify(draft)) return true;
        const shared = { ...draft };
        delete shared.id;
        delete shared.pageNumber;
        delete shared.rect;
        affected.forEach(item => Object.assign(item, shared));
        Object.assign(field, draft);
        if (draft.type === 'radio' && draft.checked) {
            this.fields.forEach(item => {
                if (item.type === 'radio' && item.id !== field.id && item.name === draft.name) item.checked = false;
            });
        }
        const pages = new Set(affected.concat(field).map(item => item.pageNumber));
        this.fields.filter(item => draft.type === 'radio' && item.name === draft.name).forEach(item => pages.add(item.pageNumber));
        pages.forEach(pageNumber => {
            const record = this.overlay.records.get(pageNumber);
            if (record) {
                void this.renderPageFields(record).then(() => {
                    if (this.editingFieldId !== field.id) return;
                    const object = record.canvas.getObjects().find(item => item.formsFieldId === field.id);
                    if (object) {
                        record.canvas.setActiveObject(object);
                        record.canvas.requestRenderAll();
                    }
                });
            }
        });
        this.emitChange(true);
        return true;
    }

    setPropertyError(message, nameError = false) {
        const error = this.propertiesRoot.querySelector('[data-property-error]');
        error.textContent = message;
        error.hidden = false;
        if (nameError) this.propertiesRoot.querySelector('[data-name-error]').textContent = message;
        return false;
    }

    clearPropertyError() {
        if (!this.propertiesRoot) return;
        const error = this.propertiesRoot.querySelector('[data-property-error]');
        error.textContent = '';
        error.hidden = true;
        this.propertiesRoot.querySelector('[data-name-error]').textContent = '';
    }

    destroyPropertiesPanel() {
        if (!this.propertiesPanel) return;
        this.clearPropertiesTimers();
        this.propertiesRoot.removeEventListener('input', this.handlePropertiesInput);
        this.propertiesRoot.removeEventListener('change', this.handlePropertiesInput);
        this.propertiesRoot.removeEventListener('submit', this.handlePropertiesSubmit);
        this.propertiesCloseButton.removeEventListener('click', this.handlePropertiesClose);
        this.propertiesDeleteButton.removeEventListener('click', this.handlePropertiesDelete);
        this.propertiesPanel.remove();
        this.propertiesPanel = null;
        this.propertiesRoot = null;
        this.propertiesCloseButton = null;
        this.propertiesDeleteButton = null;
        this.handlePropertiesInput = null;
        this.handlePropertiesSubmit = null;
        this.handlePropertiesClose = null;
        this.handlePropertiesDelete = null;
        this.editingFieldId = null;
    }

    destroy() {
        this.documentGeneration += 1;
        cancelAnimationFrame(this.rafId);
        this.setPanelOpen(false);
        if (this.button) this.button.removeEventListener('click', this.handleToggleClick);
        if (this.root) this.root.removeEventListener('click', this.handleToolbarClick);
        if (this.gridColumnsInput) this.gridColumnsInput.removeEventListener('change', this.handleGridChange);
        if (this.gridRowsInput) this.gridRowsInput.removeEventListener('change', this.handleGridChange);
        document.removeEventListener('keydown', this.handleDocumentKeyDown);
        this.changeCallbacks.clear();
        this.resetDocumentState();
        this.unregisterOverlay?.();
        this.destroyPropertiesPanel();
        if (this.root) this.root.remove();
        this.button = null;
        this.root = null;
        this.panelHtml = '';
        this.panelOpen = false;
        super.destroy();
    }
}
