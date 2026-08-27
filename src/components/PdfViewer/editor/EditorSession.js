import {
    Circle,
    Ellipse,
    FabricImage,
    FabricText,
    FixedLayout,
    Group,
    LayoutManager,
    Line,
    Polygon,
    Polyline,
    Rect,
    Triangle
} from 'fabric';
import { clamp, createId, escapeHtml } from '../utils';
import { createCloudPoints } from './geometry';

const sessions = new WeakMap();
const clone = value => JSON.parse(JSON.stringify(value));
const TOOL_CATEGORIES = {
    text: 'annotate', note: 'annotate', image: 'annotate', highlight: 'annotate',
    underline: 'annotate', strikeout: 'annotate', squiggly: 'annotate',
    rectangle: 'shapes', ellipse: 'shapes', line: 'shapes', arrow: 'shapes',
    polygon: 'shapes', polyline: 'shapes', cloud: 'shapes',
    pencil: 'draw', highlighter: 'draw'
};

const DEFAULT_STYLES = {
    annotate: { color: '#ef3e3e', fillColor: '#fff176', opacity: .45, strokeWidth: 2, fontSize: 20, alignment: 'left' },
    shapes: { color: '#ef3e3e', fillColor: 'transparent', opacity: 1, strokeWidth: 3, dash: 'solid', lineStart: 'none', lineEnd: 'none' },
    draw: { color: '#ef3e3e', fillColor: 'transparent', opacity: 1, strokeWidth: 4 }
};

function pointBounds(points) {
    const xs = points.map(point => point.x);
    const ys = points.map(point => point.y);
    return {
        left: Math.min(...xs), top: Math.min(...ys),
        width: Math.max(1, Math.max(...xs) - Math.min(...xs)),
        height: Math.max(1, Math.max(...ys) - Math.min(...ys))
    };
}

function normalizePoints(points, bounds) {
    return points.map(point => ({
        x: (point.x - bounds.left) / bounds.width,
        y: (point.y - bounds.top) / bounds.height
    }));
}

function dashArray(style) {
    if (style === 'dashed') return [10, 7];
    if (style === 'dotted') return [2, 6];
    return null;
}

function rgba(hex, opacity) {
    const value = /^#[0-9a-f]{6}$/i.test(hex || '') ? hex : '#000000';
    const channels = [1, 3, 5].map(index => parseInt(value.slice(index, index + 2), 16));
    return `rgba(${channels[0]},${channels[1]},${channels[2]},${clamp(Number(opacity), 0, 1)})`;
}

export function acquireEditorSession(viewer) {
    let entry = sessions.get(viewer);
    if (!entry) {
        entry = { session: new PdfEditorSession(viewer), references: 0 };
        sessions.set(viewer, entry);
    }
    entry.references += 1;
    return entry.session;
}

export function releaseEditorSession(viewer) {
    const entry = sessions.get(viewer);
    if (!entry) return;
    entry.references -= 1;
    if (entry.references <= 0) {
        entry.session.destroy();
        sessions.delete(viewer);
    }
}

export class PdfEditorSession {
    constructor(viewer) {
        this.viewer = viewer;
        this.items = [];
        this.overlay = viewer.pageOverlay;
        this.panels = new Map();
        this.toolControls = new Map();
        this.callbacks = new Set();
        this.undoStack = [];
        this.redoStack = [];
        this.activeTool = 'select';
        this.activePlugin = null;
        this.activePanel = null;
        this.selectedId = null;
        this.currentDocument = null;
        this.drag = null;
        this.textSelectionAnchor = null;
        this.polyPoints = [];
        this.pendingImage = null;
        this.counters = new Map();
        this.itemsViewRequested = false;
        this.propertyTimer = 0;
        this.keyHandler = event => this.onKeyDown(event);
        document.addEventListener('keydown', this.keyHandler);
        this.unregisterOverlay = this.overlay.registerOwner('editor', {
            cursor: () => this.activeTool === 'select' ? 'default' : 'crosshair',
            onToolCancel: () => this.cancelTool(false),
            onMouseDown: (record, options) => this.onCanvasDown(record, options),
            onMouseMove: (record, options) => this.onCanvasMove(record, options),
            onMouseUp: (record, options) => this.onCanvasUp(record, options),
            onDoubleClick: record => this.finishPolygon(record),
            onObjectMoving: (record, options) => this.keepInside(record, options.target),
            onObjectScaling: (record, options) => this.keepInside(record, options.target),
            onObjectRotating: (record, options) => this.keepInside(record, options.target),
            onObjectModified: (record, options) => this.onObjectModified(record, options.target),
            onSelected: (_record, object) => this.selectObject(object),
            onSelectionCleared: record => this.onSelectionCleared(record),
            onDelete: (_record, object) => this.deleteItem(object.editorItemId)
        });
        this.unsubscribeToolChange = this.overlay.onToolChange(() => this.updateToolButtons());
        this.createDrawer();
        this.selectTool('select', null);
    }

    createDrawer() {
        const host = this.viewer.container.querySelector('.pv-body');
        this.drawer = document.createElement('aside');
        this.drawer.className = 'pv-editor-drawer';
        this.drawer.hidden = true;
        this.drawer.innerHTML = `
            <header class="pv-editor-drawer-header">
                <div class="pv-editor-drawer-tabs">
                    <button type="button" data-editor-view="items">${escapeHtml($L.get('pdfviewer.editor.items'))}</button>
                    <button type="button" data-editor-view="properties">${escapeHtml($L.get('pdfviewer.editor.properties'))}</button>
                </div>
                <button class="pv-editor-drawer-close" type="button" data-editor-close aria-label="${escapeHtml($L.get('pdfviewer.editor.close'))}">×</button>
            </header>
            <div class="pv-editor-drawer-body" data-editor-drawer-body></div>`;
        host.appendChild(this.drawer);
        this.drawerBody = this.drawer.querySelector('[data-editor-drawer-body]');
        this.drawer.addEventListener('click', event => this.onDrawerClick(event));
        this.drawer.addEventListener('input', event => this.onDrawerInput(event));
        this.drawer.addEventListener('change', event => this.onDrawerInput(event, true));
    }

