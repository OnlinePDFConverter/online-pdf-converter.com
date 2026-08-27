import ToolbarPlugin from './ToolbarPlugin';
import OpenToolbarPlugin from './open';
import PaginationToolbarPlugin from './pagination';
import ZoomToolbarPlugin from './zoom';
import RotateToolbarPlugin from './rotate';
import SearchToolbarPlugin from './search';
import FullscreenToolbarPlugin from './fullscreen';
import SignPdfToolbarPlugin from './sign_pdf';
import AddWatermarkToolbarPlugin from './add_watermark';
import FormsToolbarPlugin from './forms';
import SelectToolbarPlugin from './select';
import AnnotateToolbarPlugin from './annotate';
import ShapesToolbarPlugin from './shapes';
import DrawToolbarPlugin from './draw';
import EditItemsToolbarPlugin from './edit_items';

export {
    ToolbarPlugin,
    OpenToolbarPlugin,
    PaginationToolbarPlugin,
    ZoomToolbarPlugin,
    RotateToolbarPlugin,
    SearchToolbarPlugin,
    FullscreenToolbarPlugin,
    SignPdfToolbarPlugin,
    AddWatermarkToolbarPlugin,
    FormsToolbarPlugin,
    SelectToolbarPlugin,
    AnnotateToolbarPlugin,
    ShapesToolbarPlugin,
    DrawToolbarPlugin,
    EditItemsToolbarPlugin
};

export const BUILT_IN_TOOLBAR_PLUGINS = Object.freeze({
    open: OpenToolbarPlugin,
    pagination: PaginationToolbarPlugin,
    zoom: ZoomToolbarPlugin,
    rotate: RotateToolbarPlugin,
    search: SearchToolbarPlugin,
    fullscreen: FullscreenToolbarPlugin,
    sign_pdf: SignPdfToolbarPlugin,
    add_watermark: AddWatermarkToolbarPlugin,
    forms: FormsToolbarPlugin,
    select: SelectToolbarPlugin,
    annotate: AnnotateToolbarPlugin,
    shapes: ShapesToolbarPlugin,
    draw: DrawToolbarPlugin,
    edit_items: EditItemsToolbarPlugin
});

export const DEFAULT_TOOLBAR = Object.freeze([
    'open',
    'pagination',
    'zoom',
    'rotate',
    'search',
    'fullscreen'
]);

export function createToolbarPlugin(name) {
    if (typeof name !== 'string' || !Object.prototype.hasOwnProperty.call(BUILT_IN_TOOLBAR_PLUGINS, name)) {
        const available = Object.keys(BUILT_IN_TOOLBAR_PLUGINS).join(', ');
        throw new Error(`Unknown PdfViewer toolbar plugin "${name}". Available plugins: ${available}.`);
    }

    const Plugin = BUILT_IN_TOOLBAR_PLUGINS[name];
    return new Plugin();
}

export function createDefaultToolbarPlugins() {
    return DEFAULT_TOOLBAR.map(name => createToolbarPlugin(name));
}

export function resolveToolbarPlugins(entries) {
    if (entries === undefined) {
        return createDefaultToolbarPlugins();
    }
    if (!Array.isArray(entries)) {
        throw new TypeError('PdfViewer toolbar must be an array.');
    }

    return entries.map((entry, index) => {
        if (typeof entry === 'string') {
            return createToolbarPlugin(entry);
        }
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            throw new TypeError(`Invalid PdfViewer toolbar plugin at index ${index}.`);
        }
        if (typeof entry.id === 'string' && typeof entry.render === 'function') {
            return entry;
        }
        throw new TypeError(`Invalid PdfViewer toolbar plugin at index ${index}.`);
    });
}
