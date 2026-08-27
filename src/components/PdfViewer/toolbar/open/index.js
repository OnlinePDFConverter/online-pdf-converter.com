import ToolbarPlugin from '../ToolbarPlugin';
import template from './template.html';
import './style.css';

const ICON = Object.freeze({
    main: '<svg viewBox="0 0 24 24"><path d="M4 5h7l2 2h7v12H4V5Zm2 4v8h12V9H6Z"/></svg>'
});

export default class OpenToolbarPlugin extends ToolbarPlugin {
    constructor() {
        super({
            id: 'open',
            group: 'file',
            icon: ICON
        });
    }

    render({ viewer, icon, button, escapeHtml }) {
        return template({
            icon,
            button,
            fileName: escapeHtml(viewer.options.fileName || '')
        });
    }

    mount(context) {
        super.mount(context);
        const { viewer, toolbar } = context;
        this.fileInput = toolbar.querySelector('[data-pv-open-input]');
        this.fileNameEl = toolbar.querySelector('[data-pv-file-name]');
        this.handleClick = event => {
            const trigger = event.target.closest('[data-action="open"]');
            if (trigger && viewer.container.contains(trigger)) {
                this.fileInput.click();
            }
        };
        this.handleChange = () => {
            const file = this.fileInput.files && this.fileInput.files[0];
            if (file) viewer.load(file, { fileName: file.name });
        };
        viewer.container.addEventListener('click', this.handleClick);
        this.fileInput.addEventListener('change', this.handleChange);
    }

    update({ viewer }) {
        this.fileNameEl.textContent = viewer.options.fileName || 'PDF document';
    }

    destroy() {
        if (this.viewer && this.handleClick) {
            this.viewer.container.removeEventListener('click', this.handleClick);
        }
        if (this.fileInput && this.handleChange) {
            this.fileInput.removeEventListener('change', this.handleChange);
        }
        this.fileInput = null;
        this.fileNameEl = null;
        super.destroy();
    }
}
