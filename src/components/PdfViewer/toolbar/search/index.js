import ToolbarPlugin from '../ToolbarPlugin';
import template from './template.html';
import './style.css';

const ICON = Object.freeze({
    main: '<svg viewBox="0 0 24 24"><path d="M10.5 4a6.5 6.5 0 0 1 5.1 10.5l4 4-1.4 1.4-4-4A6.5 6.5 0 1 1 10.5 4Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"/></svg>',
    previous: '<svg viewBox="0 0 24 24"><path d="m15.4 5 1.4 1.4L11.2 12l5.6 5.6-1.4 1.4-7-7 7-7Z"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="m8.6 19-1.4-1.4 5.6-5.6-5.6-5.6L8.6 5l7 7-7 7Z"/></svg>'
});

export default class SearchToolbarPlugin extends ToolbarPlugin {
    constructor() {
        super({
            id: 'search',
            group: 'search',
            groupClass: 'pv-search',
            icon: ICON
        });
        this.searchTimer = null;
    }

    render({ icon, button }) {
        return template({ icon, button });
    }

    mount(context) {
        super.mount(context);
        const { viewer, toolbar } = context;
        this.searchInput = toolbar.querySelector('[data-pv-search-input]');
        this.searchCount = toolbar.querySelector('[data-pv-search-count]');
        this.handleInput = () => {
            viewer.searchQuery = this.searchInput.value;
            window.clearTimeout(this.searchTimer);
            this.searchTimer = window.setTimeout(() => viewer.search(this.searchInput.value), 180);
        };
        this.handleClick = event => {
            const trigger = event.target.closest('[data-action]');
            if (!trigger || !toolbar.contains(trigger)) return;
            if (trigger.dataset.action === 'search-prev') {
                viewer.goToSearchMatch(viewer.currentSearchIndex - 1);
            } else if (trigger.dataset.action === 'search-next') {
                viewer.goToSearchMatch(viewer.currentSearchIndex + 1);
            }
        };
        this.searchInput.addEventListener('input', this.handleInput);
        toolbar.addEventListener('click', this.handleClick);
    }

    update({ viewer }) {
        if (this.searchInput.value !== viewer.searchQuery) {
            this.searchInput.value = viewer.searchQuery;
        }
        this.searchInput.disabled = !viewer.pdf;
        if (!viewer.searchQuery.trim()) {
            this.searchCount.textContent = '';
        } else if (!viewer.searchMatches.length) {
            this.searchCount.textContent = '0 results';
        } else {
            this.searchCount.textContent = `${viewer.currentSearchIndex + 1 || 1}/${viewer.searchMatches.length}`;
        }
    }

    destroy() {
        window.clearTimeout(this.searchTimer);
        if (this.searchInput && this.handleInput) {
            this.searchInput.removeEventListener('input', this.handleInput);
        }
        if (this.toolbar && this.handleClick) {
            this.toolbar.removeEventListener('click', this.handleClick);
        }
        this.searchInput = null;
        this.searchCount = null;
        super.destroy();
    }
}
