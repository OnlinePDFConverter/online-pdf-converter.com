import ToolbarPlugin from '../ToolbarPlugin';
import template from './template.html';
import './style.css';

const SCALE_STEP = 0.15;
const ICON = Object.freeze({
    out: '<svg viewBox="0 0 24 24"><path d="M5 11h14v2H5v-2Z"/></svg>',
    in: '<svg viewBox="0 0 24 24"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z"/></svg>',
    fit: '<svg viewBox="0 0 24 24"><path d="M5 5h5v2H7v3H5V5Zm9 0h5v5h-2V7h-3V5ZM7 14v3h3v2H5v-5h2Zm12 0v5h-5v-2h3v-3h2Z"/></svg>'
});

export default class ZoomToolbarPlugin extends ToolbarPlugin {
    constructor() {
        super({
            id: 'zoom',
            group: 'view',
            icon: ICON
        });
    }

    render({ viewer, icon, button }) {
        return template({ icon, button, scale: viewer.scale });
    }

    mount(context) {
        super.mount(context);
        const { viewer, toolbar } = context;
        this.zoomSelect = toolbar.querySelector('[data-pv-zoom-select]');
        this.handleClick = event => {
            const trigger = event.target.closest('[data-action]');
            if (!trigger || !toolbar.contains(trigger)) return;
            const actions = {
                'zoom-out': () => viewer.zoomBy(-SCALE_STEP),
                'zoom-in': () => viewer.zoomBy(SCALE_STEP),
                fit: () => viewer.toggleFitWidth()
            };
            if (actions[trigger.dataset.action]) actions[trigger.dataset.action]();
        };
        this.handleChange = () => {
            if (this.zoomSelect.value === 'auto') {
                viewer.fitWidth();
            } else if (this.zoomSelect.value !== 'custom') {
                viewer.setScale(Number(this.zoomSelect.value), false);
            } else {
                this.update({ viewer });
            }
        };
        toolbar.addEventListener('click', this.handleClick);
        this.zoomSelect.addEventListener('change', this.handleChange);
    }

    update({ viewer }) {
        const total = viewer.pdf ? viewer.pdf.numPages : 0;
        this.zoomSelect.disabled = !total;
        if (viewer.fitMode) {
            this.zoomSelect.value = 'auto';
            return;
        }

        const customOption = this.zoomSelect.querySelector('option[value="custom"]');
        if (customOption) {
            customOption.textContent = `${Math.round(viewer.scale * 100)}%`;
        }
        const value = String(Math.round(viewer.scale * 100) / 100);
        const option = Array.from(this.zoomSelect.options).find(item => item.value === value);
        this.zoomSelect.value = option ? value : 'custom';
    }

    destroy() {
        if (this.toolbar && this.handleClick) {
            this.toolbar.removeEventListener('click', this.handleClick);
        }
        if (this.zoomSelect && this.handleChange) {
            this.zoomSelect.removeEventListener('change', this.handleChange);
        }
        this.zoomSelect = null;
        super.destroy();
    }
}
