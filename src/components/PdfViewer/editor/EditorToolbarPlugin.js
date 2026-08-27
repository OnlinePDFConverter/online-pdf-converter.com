import ToolbarPlugin from '../toolbar/ToolbarPlugin';
import { acquireEditorSession, releaseEditorSession } from './EditorSession';

export default class EditorToolbarPlugin extends ToolbarPlugin {
    constructor(meta, category) {
        super(meta);
        this.category = category;
        this.unsubscribers = [];
    }

    mount(context) {
        super.mount(context);
        this.session = acquireEditorSession(context.viewer);
    }

    mountToolPanel(context, html) {
        this.button = context.toolbar.querySelector(`[data-action="${this.id}"]`);
        const host = document.createElement('div');
        host.innerHTML = html.trim();
        this.panel = host.firstElementChild;
        context.toolbar.insertAdjacentElement('afterend', this.panel);
        this.handleToggle = () => this.session.togglePanel(this.id);
        this.handlePanelClick = event => {
            const tool = event.target.closest('[data-editor-tool]');
            const command = event.target.closest('[data-editor-command]');
            if (tool) this.selectTool(tool.dataset.editorTool);
            if (command) this.selectTool(command.dataset.editorCommand);
        };
        this.button.addEventListener('click', this.handleToggle);
        this.panel.addEventListener('click', this.handlePanelClick);
        this.session.registerPanel(this.id, this.button, this.panel);
        this.session.updateToolButtons();
    }

    getItems() { return this.session ? this.session.getItems(this.category) : []; }
    clearItems() { return this.session?.clearItems(this.category); }
    selectTool(type) { return this.session?.selectTool(type, this.id); }
    cancelTool() { return this.session?.cancelTool(); }
    onChange(callback) { return this.session ? this.session.onChange(callback) : () => {}; }

    onDocumentLoad(payload) { this.session?.handleDocumentLoad(payload); }
    onDocumentDestroy(payload) { this.session?.handleDocumentDestroy(payload); }
    onPageRendered(payload) { this.session?.handlePageRendered(payload); }
    onScaleChange() { this.session?.handleScaleChange(); }

    update() {
        if (this.button) this.button.disabled = !this.viewer?.pdf;
    }

    destroy() {
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
        this.unsubscribers = [];
        if (this.session) {
            this.session.unregisterPanel(this.id);
            releaseEditorSession(this.viewer);
        }
        if (this.button && this.handleToggle) this.button.removeEventListener('click', this.handleToggle);
        if (this.panel && this.handlePanelClick) this.panel.removeEventListener('click', this.handlePanelClick);
        this.panel?.remove();
        this.panel = null;
        this.button = null;
        this.session = null;
        super.destroy();
    }
}
