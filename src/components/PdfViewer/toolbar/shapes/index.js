import EditorToolbarPlugin from '../../editor/EditorToolbarPlugin';
import template from './template.html';
import panelTemplate from './panel.html';
import { createId } from '../../utils';
import './style.css';

const MAIN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M71.59,61.47a8,8,0,0,0-15.18,0l-40,120A8,8,0,0,0,24,192h80a8,8,0,0,0,7.59-10.53ZM35.1,176,64,89.3,92.9,176ZM208,76a52,52,0,1,0-52,52A52.06,52.06,0,0,0,208,76Zm-88,0a36,36,0,1,1,36,36A36,36,0,0,1,120,76Zm104,68H136a8,8,0,0,0-8,8v56a8,8,0,0,0,8,8h88a8,8,0,0,0,8-8V152A8,8,0,0,0,224,144Zm-8,56H144V160h72Z"></path></svg>';
const line = '<svg viewBox="0 0 24 24"><path d="M4 19 19 4l1 1L5 20l-1-1Z"/></svg>';
const ICONS = {
    rectangle: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4V4Zm2 2v12h12V6H6Z"/></svg>',
    ellipse: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 2a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z"/></svg>',
    line,
    arrow: '<svg viewBox="0 0 24 24"><path d="m5 20-1-1L17 6h-5V4h8v8h-2V7L5 20Z"/></svg>',
    polygon: '<svg viewBox="0 0 24 24"><path d="m12 2 10 7-4 12H6L2 9l10-7Zm0 2.5L4.4 10l3 9h9.2l3-9L12 4.5Z"/></svg>',
    polyline: '<svg viewBox="0 0 24 24"><path d="M3 18 8 7l6 8 7-11v4l-7 11-5-7-4 9-2-3Z"/></svg>',
    cloud: '<svg viewBox="0 0 24 24"><path d="M7 19a5 5 0 0 1-1-9.9A7 7 0 0 1 19.7 11 4 4 0 0 1 19 19H7Zm0-2h12a2 2 0 0 0 0-4h-1l-.1-1a5 5 0 0 0-9.9-.7L7.7 12H7a3 3 0 0 0 0 6v-1Z"/></svg>'
};
const TOOLS = ['rectangle', 'ellipse', 'line', 'arrow', 'polygon', 'polyline', 'cloud'];

export default class ShapesToolbarPlugin extends EditorToolbarPlugin {
    constructor() { super({ id: 'shapes', group: 'editor', icon: Object.freeze({ main: MAIN }) }, 'shapes'); this.panelId = `pv-shapes-${createId()}`; }
    render({ icon }) { return template({ icon, panelId: this.panelId, label: $L.get('pdfviewer.editor.shapes') }); }
    mount(context) { super.mount(context); const label = $L.get('pdfviewer.editor.shapes'); this.mountToolPanel(context, panelTemplate({ panelId: this.panelId, label, icons: ICONS, tools: TOOLS.map(type => ({ type, label: $L.get(`pdfviewer.editor.tools.${type}`) })), undo: $L.get('pdfviewer.editor.undo'), redo: $L.get('pdfviewer.editor.redo') })); }
}
