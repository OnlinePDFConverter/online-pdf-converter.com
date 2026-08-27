import ToolbarPlugin from '../ToolbarPlugin';
import template from './template.html';
import './style.css';

const ICON = Object.freeze({
    main: '<svg viewBox="0 0 24 24"><path d="M12 5a7 7 0 1 1-6.3 10h2.2A5 5 0 1 0 12 7H8.8l2.6 2.6L10 11 5 6l5-5 1.4 1.4L8.8 5H12Z"/></svg>'
});

export default class RotateToolbarPlugin extends ToolbarPlugin {
    constructor() {
        super({
            id: 'rotate',
            group: 'view',
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
            const trigger = event.target.closest('[data-action="rotate"]');
            if (trigger && toolbar.contains(trigger)) viewer.rotate();
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
