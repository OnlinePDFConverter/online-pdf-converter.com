import EditorToolbarPlugin from '../../editor/EditorToolbarPlugin';
import template from './template.html';
import './style.css';

const MAIN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M32,64a8,8,0,0,1,8-8H216a8,8,0,0,1,0,16H40A8,8,0,0,1,32,64Zm8,72h72a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16Zm88,48H40a8,8,0,0,0,0,16h88a8,8,0,0,0,0-16Zm109.66,13.66a8,8,0,0,1-11.32,0L206,177.36A40,40,0,1,1,217.36,166l20.3,20.3A8,8,0,0,1,237.66,197.66ZM184,168a24,24,0,1,0-24-24A24,24,0,0,0,184,168Z"></path></svg>';

export default class EditItemsToolbarPlugin extends EditorToolbarPlugin {
    constructor() { super({ id: 'edit_items', group: 'editor', icon: Object.freeze({ main: MAIN }) }, null); }
    render({ icon }) { return template({ icon, label: $L.get('pdfviewer.editor.items') }); }
    mount(context) {
        super.mount(context);
        this.button = context.toolbar.querySelector('[data-action="edit_items"]');
        this.handleToggle = () => {
            const open = this.session.drawer.hidden || this.session.drawer.dataset.view !== 'items';
            this.session.closePanels();
            this.session.selectTool('select', null);
            if (open) this.session.openItems(); else this.session.closeDrawer();
            this.syncState();
        };
        this.handleDrawerClick = () => queueMicrotask(() => this.syncState());
        this.button.addEventListener('click', this.handleToggle);
        this.session.drawer.addEventListener('click', this.handleDrawerClick);
    }
    syncState() {
        const active = this.session && !this.session.drawer.hidden && this.session.drawer.dataset.view === 'items';
        this.button?.classList.toggle('pv-active', active);
        this.button?.setAttribute('aria-expanded', String(Boolean(active)));
    }
    getItems() { return this.session ? this.session.getItems() : []; }
    getEditData() { return this.session ? this.session.getEditData() : { items: [] }; }
    selectItem(id) { return this.session?.selectItem(id); }
    duplicateItem(id) { return this.session?.duplicateItem(id); }
    setItemVisibility(id, visible) { return this.session?.updateItem(id, { visible: Boolean(visible) }); }
    renameItem(id, name) { return this.session?.updateItem(id, { name: String(name || '').trim() || this.session.getItem(id)?.name }); }
    deleteItem(id) { return this.session?.deleteItem(id); }
    clearItems() { return this.session?.clearItems(); }
    hasExportableItems() { return Boolean(this.session?.hasExportableItems()); }
    destroy() {
        this.button?.removeEventListener('click', this.handleToggle);
        this.session?.drawer.removeEventListener('click', this.handleDrawerClick);
        super.destroy();
    }
}
