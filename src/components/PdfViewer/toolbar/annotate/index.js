import EditorToolbarPlugin from '../../editor/EditorToolbarPlugin';
import template from './template.html';
import panelTemplate from './panel.html';
import { createId } from '../../utils';
import { EVENTS } from '@common/hook';
import './style.css';

const MAIN = '<svg viewBox="0 0 24 24"><path d="M5 3h10l4 4v14H5V3Zm2 2v14h10V8h-3V5H7Zm2 7h6v2H9v-2Zm0 4h5v2H9v-2Z"/></svg>';
const ICONS = {
    text: '<svg viewBox="0 0 24 24"><path d="M4 4h16v4h-2V6h-5v14h-2V6H6v2H4V4Z"/></svg>',
    note: '<svg viewBox="0 0 24 24"><path d="M4 3h16v13l-5 5H4V3Zm2 2v14h8v-4h4V5H6Z"/></svg>',
    image: '<svg viewBox="0 0 24 24"><path d="M3 4h18v16H3V4Zm2 2v10l4-4 3 3 2-2 5 5V6H5Zm10 1a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"/></svg>',
    highlight: '<svg viewBox="0 0 24 24"><path d="m15 3 6 6-9 9H6v-6l9-9ZM5 20h14v2H5v-2Z"/></svg>',
    underline: '<svg viewBox="0 0 24 24"><path d="M7 3h2v8a3 3 0 0 0 6 0V3h2v8a5 5 0 0 1-10 0V3ZM5 20h14v2H5v-2Z"/></svg>',
    strikeout: '<svg viewBox="0 0 24 24"><path d="M5 11h14v2H5v-2Zm3-8h9v2h-4v4h-2V5H8V3Zm3 12h2v4h4v2H8v-2h3v-4Z"/></svg>',
    squiggly: '<svg viewBox="0 0 24 24"><path d="M7 3h10v2h-4v10h-2V5H7V3Zm-3 16 3-2 3 2 3-2 3 2 3-2 2 1-5 4-3-2-3 2-3-2-2 2-1-3Z"/></svg>'
};
const TOOLS = ['text', 'note', 'image', 'highlight', 'underline', 'strikeout', 'squiggly'];

export default class AnnotateToolbarPlugin extends EditorToolbarPlugin {
    constructor() { super({ id: 'annotate', group: 'editor', icon: Object.freeze({ main: MAIN }) }, 'annotate'); this.panelId = `pv-annotate-${createId()}`; }
    render({ icon }) { return template({ icon, panelId: this.panelId, label: $L.get('pdfviewer.editor.annotate') }); }
    mount(context) {
        super.mount(context);
        const label = $L.get('pdfviewer.editor.annotate');
        this.mountToolPanel(context, panelTemplate({ panelId: this.panelId, label, icons: ICONS, tools: TOOLS.map(type => ({ type, label: $L.get(`pdfviewer.editor.tools.${type}`) })), undo: $L.get('pdfviewer.editor.undo'), redo: $L.get('pdfviewer.editor.redo') }));
        this.imageInput = this.panel.querySelector('[data-annotate-image]');
        this.handleImageTool = event => {
            if (!event.target.closest('[data-editor-tool="image"]')) return;
            event.preventDefault();
            event.stopPropagation();
            this.imageInput.click();
        };
        this.handleImage = () => this.readImage();
        this.panel.addEventListener('click', this.handleImageTool, true);
        this.imageInput.addEventListener('change', this.handleImage);
    }
    readImage() {
        const file = this.imageInput.files && this.imageInput.files[0];
        this.imageInput.value = '';
        if (!file || !/^image\/(png|jpeg)$/.test(file.type)) return $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: $L.get('pdfviewer.editor.invalidImage') });
        const reader = new FileReader();
        reader.onload = () => {
            const image = new Image();
            image.onload = () => this.session.setPendingImage({ url: reader.result, mimeType: file.type, width: image.naturalWidth, height: image.naturalHeight });
            image.onerror = () => $HOOK.dispatch(EVENTS.MESSAGE.ERROR, { msg: $L.get('pdfviewer.editor.invalidImage') });
            image.src = reader.result;
        };
        reader.readAsDataURL(file);
    }
    destroy() {
        this.panel?.removeEventListener('click', this.handleImageTool, true);
        this.imageInput?.removeEventListener('change', this.handleImage);
        super.destroy();
    }
}
