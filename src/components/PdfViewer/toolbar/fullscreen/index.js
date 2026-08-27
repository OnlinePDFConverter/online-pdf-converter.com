import ToolbarPlugin from '../ToolbarPlugin';
import template from './template.html';
import './style.css';

const ICON = Object.freeze({
    main: '<svg viewBox="0 0 24 24"><path d="M5 5h6v2H7v4H5V5Zm12 2h-4V5h6v6h-2V7ZM7 13v4h4v2H5v-6h2Zm12 0v6h-6v-2h4v-4h2Z"/></svg>'
});

export default class FullscreenToolbarPlugin extends ToolbarPlugin {
    constructor() {
        super({
            id: 'fullscreen',
            group: 'fullscreen',
            icon: ICON
        });
    }

    render({ icon, button }) {
        return template({ icon, button });
    }

    mount(context) {
        super.mount(context);
        const { viewer, toolbar } = context;
        this.handleClick = event => {
            const trigger = event.target.closest('[data-action="fullscreen"]');
            if (!trigger || !toolbar.contains(trigger)) return;
            if (!document.fullscreenElement) {
                viewer.app.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        };
        toolbar.addEventListener('click', this.handleClick);
    }

    destroy() {
        if (this.toolbar && this.handleClick) {
            this.toolbar.removeEventListener('click', this.handleClick);
        }
        super.destroy();
    }
}
