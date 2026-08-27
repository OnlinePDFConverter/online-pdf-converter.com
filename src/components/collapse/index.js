const CONTAINER_CLASS = 'fold-container';
const SHOW_CLASS = 'show';


class Collapse {
    constructor(selector, options = {}) {
        this.elContainer = selector instanceof Node ? selector : document.querySelector(selector);
        this.options = {
            direction: 'right',
            onOpen: e => {},
            onClose: e => {},
            duration: 500
        };
        this.options = Object.assign(this.options, options);
        this.duration = this.options.duration;
        this.status = false;
        this.elContainer.classList.add(CONTAINER_CLASS);
    }

    open() {
        this.elContainer.style.transitionDuration = this.duration + 'ms';
        this.status = true;
        this.options.onOpen();
        this.elContainer.classList.add(SHOW_CLASS);
        let width = this.elContainer.offsetWidth;
        let height = this.elContainer.offsetHeight;
        // let width = this.elContainer.firstElementChild.offsetWidth;
        // let height = this.elContainer.firstElementChild.offsetHeight;
        this.elContainer.classList.add('fold-' + this.options.direction);
        this.elContainer.offsetWidth;
        if (this.options.direction == 'bottom') {
            this.elContainer.style.height = height + 'px';
        } else if (this.options.direction == 'right') {
            this.elContainer.style.width = width + 'px';
        } else if (this.options.direction == 'left') {
            this.elContainer.style.width = width + 'px';
        }
    }

    close() {
        this.status =  false;
        this.options.onClose();
        if (this.elContainer.style.height == 'auto' || !this.elContainer.style.height) {
            this.elContainer.style.height = this.elContainer.offsetHeight + 'px';
            this.elContainer.style.transitionDuration = this.duration + 'ms';
            this.elContainer.offsetWidth; 
        }
        if (this.options.direction == 'bottom') {
            this.elContainer.style.height = '';
        } else if (this.options.direction == 'right') {
            this.elContainer.style.width = '';
        } else if (this.options.direction == 'left') {
            this.elContainer.style.width = '';
        }
        setTimeout(() => {
            this.elContainer.classList.remove('fold-' + this.options.direction, SHOW_CLASS);
            this.elContainer.style.transitionDuration = '';
        }, this.duration);
    }

    toggle() {
        if (this.status) {
            this.close();
        } else {
            this.open();
        }
    }
}

export default Collapse;