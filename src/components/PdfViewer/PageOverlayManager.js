import { Canvas as FabricCanvas } from 'fabric';

const pointBounds = points => {
    const xs = points.map(point => point[0]);
    const ys = points.map(point => point[1]);
    return {
        left: Math.min(...xs),
        top: Math.min(...ys),
        width: Math.max(1, Math.max(...xs) - Math.min(...xs)),
        height: Math.max(1, Math.max(...ys) - Math.min(...ys))
    };
};

export default class PageOverlayManager {
    constructor(viewer) {
        this.viewer = viewer;
        this.records = new Map();
        this.owners = new Map();
        this.toolChangeCallbacks = new Set();
        this.activeToolOwner = null;
        this.pointerOwner = null;
        this.objectSequence = 0;
        this.keyHandler = event => this.onKeyDown(event);
        document.addEventListener('keydown', this.keyHandler);
    }

    registerOwner(owner, handlers = {}) {
        if (!owner) throw new TypeError('A page overlay owner id is required.');
        this.owners.set(owner, handlers);
        return () => this.unregisterOwner(owner);
    }

    onToolChange(callback) {
        if (typeof callback !== 'function') {
            throw new TypeError('Page overlay tool change callback must be a function.');
        }
        this.toolChangeCallbacks.add(callback);
        callback({ owner: this.activeToolOwner, previousOwner: null }, this);
        return () => this.toolChangeCallbacks.delete(callback);
    }

    isToolActive(owner) {
        return this.activeToolOwner === owner;
    }

    emitToolChange(previousOwner) {
        const payload = { owner: this.activeToolOwner, previousOwner: previousOwner || null };
        this.toolChangeCallbacks.forEach(callback => callback(payload, this));
    }

    unregisterOwner(owner) {
        if (this.activeToolOwner === owner) this.deactivateTool(owner, false);
        this.removeOwnerObjects(owner);
        this.records.forEach(record => {
            const decoration = record.decorations.get(owner);
            if (decoration) record.layer.classList.remove(decoration);
            record.decorations.delete(owner);
        });
        this.owners.delete(owner);
    }

    activateTool(owner) {
        if (this.activeToolOwner === owner) {
            this.updateCursor();
            return;
        }
        const previous = this.activeToolOwner;
        this.activeToolOwner = owner || null;
        if (previous) this.owners.get(previous)?.onToolCancel?.();
        this.updateCursor();
        this.emitToolChange(previous);
    }

    deactivateTool(owner, notify = false) {
        if (owner && this.activeToolOwner !== owner) return;
        const previous = this.activeToolOwner;
        this.activeToolOwner = null;
        if (notify && previous) this.owners.get(previous)?.onToolCancel?.();
        this.updateCursor();
        if (previous !== this.activeToolOwner) this.emitToolChange(previous);
    }

    updateCursor() {
        const cursorOption = this.activeToolOwner
            ? this.owners.get(this.activeToolOwner)?.cursor
            : null;
        const cursor = typeof cursorOption === 'function'
            ? cursorOption()
            : (cursorOption || (this.activeToolOwner ? 'crosshair' : 'default'));
        this.records.forEach(record => {
            record.canvas.defaultCursor = cursor;
            record.canvas.hoverCursor = 'move';
        });
    }