    registerPanel(id, button, panel) {
        this.panels.set(id, { button, panel });
    }

    unregisterPanel(id) {
        this.panels.delete(id);
    }

    registerToolControl(button, tool) {
        if (!button) return;
        this.toolControls.set(button, tool);
        this.updateToolButtons();
    }

    unregisterToolControl(button) {
        if (button) this.toolControls.delete(button);
    }

    togglePanel(id) {
        const entry = this.panels.get(id);
        if (!entry) return;
        const open = this.activePanel !== id;
        this.panels.forEach((value, key) => {
            value.panel.hidden = !open || key !== id;
            value.button.classList.toggle('pv-active', open && key === id);
            value.button.setAttribute('aria-expanded', String(open && key === id));
        });
        this.activePanel = open ? id : null;
        if (open) this.selectTool('select', id);
    }

    closePanels() {
        this.panels.forEach(value => {
            value.panel.hidden = true;
            value.button.classList.remove('pv-active');
            value.button.setAttribute('aria-expanded', 'false');
        });
        this.activePanel = null;
    }

    selectTool(tool, pluginId) {
        if (tool === 'undo') return this.undo();
        if (tool === 'redo') return this.redo();
        this.activeTool = tool || 'select';
        this.activePlugin = pluginId || TOOL_CATEGORIES[tool] || null;
        this.drag = null;
        this.textSelectionAnchor = null;
        this.polyPoints = [];
        this.overlay.activateTool('editor');
        this.updateCanvasModes();
        this.updateToolButtons();
    }

    cancelTool(updateOverlay = true) {
        this.activeTool = 'select';
        this.drag = null;
        this.textSelectionAnchor = null;
        this.polyPoints = [];
        this.pendingImage = null;
        this.overlay.records.forEach(record => this.clearTemporary(record));
        if (updateOverlay) this.overlay.activateTool('editor');
        this.updateCanvasModes();
        this.updateToolButtons();
    }

    setPendingImage(image) {
        this.pendingImage = image;
        this.selectTool('image', 'annotate');
    }

    updateToolButtons() {
        this.toolControls.forEach((tool, button) => {
            const active = tool === 'select'
                ? this.activeTool === 'select' && this.overlay.isToolActive('editor')
                : this.overlay.isToolActive('editor') && tool === this.activeTool;
            button.classList.toggle('pv-active', active);
            button.setAttribute('aria-pressed', String(active));
        });
        this.panels.forEach(value => {
            value.panel.querySelectorAll('[data-editor-tool]').forEach(button => {
                button.classList.toggle('pv-active', button.dataset.editorTool === this.activeTool);
                button.setAttribute('aria-pressed', String(button.dataset.editorTool === this.activeTool));
            });
            const undo = value.panel.querySelector('[data-editor-command="undo"]');
            const redo = value.panel.querySelector('[data-editor-command="redo"]');
            if (undo) undo.disabled = !this.undoStack.length;
            if (redo) redo.disabled = !this.redoStack.length;
        });
    }

    handleDocumentLoad(payload) {
        if (this.currentDocument === payload.pdf) return;
        this.reset();
        this.currentDocument = payload.pdf;
    }

    handleDocumentDestroy(payload) {
        if (!this.currentDocument) return;
        if (this.currentDocument && payload.pdf && this.currentDocument !== payload.pdf) return;
        this.reset();
        this.currentDocument = null;
    }

    handlePageRendered({ pageNumber, item, viewport }) {
        void this.attachPage(pageNumber, item, viewport);
    }

    handleScaleChange() {
        window.cancelAnimationFrame(this.scaleFrame);
        this.scaleFrame = window.requestAnimationFrame(() => {
            this.overlay.records.forEach((_record, pageNumber) => {
                const item = this.viewer.getPageItem(pageNumber);
                if (item && item.renderedKey) void this.attachRenderedPage(pageNumber, item);
            });
        });
    }

