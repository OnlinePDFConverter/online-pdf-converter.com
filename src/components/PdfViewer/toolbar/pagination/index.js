import ToolbarPlugin from '../ToolbarPlugin';
import template from './template.html';
import './style.css';

const ICON = Object.freeze({
    previous: '<svg viewBox="0 0 24 24"><path d="m15.4 5 1.4 1.4L11.2 12l5.6 5.6-1.4 1.4-7-7 7-7Z"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="m8.6 19-1.4-1.4 5.6-5.6-5.6-5.6L8.6 5l7 7-7 7Z"/></svg>'
});

export default class PaginationToolbarPlugin extends ToolbarPlugin {
    constructor() {
        super({
            id: 'pagination',
            group: 'pagination',
            groupClass: 'pv-page-controls',
            icon: ICON
        });
    }

    render({ icon, button }) {
        return template({ icon, button });
    }

    mount(context) {
        super.mount(context);
        const { viewer, toolbar } = context;
        this.pageInput = toolbar.querySelector('[data-pv-page-input]');
        this.pageTotal = toolbar.querySelector('[data-pv-page-total]');
        this.handleClick = event => {
            const trigger = event.target.closest('[data-action]');
            if (!trigger || !toolbar.contains(trigger)) return;
            if (trigger.dataset.action === 'prev') {
                viewer.goToPage(viewer.currentPage - 1);
            } else if (trigger.dataset.action === 'next') {
                viewer.goToPage(viewer.currentPage + 1);
            }
        };
        this.handleChange = () => viewer.goToPage(Number(this.pageInput.value));
        toolbar.addEventListener('click', this.handleClick);
        this.pageInput.addEventListener('change', this.handleChange);
    }

    update({ viewer }) {
        const total = viewer.pdf ? viewer.pdf.numPages : 0;
        this.pageInput.max = total || 1;
        this.pageInput.value = total ? viewer.currentPage : 0;
        this.pageInput.disabled = !total;
        this.pageTotal.textContent = total;
    }

    destroy() {
        if (this.toolbar && this.handleClick) {
            this.toolbar.removeEventListener('click', this.handleClick);
        }
        if (this.pageInput && this.handleChange) {
            this.pageInput.removeEventListener('change', this.handleChange);
        }
        this.pageInput = null;
        this.pageTotal = null;
        super.destroy();
    }
}