    getTextCaretAtPoint(clientX, clientY) {
        if (!this.viewer.options.renderTextLayer
            || !Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;

        const layers = Array.from(this.records.values(), record => ({
            layer: record.layer,
            pointerEvents: record.layer.style.pointerEvents
        }));
        layers.forEach(({ layer }) => {
            layer.style.pointerEvents = 'none';
        });

        let node = null;
        let offset = 0;
        let directTextHit = false;
        try {
            const hitElement = document.elementFromPoint(clientX, clientY);
            const hitText = hitElement?.closest('span');
            const hitTextLayer = hitText?.closest('.pv-text-layer');
            directTextHit = Boolean(hitTextLayer && this.viewer.container.contains(hitTextLayer));
            if (typeof document.caretPositionFromPoint === 'function') {
                const position = document.caretPositionFromPoint(clientX, clientY);
                node = position?.offsetNode || null;
                offset = position?.offset || 0;
            }
            if (!node && typeof document.caretRangeFromPoint === 'function') {
                const range = document.caretRangeFromPoint(clientX, clientY);
                node = range?.startContainer || null;
                offset = range?.startOffset || 0;
            }
        } finally {
            layers.forEach(({ layer, pointerEvents }) => {
                layer.style.pointerEvents = pointerEvents;
            });
        }

        if (!node || node.nodeType !== 3) return null;
        const textLayer = node.parentElement?.closest('.pv-text-layer');
        if (!textLayer || !this.viewer.container.contains(textLayer)) return null;
        return {
            node,
            offset: Math.min(offset, node.textContent?.length || 0),
            directTextHit
        };
    }

    ensure(pageNumber) {
        if (this.records.has(pageNumber)) return this.records.get(pageNumber);
        const layer = document.createElement('div');
        layer.className = 'pv-page-overlay';
        const element = document.createElement('canvas');
        layer.appendChild(element);
        const canvas = new FabricCanvas(element, {
            preserveObjectStacking: true,
            selection: true,
            uniformScaling: false
        });
        const record = {
            pageNumber,
            layer,
            canvas,
            viewport: null,
            item: null,
            key: '',
            selectionGuard: 0,
            decorations: new Map()
        };
        this.bindRecord(record);
        this.records.set(pageNumber, record);
        this.updateCursor();
        return record;
    }

    bindRecord(record) {
        const { canvas } = record;
        canvas.on('mouse:down', options => this.dispatchPointer('onMouseDown', record, options));
        canvas.on('mouse:move', options => this.dispatchPointer('onMouseMove', record, options));
        canvas.on('mouse:up', options => this.dispatchPointer('onMouseUp', record, options));
        canvas.on('mouse:dblclick', options => this.dispatchPointer('onDoubleClick', record, options));
        ['moving', 'scaling', 'rotating', 'modified'].forEach(type => {
            canvas.on(`object:${type}`, options => this.dispatchObject(`onObject${type[0].toUpperCase()}${type.slice(1)}`, record, options));
        });
        canvas.on('selection:created', options => this.dispatchSelection(record, options.selected?.[0], options.deselected?.[0]));
        canvas.on('selection:updated', options => this.dispatchSelection(record, options.selected?.[0], options.deselected?.[0]));
        canvas.on('selection:cleared', options => {
            if (record.selectionGuard) return;
            const owner = options.deselected?.[0]?.pvOwner;
            if (owner) this.owners.get(owner)?.onSelectionCleared?.(record, options);
        });
    }

    dispatchPointer(method, record, options) {
        if (method === 'onMouseDown') {
            this.pointerOwner = options.target ? null : this.activeToolOwner;
        } else if (this.pointerOwner) {
            const owner = this.pointerOwner;
            this.owners.get(owner)?.[method]?.(record, options);
            if (method === 'onMouseUp') this.pointerOwner = null;
            return;
        }
        if (options.target) {
            const handler = this.owners.get(options.target.pvOwner);
            handler?.[method]?.(record, options);
            return;
        }
        if (!this.activeToolOwner) return;
        this.owners.get(this.activeToolOwner)?.[method]?.(record, options);
        if (method === 'onMouseUp') this.pointerOwner = null;
    }

    dispatchObject(method, record, options) {
        const owner = options.target?.pvOwner;
        if (owner) this.owners.get(owner)?.[method]?.(record, options);
    }

    dispatchSelection(record, object, previous = null) {
        if (!object?.pvOwner) return;
        if (previous?.pvOwner && previous.pvOwner !== object.pvOwner) {
            this.owners.get(previous.pvOwner)?.onSelectionCleared?.(record, { deselected: [previous] });
        }
        this.records.forEach(other => {
            if (other !== record && other.canvas.getActiveObject()) {
                const active = other.canvas.getActiveObject();
                if (active?.pvOwner) {
                    this.owners.get(active.pvOwner)?.onSelectionCleared?.(other, { deselected: [active] });
                }
                other.selectionGuard += 1;
                other.canvas.discardActiveObject();
                other.selectionGuard -= 1;
                other.canvas.requestRenderAll();
            }
        });
        this.owners.get(object.pvOwner)?.onSelected?.(record, object);
    }

    onKeyDown(event) {
        if (event.key !== 'Delete' && event.key !== 'Backspace') return;
        const tagName = event.target?.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || event.target?.isContentEditable) return;
        for (const record of this.records.values()) {
            const object = record.canvas.getActiveObject();
            if (!object?.pvOwner) continue;
            const handler = this.owners.get(object.pvOwner)?.onDelete;
            if (!handler) return;
            event.preventDefault();
            handler(record, object);
            return;
        }
    }