    async attachRenderedPage(pageNumber, item) {
        if (!this.viewer.pdf) return;
        const page = await this.viewer.pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: this.viewer.scale, rotation: this.viewer.getPageRotation(page) });
        await this.attachPage(pageNumber, item, viewport);
    }

    async attachPage(pageNumber, item, viewport) {
        const record = this.overlay.attach(pageNumber, item, viewport);
        if (!record) return;
        this.updateCanvasMode(record);
        if (record.editorAttachKey === record.key) return;
        record.editorAttachKey = record.key;
        await this.renderPage(record);
    }

    updateCanvasModes() {
        this.overlay.records.forEach(record => this.updateCanvasMode(record));
    }

    updateCanvasMode(record) {
        record.canvas.selection = this.activeTool !== 'select';
        record.canvas.getObjects().forEach(object => {
            if (object.pvOwner !== 'editor' || object.editorTemporary) return;
            object.selectable = true;
            object.evented = true;
        });
        record.canvas.requestRenderAll();
    }

    onSelectionCleared(record) {
        if (record.editorSuppressSelection) return;
        this.selectedId = null;
        if (this.itemsViewRequested) this.openItems();
        else this.closeDrawer();
    }

    screenRectToPdf(record, rect) {
        const points = [
            record.viewport.convertToPdfPoint(rect.left, rect.top),
            record.viewport.convertToPdfPoint(rect.left + rect.width, rect.top),
            record.viewport.convertToPdfPoint(rect.left, rect.top + rect.height),
            record.viewport.convertToPdfPoint(rect.left + rect.width, rect.top + rect.height)
        ].map(([x, y]) => ({ x, y }));
        const bounds = pointBounds(points);
        return { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height };
    }

    pdfRectToScreen(record, rect) {
        const points = [
            record.viewport.convertToViewportPoint(rect.x, rect.y),
            record.viewport.convertToViewportPoint(rect.x + rect.width, rect.y),
            record.viewport.convertToViewportPoint(rect.x, rect.y + rect.height),
            record.viewport.convertToViewportPoint(rect.x + rect.width, rect.y + rect.height)
        ].map(([x, y]) => ({ x, y }));
        return pointBounds(points);
    }

    getPoint(record, event) {
        return record.canvas.getScenePoint(event);
    }

    getClientPoint(event) {
        const source = event?.touches?.[0] || event?.changedTouches?.[0] || event;
        const clientX = Number(source?.clientX);
        const clientY = Number(source?.clientY);
        return Number.isFinite(clientX) && Number.isFinite(clientY) ? { clientX, clientY } : null;
    }

    beginTextSelection(event) {
        const point = this.getClientPoint(event);
        if (!point) return false;
        const caret = this.overlay.getTextCaretAtPoint(point.clientX, point.clientY);
        if (!caret) return false;
        this.textSelectionAnchor = caret;
        this.setTextSelection(caret);
        event?.preventDefault?.();
        return true;
    }

    updateTextSelection(event) {
        if (!this.textSelectionAnchor) return false;
        const point = this.getClientPoint(event);
        if (!point) return true;
        const caret = this.overlay.getTextCaretAtPoint(point.clientX, point.clientY);
        if (caret) this.setTextSelection(caret);
        event?.preventDefault?.();
        return true;
    }

    setTextSelection(focus) {
        const anchor = this.textSelectionAnchor;
        const selection = window.getSelection();
        if (!anchor?.node?.isConnected || !focus?.node?.isConnected || !selection) return;
        try {
            if (typeof selection.setBaseAndExtent === 'function') {
                selection.setBaseAndExtent(anchor.node, anchor.offset, focus.node, focus.offset);
                return;
            }
            selection.removeAllRanges();
            const range = document.createRange();
            range.setStart(anchor.node, anchor.offset);
            range.collapse(true);
            selection.addRange(range);
            selection.extend?.(focus.node, focus.offset);
        } catch (_error) {
            this.textSelectionAnchor = null;
        }
    }

    onCanvasDown(record, options) {
        if (options.target) {
            this.textSelectionAnchor = null;
            window.getSelection()?.removeAllRanges();
            if (options.target.pvOwner === 'editor') {
                this.pendingTransform = clone(this.items);
                this.selectObject(options.target);
            }
            return;
        }
        if (this.activeTool === 'select') {
            this.beginTextSelection(options.e);
            return;
        }
        const point = this.getPoint(record, options.e);
        if (this.activeTool === 'text' || this.activeTool === 'note' || this.activeTool === 'image') {
            void this.addPointItem(record, point);
            return;
        }
        if (this.activeTool === 'polygon' || this.activeTool === 'polyline') {
            this.polyPoints.push(point);
            this.renderPolygonPreview(record);
            return;
        }
        if (this.activeTool === 'eraser') {
            this.eraseAt(record, point);
            this.drag = { record, erasing: true };
            return;
        }
        this.drag = { record, start: point, points: [point] };
    }

    onCanvasMove(record, options) {
        if (this.updateTextSelection(options.e)) {
            record.canvas.setCursor('text');
            return;
        }
        if (this.activeTool === 'select' && !options.target) {
            const clientPoint = this.getClientPoint(options.e);
            const caret = clientPoint
                ? this.overlay.getTextCaretAtPoint(clientPoint.clientX, clientPoint.clientY)
                : null;
            record.canvas.setCursor(caret?.directTextHit ? 'text' : 'default');
        }
        const point = this.getPoint(record, options.e);
        if (!this.drag || this.drag.record !== record) {
            if (['polygon', 'polyline'].includes(this.activeTool) && this.polyPoints.length) {
                this.renderPolygonPreview(record, point);
            }
            return;
        }
        if (this.drag.erasing) return this.eraseAt(record, point);
        if (this.activeTool === 'pencil' || this.activeTool === 'highlighter') {
            this.drag.points.push(point);
            return this.renderStrokePreview(record, this.drag.points);
        }
        this.renderDragPreview(record, this.drag.start, point);
    }

    onCanvasUp(record, options) {
        if (this.textSelectionAnchor) {
            this.updateTextSelection(options.e);
            this.textSelectionAnchor = null;
            return;
        }
        if (!this.drag || this.drag.record !== record) return;
        const drag = this.drag;
        this.drag = null;
        if (drag.erasing) return;
        const point = this.getPoint(record, options.e);
        if (this.activeTool === 'pencil' || this.activeTool === 'highlighter') {
            if (drag.points.length > 1) this.addPathItem(record, drag.points);
        } else {
            this.addDragItem(record, drag.start, point);
        }
        this.clearTemporary(record);
    }

    clearTemporary(record) {
        if (record.editorTemporary) record.canvas.remove(record.editorTemporary);
        record.editorTemporary = null;
        record.canvas.requestRenderAll();
    }

    renderDragPreview(record, start, end) {
        this.clearTemporary(record);
        const bounds = pointBounds([start, end]);
        const style = this.getStyle(this.activeTool);
        const temporary = { selectable: false, evented: false, editorTemporary: true };
        const shape = {
            left: bounds.left,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height,
            originX: 'left',
            originY: 'top',
            fill: style.fillColor === 'transparent' ? 'transparent' : style.fillColor,
            stroke: style.color,
            strokeWidth: style.strokeWidth,
            strokeDashArray: dashArray(style.dash),
            opacity: style.opacity,
            ...temporary
        };
        if (this.activeTool === 'ellipse') {
            record.editorTemporary = new Ellipse({
                left: bounds.left,
                top: bounds.top,
                rx: bounds.width / 2,
                ry: bounds.height / 2,
                originX: 'left',
                originY: 'top',
                fill: shape.fill,
                stroke: shape.stroke,
                strokeWidth: shape.strokeWidth,
                strokeUniform: true,
                strokeDashArray: shape.strokeDashArray,
                opacity: shape.opacity,
                ...temporary
            });
        } else if (this.activeTool === 'cloud') {
            record.editorTemporary = new Polygon(createCloudPoints(bounds.width, bounds.height, bounds.left, bounds.top), {
                originX: 'left',
                originY: 'top',
                fill: shape.fill,
                stroke: shape.stroke,
                strokeWidth: shape.strokeWidth,
                strokeDashArray: shape.strokeDashArray,
                opacity: shape.opacity,
                ...temporary
            });
        } else if (this.activeTool === 'line' || this.activeTool === 'arrow') {
            const line = new Line([start.x, start.y, end.x, end.y], { stroke: style.color, strokeWidth: style.strokeWidth, strokeDashArray: dashArray(style.dash), opacity: style.opacity, ...temporary });
            if (this.activeTool === 'line') record.editorTemporary = line;
            else {
                const arrow = new Triangle({
                    left: end.x,
                    top: end.y,
                    width: 13,
                    height: 15,
                    fill: style.color,
                    angle: Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI + 90,
                    originX: 'center',
                    originY: 'center',
                    ...temporary
                });
                record.editorTemporary = new Group([line, arrow], { ...temporary });
            }
        } else {
            record.editorTemporary = new Rect(shape);
        }
        this.overlay.addObject('editor', record.pageNumber, record.editorTemporary, { kind: 'temporary', zIndex: 35 });
    }

    renderStrokePreview(record, points) {
        this.clearTemporary(record);
        const style = this.getStyle(this.activeTool);
        record.editorTemporary = new Polyline(points, { fill: 'transparent', stroke: style.color, strokeWidth: style.strokeWidth, opacity: this.activeTool === 'highlighter' ? .3 : style.opacity, selectable: false, evented: false, editorTemporary: true, strokeLineCap: 'round', strokeLineJoin: 'round' });
        this.overlay.addObject('editor', record.pageNumber, record.editorTemporary, { kind: 'temporary', zIndex: 35 });
    }

    renderPolygonPreview(record, hoverPoint = null) {
        this.clearTemporary(record);
        if (!this.polyPoints.length) return;
        const style = this.getStyle(this.activeTool);
        const points = hoverPoint ? [...this.polyPoints, hoverPoint] : this.polyPoints;
        record.editorTemporary = new Polyline(points, { fill: 'transparent', stroke: style.color, strokeWidth: style.strokeWidth, strokeDashArray: dashArray(style.dash), opacity: style.opacity, selectable: false, evented: false, editorTemporary: true });
        this.overlay.addObject('editor', record.pageNumber, record.editorTemporary, { kind: 'temporary', zIndex: 35 });
    }

    finishPolygon(record) {
        if (!['polygon', 'polyline'].includes(this.activeTool) || this.polyPoints.length < 2) return;
        if (this.activeTool === 'polygon' && this.polyPoints.length < 3) return;
        const points = this.polyPoints.splice(0);
        this.clearTemporary(record);
        this.addPathItem(record, points, this.activeTool);
    }

    getStyle(tool) {
        const category = TOOL_CATEGORIES[tool] || this.activePlugin || 'annotate';
        return { ...DEFAULT_STYLES[category] };
    }

    nextName(type) {
        const count = (this.counters.get(type) || 0) + 1;
        this.counters.set(type, count);
        return `${$L.get(`pdfviewer.editor.types.${type}`)} ${count}`;
    }

    baseItem(type, pageNumber, rect) {
        const style = this.getStyle(type);
        if (['text', 'note', 'image', 'underline', 'strikeout', 'squiggly'].includes(type)) style.opacity = 1;
        if (type === 'highlighter') style.opacity = .3;
        if (type === 'highlight') style.opacity = .35;
        if (type === 'arrow') style.lineEnd = 'arrow';
        return { id: `edit-${createId()}`, type, category: TOOL_CATEGORIES[type], pageNumber, name: this.nextName(type), visible: true, createdAt: Date.now(), rect, angle: 0, style };
    }

    async addPointItem(record, point) {
        let width = this.activeTool === 'note' ? 190 : 180;
        let height = this.activeTool === 'note' ? 110 : 48;
        if (this.activeTool === 'image' && !this.pendingImage) return;
        if (this.activeTool === 'image') {
            const ratio = this.pendingImage.width / Math.max(1, this.pendingImage.height);
            width = Math.min(220, record.canvas.width * .35);
            height = width / ratio;
            if (height > 150) { height = 150; width = height * ratio; }
        }
        const screen = { left: point.x - width / 2, top: point.y - height / 2, width, height };
        const item = this.baseItem(this.activeTool, record.pageNumber, this.screenRectToPdf(record, screen));
        if (item.type === 'text') item.data = { text: $L.get('pdfviewer.editor.defaultText') };
        if (item.type === 'note') item.data = { text: $L.get('pdfviewer.editor.defaultNote') };
        if (item.type === 'image') {
            item.data = { url: this.pendingImage.url, mimeType: this.pendingImage.mimeType };
        }
        this.addItem(item);
    }

    addDragItem(record, start, end) {
        const bounds = pointBounds([start, end]);
        if (bounds.width < 4 || bounds.height < 4) return;
        const item = this.baseItem(this.activeTool, record.pageNumber, this.screenRectToPdf(record, bounds));
        if (['line', 'arrow'].includes(item.type)) item.data = { points: normalizePoints([start, end], bounds) };
        if (['highlight', 'underline', 'strikeout', 'squiggly'].includes(item.type)) {
            item.data = { rects: this.getTextAwareRects(record, bounds).map(rect => ({
                x: (rect.left - bounds.left) / bounds.width,
                y: (rect.top - bounds.top) / bounds.height,
                width: rect.width / bounds.width,
                height: rect.height / bounds.height
            })) };
            if (!item.data.rects.length) item.data.rects = [{ x: 0, y: 0, width: 1, height: 1 }];
        }
        this.addItem(item);
    }

    getTextAwareRects(record, bounds) {
        const pageItem = this.viewer.getPageItem(record.pageNumber);
        if (!pageItem || !pageItem.textLayer) return [];
        const layerRect = record.layer.getBoundingClientRect();
        const selected = [];
        pageItem.textLayer.querySelectorAll('span').forEach(span => {
            const rect = span.getBoundingClientRect();
            const local = { left: rect.left - layerRect.left, top: rect.top - layerRect.top, width: rect.width, height: rect.height };
            if (local.left < bounds.left + bounds.width && local.left + local.width > bounds.left
                && local.top < bounds.top + bounds.height && local.top + local.height > bounds.top) selected.push(local);
        });
        return selected;
    }

    addPathItem(record, points, forcedType = null) {
        const type = forcedType || this.activeTool;
        const bounds = pointBounds(points);
        const item = this.baseItem(type, record.pageNumber, this.screenRectToPdf(record, bounds));
        item.data = { points: normalizePoints(points, bounds) };
        this.addItem(item);
    }

    eraseAt(record, point) {
        const radius = 12;
        const snapshot = clone(this.items);
        let changed = false;
        const additions = [];
        this.items = this.items.filter(item => {
            if (item.pageNumber !== record.pageNumber || !['pencil', 'highlighter'].includes(item.type)) return true;
            const screen = this.pdfRectToScreen(record, item.rect);
            const points = (item.data.points || []).map(value => ({ x: screen.left + value.x * screen.width, y: screen.top + value.y * screen.height }));
            const segments = [];
            let segment = [];
            points.forEach(value => {
                if (Math.hypot(value.x - point.x, value.y - point.y) <= radius) {
                    if (segment.length > 1) segments.push(segment);
                    segment = [];
                    changed = true;
                } else segment.push(value);
            });
            if (segment.length > 1) segments.push(segment);
            if (!changed || segments.length === 1 && segments[0].length === points.length) return true;
            segments.forEach(values => {
                const bounds = pointBounds(values);
                additions.push({ ...clone(item), id: `edit-${createId()}`, rect: this.screenRectToPdf(record, bounds), data: { points: normalizePoints(values, bounds) } });
            });
            return false;
        });
        if (changed) {
            this.items.push(...additions);
            this.pushHistory(snapshot);
            void this.renderPage(record);
            this.emitChange();
        }
    }

    addItem(item) {
        const before = clone(this.items);
        this.items.push(item);
        this.pushHistory(before);
        this.selectedId = item.id;
        this.selectTool('select', item.category);
        const record = this.overlay.records.get(item.pageNumber);
        if (record) void this.renderPage(record, item.id);
        this.openProperties(item.id);
        this.emitChange();
    }

    async renderPage(record, selectId = null) {
        if (!record.viewport) return;
        const generation = (record.editorRendering || 0) + 1;
        record.editorRendering = generation;
        const restoreId = selectId || this.selectedId;
        record.editorSuppressSelection = true;
        try {
            record.editorTemporary = null;
            this.overlay.removeOwnerObjects('editor', record.pageNumber);
            for (const item of this.items.filter(value => value.pageNumber === record.pageNumber && value.visible)) {
                const object = await this.createObject(record, item);
                if (generation !== record.editorRendering) return;
                this.overlay.addObject('editor', record.pageNumber, object, { id: item.id, kind: item.type, zIndex: 30 });
                if (item.id === restoreId) record.canvas.setActiveObject(object);
            }
        } finally {
            record.editorSuppressSelection = false;
        }
        record.canvas.requestRenderAll();
        this.updateCanvasModes();
    }

    async createObject(record, item) {
        const screen = this.pdfRectToScreen(record, item.rect);
        const width = Math.max(8, screen.width);
        const height = Math.max(8, screen.height);
        const style = item.style || {};
        const common = { originX: 'left', originY: 'top', selectable: false, evented: false };
        const children = [];
        const addTerminator = (point, other, type) => {
            if (!type || type === 'none') return;
            const marker = { ...common, left: point.x, top: point.y, fill: style.color, opacity: style.opacity, originX: 'center', originY: 'center' };
            if (type === 'circle') return children.push(new Circle({ ...marker, radius: 5 }));
            if (type === 'square') return children.push(new Rect({ ...marker, width: 9, height: 9 }));
            children.push(new Triangle({ ...marker, width: 13, height: 15, angle: Math.atan2(point.y - other.y, point.x - other.x) * 180 / Math.PI + 90 }));
        };
        if (item.type === 'text' || item.type === 'note') {
            if (item.type === 'note') children.push(new Rect({ left: 0, top: 0, width, height, fill: rgba(style.fillColor || '#fff176', style.opacity), stroke: style.color, strokeWidth: 1, ...common }));
            children.push(new FabricText(item.data.text || '', { left: 6, top: 6, fontSize: Math.max(10, style.fontSize || 20) * record.viewport.scale, fill: style.color || '#000000', opacity: style.opacity, fontFamily: 'Arial, sans-serif', textAlign: style.alignment || 'left', ...common }));
        } else if (item.type === 'image') {
            const image = await FabricImage.fromURL(item.data.url);
            const scale = Math.min(width / Math.max(1, image.width), height / Math.max(1, image.height));
            image.set({ left: (width - image.width * scale) / 2, top: (height - image.height * scale) / 2, scaleX: scale, scaleY: scale, opacity: style.opacity, ...common });
            children.push(image);
        } else if (['highlight', 'underline', 'strikeout', 'squiggly'].includes(item.type)) {
            (item.data.rects || []).forEach(rect => {
                const left = rect.x * width, top = rect.y * height, rectWidth = rect.width * width, rectHeight = rect.height * height;
                if (item.type === 'highlight') children.push(new Rect({ left, top, width: rectWidth, height: rectHeight, fill: rgba(style.fillColor || style.color, style.opacity), ...common }));
                else if (item.type === 'squiggly') {
                    const points = [];
                    for (let x = 0; x <= rectWidth; x += 4) points.push({ x: left + x, y: top + rectHeight - 2 + (Math.floor(x / 4) % 2 ? -3 : 0) });
                    children.push(new Polyline(points, { fill: 'transparent', stroke: style.color, strokeWidth: style.strokeWidth || 2, ...common }));
                } else {
                    const y = item.type === 'underline' ? top + rectHeight - 2 : top + rectHeight * .52;
                    children.push(new Line([left, y, left + rectWidth, y], { stroke: style.color, strokeWidth: style.strokeWidth || 2, ...common }));
                }
            });
        } else if (item.type === 'rectangle' || item.type === 'cloud') {
            const options = { fill: style.fillColor === 'transparent' ? 'transparent' : style.fillColor, stroke: style.color, strokeWidth: style.strokeWidth, strokeUniform: true, strokeDashArray: dashArray(style.dash), opacity: style.opacity, ...common };
            if (item.type === 'cloud') {
                children.push(new Polygon(createCloudPoints(width, height), options));
            } else children.push(new Rect({ left: 0, top: 0, width, height, ...options }));
        } else if (item.type === 'ellipse') {
            children.push(new Ellipse({ left: 0, top: 0, rx: width / 2, ry: height / 2, fill: style.fillColor === 'transparent' ? 'transparent' : style.fillColor, stroke: style.color, strokeWidth: style.strokeWidth, strokeUniform: true, strokeDashArray: dashArray(style.dash), opacity: style.opacity, ...common }));
        } else if (['line', 'arrow'].includes(item.type)) {
            const points = item.data?.points || [{ x: 0, y: 1 }, { x: 1, y: 0 }];
            const start = { x: points[0].x * width, y: points[0].y * height };
            const end = { x: points[1].x * width, y: points[1].y * height };
            children.push(new Line([start.x, start.y, end.x, end.y], { stroke: style.color, strokeWidth: style.strokeWidth, strokeUniform: true, strokeDashArray: dashArray(style.dash), opacity: style.opacity, ...common }));
            addTerminator(start, end, style.lineStart);
            addTerminator(end, start, item.type === 'arrow' && style.lineEnd == null ? 'arrow' : style.lineEnd);
        } else if (['polygon', 'polyline', 'pencil', 'highlighter'].includes(item.type)) {
            const points = (item.data.points || []).map(point => ({ x: point.x * width, y: point.y * height }));
            const Constructor = item.type === 'polygon' ? Polygon : Polyline;
            children.push(new Constructor(points, { fill: item.type === 'polygon' && style.fillColor !== 'transparent' ? style.fillColor : 'transparent', stroke: style.color, strokeWidth: style.strokeWidth, strokeUniform: true, strokeDashArray: dashArray(style.dash), opacity: item.type === 'highlighter' ? .3 : style.opacity, strokeLineCap: 'round', strokeLineJoin: 'round', ...common }));
            if (item.type === 'polyline' && points.length > 1) {
                addTerminator(points[0], points[1], style.lineStart);
                addTerminator(points[points.length - 1], points[points.length - 2], style.lineEnd);
            }
        }
        if (!children.length) children.push(new Rect({ left: 0, top: 0, width, height, fill: 'transparent', stroke: style.color, ...common }));
        const group = new Group(children, {
            left: screen.left + width / 2,
            top: screen.top + height / 2,
            width,
            height,
            originX: 'center', originY: 'center',
            layoutManager: new LayoutManager(new FixedLayout()),
            angle: record.viewport.rotation - (item.angle || 0),
            editorItemId: item.id,
            cornerColor: '#116bff', cornerStyle: 'circle', borderColor: '#116bff', transparentCorners: false,
            lockScalingFlip: true, minScaleLimit: .05
        });
        return group;
    }

    keepInside(record, object) {
        if (!object) return;
        const box = object.getBoundingRect();
        if (box.left < 0) object.left -= box.left;
        if (box.top < 0) object.top -= box.top;
        if (box.left + box.width > record.canvas.width) object.left -= box.left + box.width - record.canvas.width;
        if (box.top + box.height > record.canvas.height) object.top -= box.top + box.height - record.canvas.height;
    }

    onObjectModified(record, object) {
        const item = this.getItem(object && object.editorItemId);
        if (!item || !record.viewport) return;
        const center = object.getCenterPoint();
        const [pdfX, pdfY] = record.viewport.convertToPdfPoint(center.x, center.y);
        const width = object.width * Math.abs(object.scaleX) / record.viewport.scale;
        const height = object.height * Math.abs(object.scaleY) / record.viewport.scale;
        item.rect = { x: pdfX - width / 2, y: pdfY - height / 2, width, height };
        item.angle = record.viewport.rotation - (object.angle || 0);
        if (this.pendingTransform) this.pushHistory(this.pendingTransform);
        this.pendingTransform = null;
        this.emitChange();
        this.renderDrawer();
    }

    selectObject(object) {
        if (!object || !object.editorItemId) return;
        this.selectedId = object.editorItemId;
        this.openProperties(this.selectedId);
    }

    getItem(id) { return this.items.find(item => item.id === id) || null; }
    getItems(category = null) { return clone(category ? this.items.filter(item => item.category === category) : this.items); }
    getEditData() { return { items: this.getItems() }; }
    hasExportableItems() { return this.items.some(item => item.visible); }

    updateItem(id, changes, push = true) {
        const item = this.getItem(id);
        if (!item) return false;
        const before = clone(this.items);
        Object.assign(item, changes);
        if (push) this.pushHistory(before);
        const record = this.overlay.records.get(item.pageNumber);
        if (record) void this.renderPage(record, id);
        this.emitChange();
        return true;
    }

    deleteItem(id) {
        const item = this.getItem(id);
        if (!item) return false;
        const before = clone(this.items);
        this.items = this.items.filter(value => value.id !== id);
        this.pushHistory(before);
        if (this.selectedId === id) this.selectedId = null;
        const record = this.overlay.records.get(item.pageNumber);
        if (record) void this.renderPage(record);
        this.openItems();
        this.emitChange();
        return true;
    }

    duplicateItem(id) {
        const item = this.getItem(id);
        if (!item) return null;
        const copy = clone(item);
        copy.id = `edit-${createId()}`;
        copy.name = `${item.name} ${$L.get('pdfviewer.editor.copy')}`;
        copy.createdAt = Date.now();
        copy.rect.x += 12;
        copy.rect.y -= 12;
        this.addItem(copy);
        return copy.id;
    }

    clearItems(category = null) {
        const before = clone(this.items);
        const pages = new Set(this.items.filter(item => !category || item.category === category).map(item => item.pageNumber));
        this.items = category ? this.items.filter(item => item.category !== category) : [];
        if (before.length === this.items.length) return;
        this.pushHistory(before);
        pages.forEach(page => { const record = this.overlay.records.get(page); if (record) void this.renderPage(record); });
        this.selectedId = null;
        this.openItems();
        this.emitChange();
    }

    selectItem(id) {
        const item = this.getItem(id);
        if (!item) return false;
        this.selectTool('select', null);
        this.viewer.goToPage(item.pageNumber);
        this.selectedId = id;
        const record = this.overlay.records.get(item.pageNumber);
        if (record) {
            const object = record.canvas.getObjects().find(value => value.editorItemId === id);
            if (object) record.canvas.setActiveObject(object);
            record.canvas.requestRenderAll();
        }
        return true;
    }

    pushHistory(before) {
        this.undoStack.push(before);
        if (this.undoStack.length > 100) this.undoStack.shift();
        this.redoStack = [];
        this.updateToolButtons();
    }

    undo() {
        if (!this.undoStack.length) return;
        this.redoStack.push(clone(this.items));
        this.items = this.undoStack.pop();
        this.refreshAll();
    }

    redo() {
        if (!this.redoStack.length) return;
        this.undoStack.push(clone(this.items));
        this.items = this.redoStack.pop();
        this.refreshAll();
    }

    refreshAll() {
        this.overlay.records.forEach(record => void this.renderPage(record));
        this.selectedId = null;
        this.renderDrawer();
        this.updateToolButtons();
        this.emitChange();
    }

    onChange(callback) {
        if (typeof callback !== 'function') return () => {};
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    emitChange(refreshDrawer = true) {
        const data = this.getEditData();
        this.callbacks.forEach(callback => callback(data));
        if (this.viewer) this.viewer.updateToolbar();
        if (refreshDrawer) this.renderDrawer();
    }

    openItems() {
        this.itemsViewRequested = true;
        this.drawer.hidden = false;
        this.drawer.dataset.view = 'items';
        this.renderItems();
    }

    openProperties(id) {
        if (id) this.selectedId = id;
        if (!this.getItem(this.selectedId)) return;
        this.drawer.hidden = false;
        this.drawer.dataset.view = 'properties';
        this.renderProperties();
    }

    closeDrawer() {
        this.drawer.hidden = true;
        this.itemsViewRequested = false;
    }

    renderDrawer() {
        if (!this.drawer || this.drawer.hidden) return;
        if (this.drawer.dataset.view === 'items') this.renderItems();
        else this.renderProperties();
    }

    renderItems() {
        const query = this.itemQuery || '';
        const filtered = this.items.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
        const groups = new Map();
        filtered.forEach(item => { if (!groups.has(item.pageNumber)) groups.set(item.pageNumber, []); groups.get(item.pageNumber).push(item); });
        this.drawerBody.innerHTML = `
            <div class="pv-editor-items-actions">
                <input type="search" data-editor-search value="${escapeHtml(query)}" placeholder="${escapeHtml($L.get('pdfviewer.editor.searchItems'))}">
                <button type="button" data-editor-action="clear">${escapeHtml($L.get('pdfviewer.editor.clearAll'))}</button>
            </div>
            ${groups.size ? Array.from(groups).sort((a,b) => a[0]-b[0]).map(([page, items]) => `
                <section class="pv-editor-items-page"><h4>${escapeHtml($L.get('pdfviewer.editor.page'))} ${page}<span>${items.length}</span></h4>
                ${items.map(item => `<article class="pv-editor-item${item.visible ? '' : ' pv-hidden'}" data-editor-item="${item.id}">
                    <button class="pv-editor-item-main" type="button" data-editor-action="select" data-id="${item.id}">
                        <span class="pv-editor-item-type">${escapeHtml($L.get(`pdfviewer.editor.types.${item.type}`))}</span>
                        <strong>${escapeHtml(item.name)}</strong><small>${new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </button>
                    <div class="pv-editor-item-actions">
                        <button type="button" data-editor-action="properties" data-id="${item.id}" title="${escapeHtml($L.get('pdfviewer.editor.properties'))}">⚙</button>
                        <button type="button" data-editor-action="duplicate" data-id="${item.id}" title="${escapeHtml($L.get('pdfviewer.editor.duplicate'))}">⧉</button>
                        <button type="button" data-editor-action="visibility" data-id="${item.id}" title="${escapeHtml($L.get('pdfviewer.editor.visibility'))}">${item.visible ? '◉' : '○'}</button>
                        <button type="button" data-editor-action="delete" data-id="${item.id}" title="${escapeHtml($L.get('pdfviewer.editor.delete'))}">×</button>
                    </div></article>`).join('')}</section>`).join('') : `<p class="pv-editor-empty">${escapeHtml($L.get('pdfviewer.editor.noItems'))}</p>`}`;
        this.updateDrawerTabs();
    }

    renderProperties() {
        const item = this.getItem(this.selectedId);
        if (!item) return this.openItems();
        const style = item.style || {};
        let specific = '';
        if (['text', 'note'].includes(item.type)) specific = `
            <label><span>${escapeHtml($L.get('pdfviewer.editor.text'))}</span><textarea data-editor-prop="text">${escapeHtml(item.data.text || '')}</textarea></label>
            <label><span>${escapeHtml($L.get('pdfviewer.editor.fontSize'))}</span><input type="number" min="8" max="96" data-editor-style="fontSize" value="${style.fontSize || 20}"></label>
            <label><span>${escapeHtml($L.get('pdfviewer.editor.alignment'))}</span><select data-editor-style="alignment"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>`;
        if (['rectangle', 'ellipse', 'polygon', 'cloud'].includes(item.type)) specific += `
            <label><span>${escapeHtml($L.get('pdfviewer.editor.fillColor'))}</span><input type="color" data-editor-style="fillColor" value="${style.fillColor === 'transparent' ? '#ffffff' : style.fillColor}"></label>
            <label class="pv-editor-check"><input type="checkbox" data-editor-transparent ${style.fillColor === 'transparent' ? 'checked' : ''}><span>${escapeHtml($L.get('pdfviewer.editor.transparentFill'))}</span></label>`;
        if (item.category === 'shapes') specific += `
            <label><span>${escapeHtml($L.get('pdfviewer.editor.borderStyle'))}</span><select data-editor-style="dash"><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option></select></label>`;
        if (['line', 'arrow', 'polyline'].includes(item.type)) specific += `
            <label><span>${escapeHtml($L.get('pdfviewer.editor.lineStart'))}</span><select data-editor-style="lineStart"><option value="none">None</option><option value="arrow">Arrow</option><option value="circle">Circle</option><option value="square">Square</option></select></label>
            <label><span>${escapeHtml($L.get('pdfviewer.editor.lineEnd'))}</span><select data-editor-style="lineEnd"><option value="none">None</option><option value="arrow">Arrow</option><option value="circle">Circle</option><option value="square">Square</option></select></label>`;
        this.drawerBody.innerHTML = `<form class="pv-editor-properties" data-editor-properties>
            <label><span>${escapeHtml($L.get('pdfviewer.editor.name'))}</span><input type="text" data-editor-prop="name" value="${escapeHtml(item.name)}"></label>
            ${specific}
            ${item.type !== 'image' ? `<label><span>${escapeHtml($L.get('pdfviewer.editor.color'))}</span><input type="color" data-editor-style="color" value="${style.color || '#ef3e3e'}"></label>` : ''}
            ${['shapes','draw'].includes(item.category) || !['text','note','image','highlight'].includes(item.type) ? `<label><span>${escapeHtml($L.get('pdfviewer.editor.strokeWidth'))}</span><input type="range" min="1" max="30" data-editor-style="strokeWidth" value="${style.strokeWidth || 2}"></label>` : ''}
            <label><span>${escapeHtml($L.get('pdfviewer.editor.opacity'))}</span><input type="range" min="0.05" max="1" step="0.05" data-editor-style="opacity" value="${style.opacity == null ? 1 : style.opacity}"></label>
            <div class="pv-editor-properties-actions"><button type="button" data-editor-action="duplicate" data-id="${item.id}">${escapeHtml($L.get('pdfviewer.editor.duplicate'))}</button><button class="pv-danger" type="button" data-editor-action="delete" data-id="${item.id}">${escapeHtml($L.get('pdfviewer.editor.delete'))}</button></div>
        </form>`;
        this.drawerBody.querySelectorAll('select[data-editor-style]').forEach(select => {
            const key = select.dataset.editorStyle;
            select.value = style[key] || (item.type === 'arrow' && key === 'lineEnd' ? 'arrow' : select.value);
        });
        this.updateDrawerTabs();
    }

    updateDrawerTabs() {
        this.drawer.querySelectorAll('[data-editor-view]').forEach(button => button.classList.toggle('pv-active', button.dataset.editorView === this.drawer.dataset.view));
    }

    onDrawerClick(event) {
        const view = event.target.closest('[data-editor-view]');
        if (view) return view.dataset.editorView === 'items' ? this.openItems() : this.openProperties(this.selectedId);
        if (event.target.closest('[data-editor-close]')) return this.closeDrawer();
        const action = event.target.closest('[data-editor-action]');
        if (!action) return;
        const id = action.dataset.id;
        if (action.dataset.editorAction === 'select') this.selectItem(id);
        if (action.dataset.editorAction === 'properties') { this.selectItem(id); this.openProperties(id); }
        if (action.dataset.editorAction === 'duplicate') this.duplicateItem(id);
        if (action.dataset.editorAction === 'visibility') { const item = this.getItem(id); if (item) this.updateItem(id, { visible: !item.visible }); }
        if (action.dataset.editorAction === 'delete') this.deleteItem(id);
        if (action.dataset.editorAction === 'clear') this.clearItems();
    }

    onDrawerInput(event, immediate = false) {
        if (event.target.matches('[data-editor-search]')) {
            this.itemQuery = event.target.value;
            if (immediate) this.renderItems();
            else {
                clearTimeout(this.searchTimer);
                this.searchTimer = setTimeout(() => this.renderItems(), 120);
            }
            return;
        }
        const item = this.getItem(this.selectedId);
        if (!item) return;
        const apply = () => {
            const before = clone(this.items);
            if (event.target.dataset.editorProp === 'name') item.name = event.target.value.trim() || item.name;
            if (event.target.dataset.editorProp === 'text') item.data.text = event.target.value;
            if (event.target.dataset.editorStyle) {
                const key = event.target.dataset.editorStyle;
                item.style[key] = event.target.type === 'range' || event.target.type === 'number' ? Number(event.target.value) : event.target.value;
            }
            if (event.target.matches('[data-editor-transparent]')) item.style.fillColor = event.target.checked ? 'transparent' : '#ffffff';
            if (event.target.matches('[data-editor-style="fillColor"]')) {
                const transparent = this.drawerBody.querySelector('[data-editor-transparent]');
                if (transparent) transparent.checked = false;
            }
            this.pushHistory(before);
            const record = this.overlay.records.get(item.pageNumber);
            if (record) void this.renderPage(record, item.id);
            this.emitChange(false);
        };
        clearTimeout(this.propertyTimer);
        if (immediate || event.target.type === 'color' || event.target.type === 'checkbox' || event.target.tagName === 'SELECT') apply();
        else this.propertyTimer = setTimeout(apply, 180);
    }

    onKeyDown(event) {
        const tag = event.target && event.target.tagName;
        const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || event.target?.isContentEditable;
        if (!typing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
            event.preventDefault();
            return event.shiftKey ? this.redo() : this.undo();
        }
        if (!typing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); return this.redo(); }
        if (event.key === 'Escape') {
            if (!this.drawer.hidden) return this.closeDrawer();
            return this.cancelTool();
        }
        if (event.key === 'Enter' && this.polyPoints.length) {
            const record = Array.from(this.overlay.records.values()).find(value => value.editorTemporary);
            if (record) this.finishPolygon(record);
        }
        if (!typing && (event.key === 'Delete' || event.key === 'Backspace') && this.selectedId) {
            event.preventDefault();
            this.deleteItem(this.selectedId);
        }
    }

    reset() {
        this.items = [];
        this.undoStack = [];
        this.redoStack = [];
        this.selectedId = null;
        this.counters.clear();
        this.cancelTool();
        this.overlay.removeOwnerObjects('editor');
        this.closeDrawer();
        this.emitChange();
    }

    destroy() {
        document.removeEventListener('keydown', this.keyHandler);
        window.cancelAnimationFrame(this.scaleFrame);
        clearTimeout(this.searchTimer);
        clearTimeout(this.propertyTimer);
        this.unregisterOverlay?.();
        this.unsubscribeToolChange?.();
        this.drawer?.remove();
        this.toolControls.clear();
        this.callbacks.clear();
        this.viewer = null;
    }
}
