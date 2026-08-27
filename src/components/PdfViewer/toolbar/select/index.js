import EditorToolbarPlugin from '../../editor/EditorToolbarPlugin';
import template from './template.html';
import './style.css';

const MAIN = '<svg viewBox="0 0 24 24"><path d="m5 3 14 9-7 2-3 7L5 3Z"/></svg>';

export default class SelectToolbarPlugin extends EditorToolbarPlugin {
    constructor() {
        super({ id: 'select', group: 'editor', icon: Object.freeze({ main: MAIN }) }, null);
    }

    render({ icon }) {
        return template({ icon, label: $L.get('pdfviewer.editor.tools.select') });
    }

    mount(context) {
        super.mount(context);
        this.button = context.toolbar.querySelector('[data-action="select"]');
        this.handleSelect = () => this.session.selectTool('select', null);
        this.button.addEventListener('click', this.handleSelect);
        this.session.registerToolControl(this.button, 'select');
    }

    destroy() {
        this.button?.removeEventListener('click', this.handleSelect);
        this.session?.unregisterToolControl(this.button);
        super.destroy();
    }
}
