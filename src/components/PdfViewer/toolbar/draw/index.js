import EditorToolbarPlugin from '../../editor/EditorToolbarPlugin';
import template from './template.html';
import panelTemplate from './panel.html';
import { createId } from '../../utils';
import './style.css';

const MAIN = '<svg viewBox="0 0 24 24"><path d="m17.7 2.3 4 4L8 20H4v-4L17.7 2.3ZM6 16.8V18h1.2L19 6.3 17.7 5 6 16.8Z"/></svg>';
const ICONS = {
    pencil: MAIN,
    highlighter: '<svg viewBox="0 0 24 24"><path d="m14 3 7 7-9 9H5v-7l9-9ZM7 13v4h4l7-7-4-4-7 7ZM3 21h18v2H3v-2Z"/></svg>',
    eraser: '<svg viewBox="0 0 24 24"><path d="m15 3 6 6-10 10H6l-4-4L15 3Zm0 3L5 16l2 2h3L18 9l-3-3ZM12 21h9v2h-9v-2Z"/></svg>'
};
const TOOLS = ['pencil', 'highlighter', 'eraser'];

export default class DrawToolbarPlugin extends EditorToolbarPlugin {
    constructor() { super({ id: 'draw', group: 'editor', icon: Object.freeze({ main: MAIN }) }, 'draw'); this.panelId = `pv-draw-${createId()}`; }
    render({ icon }) { return template({ icon, panelId: this.panelId, label: $L.get('pdfviewer.editor.draw') }); }
    mount(context) { super.mount(context); const label = $L.get('pdfviewer.editor.draw'); this.mountToolPanel(context, panelTemplate({ panelId: this.panelId, label, icons: ICONS, tools: TOOLS.map(type => ({ type, label: $L.get(`pdfviewer.editor.tools.${type}`) })), undo: $L.get('pdfviewer.editor.undo'), redo: $L.get('pdfviewer.editor.redo') })); }
}
