// import './index.css';

const OVERLAY_CLASS = 'sliderbar-overlay';
const CONTAINER_CLASS = 'sliderbar-container';
const CONTENT_CLASS = 'sliderbar-content';
const SHOW_CLASS = 'show';
const ON_CLASS = 'on';


class SliderBar {
    constructor(options = {}) {
        this.status = false;
        this.options = {
            direction: 'right',
            container: document.body,
            containerClass: '',
            onOpen: e => {},
            onClose: e => {},
            content: null,
            duration: 500,
            overlay: true,
            overlayColor: 'rgba(12, 12, 12, 0.7)',
            position: 'fixed'
        };
        this.options = Object.assign(this.options, options);
        this.duration = this.options.duration;

        this.container = this.options.container ?? document.body;
        this.elContainer = document.createElement('div');
        this.elContainer.className = CONTAINER_CLASS + ' sliderbar-' + this.options.direction + ' ' + this.options.containerClass;
        this.elContainer.style.transitionDuration = this.duration + 'ms';
        this.elContainer.style.position = this.options.position === false ? 'static' : this.options.position;
        
        if (this.options.overlay) {
            this.elOverlay = document.createElement('div');
            this.elOverlay.className = OVERLAY_CLASS;
            this.elOverlay.style.transitionDuration = this.duration + 'ms';
            this.elOverlay.style.position = this.options.position;
            if (this.options.overlayColor) {
                this.elOverlay.style.backgroundColor = this.options.overlayColor;
            }
            this.elOverlay.addEventListener('click', () => {
                this.close();
            });
            this.container.append(this.elOverlay);
        }

        this.elContent = document.createElement('div');
        this.elContent.className = CONTENT_CLASS;

        this.elContainer.append(this.elContent);
        this.container.append(this.elContainer);
        if (this.options.content !== null) {
            this.setContent(this.options.content);
        }
    }

    setContent(content) {
        if (content instanceof Node) {
            this.elContent.appendChild(content);
        } else {
            this.elContent.innerHTML = content;
        }
    }

    _topCSS() {
        const scrollTop = this.container.scrollTop;
        const startCSS = 'translateY(calc('+ scrollTop +'px + 100%))';
        const endCSS = 'translateY('+ scrollTop +'px)';
        return {
            startCSS,
            endCSS
        }
    }

    _bottomCSS() {
        const scrollTop = this.container.scrollTop;
        const startCSS = 'translateY(calc('+ scrollTop +'px + -100%))';
        const endCSS = 'translateY('+ scrollTop +'px)';
        return {
            startCSS,
            endCSS
        }
    }

    _leftCSS() {
        const scrollLeft = this.container.scrollLeft;
        const startCSS = 'translateX(calc('+ scrollLeft +'px + 100%))';
        const endCSS = 'translateX('+ scrollLeft +'px)';
        return {
            startCSS,
            endCSS
        }
    }

    _rightCSS() {
        const scrollLeft = this.container.scrollLeft;
        const startCSS = 'translateX(calc('+ scrollLeft +'px + -100%))';
        const endCSS = 'translateX('+ scrollLeft +'px)';
        return {
            startCSS,
            endCSS
        }
    }

    getCSS() {
        let css = '';
        switch (this.options.direction) {
            case 'top':
                css = this._topCSS();
                break;
            case 'bottom':
                css = this._bottomCSS();
                break;
            case 'left':
                css = this._leftCSS();
                break;
            case 'right':
                css = this._rightCSS();
                break;
        }
        return css;
    }

    open() {
        this.status = true;
        this.options.onOpen();
        
        if (this.options.position == 'fixed') {
            if (this.elOverlay) {
                this.elOverlay.classList.add(SHOW_CLASS);
                this.elOverlay.offsetWidth;
                this.elOverlay.classList.add(ON_CLASS);
            }

            this.elContainer.classList.add(SHOW_CLASS);
            this.elContainer.offsetWidth;
            this.elContainer.classList.add(ON_CLASS);
        } else {
            const css = this.getCSS();
            if (this.elOverlay) {
                this.elOverlay.classList.add(SHOW_CLASS);
                this.elOverlay.style.transform = css.endCSS;
                this.elOverlay.offsetWidth;
                this.elOverlay.classList.add(ON_CLASS);
            }

            this.elContainer.style.transform = css.startCSS;
            this.elContainer.classList.add(SHOW_CLASS);
            this.elContainer.offsetWidth;
            this.elContainer.style.transform = css.endCSS;
        }
    }

    close() {
        this.status = false;
        this.options.onClose();
        if (this.options.position == 'fixed') {
            this.elOverlay?.classList.remove(ON_CLASS);
            this.elContainer.classList.remove(ON_CLASS);
        } else {
            this.elOverlay?.classList.remove(ON_CLASS);
            const css = this.getCSS();
            this.elContainer.style.transform = css.startCSS;
        }
        setTimeout(() => {
            this.elOverlay?.classList.remove(SHOW_CLASS);
            this.elContainer.classList.remove(SHOW_CLASS);
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

export default SliderBar;