    attach(pageNumber, item, viewport) {
        const wrap = item?.canvas?.closest('.pv-canvas-wrap');
        if (!wrap) return null;
        const record = this.ensure(pageNumber);
        if (record.layer.parentNode !== wrap) wrap.appendChild(record.layer);
        const width = wrap.clientWidth || viewport.width;
        const height = wrap.clientHeight || viewport.height;
        const oldWidth = record.canvas.getWidth();
        const oldHeight = record.canvas.getHeight();
        record.item = item;
        record.viewport = viewport;
        record.key = `${width}:${height}:${viewport.rotation}`;
        if (oldWidth !== width || oldHeight !== height) record.canvas.setDimensions({ width, height });
        if (oldWidth && oldHeight && (oldWidth !== width || oldHeight !== height)) {
            const scaleX = width / oldWidth;
            const scaleY = height / oldHeight;
            record.canvas.getObjects().forEach(object => {
                object.set({
                    left: object.left * scaleX,
                    top: object.top * scaleY,
                    scaleX: object.scaleX * scaleX,
                    scaleY: object.scaleY * scaleY
                });
                object.setCoords();
            });
        }
        record.canvas.calcOffset();
        return record;
    }

    addObject(owner, pageNumber, object, { id = null, kind = '', zIndex = 30 } = {}) {
        const record = this.records.get(pageNumber);
        if (!record) throw new Error(`Page overlay ${pageNumber} has not been attached.`);
        object.set({
            pvOwner: owner,
            pvObjectId: id,
            pvKind: kind,
            pvZIndex: zIndex,
            pvSequence: ++this.objectSequence
        });
        record.canvas.add(object);
        this.sortObjects(record);
        return object;
    }

    sortObjects(record) {
        const sorted = [...record.canvas.getObjects()].sort((a, b) =>
            (Number(a.pvZIndex) - Number(b.pvZIndex)) || (Number(a.pvSequence) - Number(b.pvSequence)));
        sorted.forEach((object, index) => record.canvas.moveObjectTo(object, index));
        record.canvas.requestRenderAll();
    }

    getOwnerObjects(owner, pageNumber = null) {
        const records = pageNumber == null ? this.records.values() : [this.records.get(pageNumber)].filter(Boolean);
        return Array.from(records).flatMap(record => record.canvas.getObjects().filter(object => object.pvOwner === owner));
    }

    removeOwnerObjects(owner, pageNumber = null, predicate = null) {
        const records = pageNumber == null ? this.records.values() : [this.records.get(pageNumber)].filter(Boolean);
        for (const record of records) {
            const objects = record.canvas.getObjects().filter(object => object.pvOwner === owner && (!predicate || predicate(object)));
            if (objects.length) record.canvas.remove(...objects);
            record.canvas.requestRenderAll();
        }
    }

    setDecoration(owner, pageNumber, className, enabled) {
        const record = this.records.get(pageNumber);
        if (!record) return;
        const previous = record.decorations.get(owner);
        if (previous && previous !== className) record.layer.classList.remove(previous);
        if (enabled) {
            record.decorations.set(owner, className);
            record.layer.classList.add(className);
        } else {
            record.decorations.delete(owner);
            record.layer.classList.remove(className);
        }
    }

    screenRectToPdf(record, rect) {
        const { left, top, width, height } = rect;
        const bounds = pointBounds([
            record.viewport.convertToPdfPoint(left, top),
            record.viewport.convertToPdfPoint(left + width, top),
            record.viewport.convertToPdfPoint(left, top + height),
            record.viewport.convertToPdfPoint(left + width, top + height)
        ]);
        return { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height };
    }

    pdfRectToScreen(record, rect) {
        return pointBounds([
            record.viewport.convertToViewportPoint(rect.x, rect.y),
            record.viewport.convertToViewportPoint(rect.x + rect.width, rect.y),
            record.viewport.convertToViewportPoint(rect.x, rect.y + rect.height),
            record.viewport.convertToViewportPoint(rect.x + rect.width, rect.y + rect.height)
        ]);
    }

    clearDocument() {
        const previous = this.activeToolOwner;
        this.activeToolOwner = null;
        this.pointerOwner = null;
        this.records.forEach(record => {
            record.canvas.dispose();
            record.layer.remove();
        });
        this.records.clear();
        if (previous) this.emitToolChange(previous);
    }

    destroy() {
        document.removeEventListener('keydown', this.keyHandler);
        this.clearDocument();
        this.owners.clear();
        this.toolChangeCallbacks.clear();
        this.viewer = null;
    }
}
