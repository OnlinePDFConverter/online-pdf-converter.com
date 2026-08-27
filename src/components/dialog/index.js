const CLASS_DIALOG = '__dialog';
const CLASS_DIALOG_OVERLAY = '__dialog_overlay';
const CLASS_DIALOG_MAIN = '__dialog_main';
const CLASS_DIALOG_HEADER = '__dialog_header';
const CLASS_DIALOG_TITLE = '__dialog_header_title';
const CLASS_DIALOG_CONTROLS = '__dialog_header_controls';
const CLASS_DIALOG_BODY = '__dialog_body';
const CLASS_DIALOG_FOOTER = '__dialog_footer';
const CLASS_OPEN = '__dialog_open';
const CLASS_CLOSE = '__dialog_close';
const CLASS_BTN = '__dialog_control_btn';
const CLASS_ANIMATE = '__dialog_animate';
const CLASS_ANIMATE_START = '__dialog_animate_start';
const CLASS_ANIMATE_END = '__dialog_animate_end';

const SVG_CLOSE = '<svg viewBox="0 0 1024 1024" version="1.1"><path d="M810.666667 273.493333L750.506667 213.333333 512 451.84 273.493333 213.333333 213.333333 273.493333 451.84 512 213.333333 750.506667 273.493333 810.666667 512 572.16 750.506667 810.666667 810.666667 750.506667 572.16 512z"></path></svg>';
const SVG_FULL_SCREEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M216,48V88a8,8,0,0,1-16,0V56H168a8,8,0,0,1,0-16h40A8,8,0,0,1,216,48ZM88,200H56V168a8,8,0,0,0-16,0v40a8,8,0,0,0,8,8H88a8,8,0,0,0,0-16Zm120-40a8,8,0,0,0-8,8v32H168a8,8,0,0,0,0,16h40a8,8,0,0,0,8-8V168A8,8,0,0,0,208,160ZM88,40H48a8,8,0,0,0-8,8V88a8,8,0,0,0,16,0V56H88a8,8,0,0,0,0-16Z"></path></svg>';

class Dialog {
    constructor(options) {
        this.options = {
            id: null,
            width: 400,
            height: 300,
            zIndex: 100,
            title: '',
            body: null,
            showHeader: true,
            showFullScreen: false,
            showClose: true,
            showFooter: false,
            overlayCloseClick: true,
            mainClass: '',
            esc: false,
            animate: true,
            closeRemove: false,
            initOpened: true,
            onOpen: that => {},
            onClose: that => {},
            onFullScreen: that => {},
            parentContainer: document.body
        };
        if (options) {
            this.options = Object.assign(this.options, options);
        }
        this.id = this.options.id ? this.options.id : '__dialog_' + new Date().getTime();
        this.title = this.options.title;
        this.width = this.options.width;
        this.height = this.options.height;
        this.elDialog = null;
        this.elDialogOverlay = null;
        this.elDialogMain = null;
        this.elDialogHeader = null;
        this.elDialogFooter = null;
        this.elDialogTitle = null;
        this.elDialogControls = null;
        this.elDialogBody = null;
        this.elFullScreen = null;
        this.elClose = null;
        this.keyupEvent = null;
        this.parentContainer = this.options.parentContainer;
        
        this.init();
        if (this.options.initOpened) {
            this.open();
        }
    }

    init() {
        this.elDialog = document.createElement('div');
        this.elDialog.className = CLASS_DIALOG;
        this.elDialog.setAttribute('id', this.id);
        if (this.options.animate) {
            this.elDialog.classList.add(CLASS_ANIMATE);
        }

        this.elDialogOverlay = document.createElement('div');
        this.elDialogOverlay.className = CLASS_DIALOG_OVERLAY;

        this.elDialogMain = document.createElement('div');
        this.elDialogMain.className = CLASS_DIALOG_MAIN + ' ' + (this.options.mainClass || '');

        this.elDialogHeader = document.createElement('div');
        this.elDialogHeader.className = CLASS_DIALOG_HEADER;

        this.elDialogFooter = document.createElement('div');
        this.elDialogFooter.className = CLASS_DIALOG_FOOTER;

        this.elDialogBody = document.createElement('div');
        this.elDialogBody.className = CLASS_DIALOG_BODY;

        if (this.options.showHeader) {
            this.elDialogMain.appendChild(this.elDialogHeader);
        }
        this.elDialogMain.appendChild(this.elDialogBody);
        if (this.options.showFooter) {
            this.elDialogMain.appendChild(this.elDialogFooter);
        }

        this.elDialogOverlay.appendChild(this.elDialogMain);
        if (this.options.overlayCloseClick) {
            this.elDialogOverlay.addEventListener('mousedown', (e) => {
                if (e.target == this.elDialogOverlay) {
                    this.close();
                }
            });
        }
        this.elDialog.appendChild(this.elDialogOverlay);

        this.elDialogTitle = document.createElement('div');
        this.elDialogTitle.className = CLASS_DIALOG_TITLE;

        this.elDialogControls = document.createElement('div');
        this.elDialogControls.className = CLASS_DIALOG_CONTROLS;

        if (this.options.showHeader) {
            this.elDialogTitle.textContent = this.title;
            this.elDialogHeader.appendChild(this.elDialogTitle);

            if (this.options.showFullScreen) {
                this.elFullScreen = document.createElement('div');
                this.elFullScreen.classList.add(CLASS_BTN);
                this.elFullScreen.innerHTML = SVG_FULL_SCREEN;
                let rect = null;
                this.elFullScreen.addEventListener('click', () => {
                    if (this.elDialogMain.classList.contains('__fullscreen')) {
                        this.elDialogMain.style.width = rect.width + 'px';
                        this.elDialogMain.style.height = rect.height + 'px';
                        this.elDialogMain.classList.remove('__fullscreen');
                    } else {
                        if (!rect) {
                            rect = this.elDialogMain.getBoundingClientRect();
                        }
                        this.elDialogMain.style.width = '';
                        this.elDialogMain.style.height = '';
                        this.elDialogMain.classList.add('__fullscreen');
                    }
                    this.options.onFullScreen(this);
                });
                this.elDialogControls.appendChild(this.elFullScreen);
                this.elDialogHeader.appendChild(this.elDialogControls);
            }

            if (this.options.showClose) {
                this.elClose = document.createElement('div');
                this.elClose.classList.add(CLASS_BTN);
                this.elClose.innerHTML = SVG_CLOSE;
                this.elClose.addEventListener('click', () => {
                    this.close();
                });
                this.elDialogControls.appendChild(this.elClose);
                this.elDialogHeader.appendChild(this.elDialogControls);
            }
        }

        if (this.options.body !== null) {
            this.setBody(this.options.body);
        }
        this.elDialog.style.zIndex = this.options.zIndex;
        this.parentContainer.appendChild(this.elDialog);
    }

    prependHeaderControl(el) {
        const elContainer = document.createElement('div');
        elContainer.classList.add(CLASS_BTN);
        elContainer.appendChild(el);
        if (this.elDialogControls.insertAdjacentElement) {
            this.elDialogControls.insertAdjacentElement('afterbegin', elContainer);
        } else {
            this.elDialogControls.insertBefore(elContainer, this.elDialogControls.firstElementChild);
        }
    }

    appendHeaderControl(el) {
        const elContainer = document.createElement('div');
        elContainer.classList.add(CLASS_BTN);
        elContainer.appendChild(el);
        if (this.elDialogControls.insertAdjacentElement) {
            this.elDialogControls.insertAdjacentElement('beforeend', elContainer);
        } else {
            this.elDialogControls.appendChild(elContainer);
        }
    }

    open() {
        if (this.options.esc && !this.keyupEvent) {
            this.keyupEvent = e => {
                if (e.key === 'Escape') {
                    this.close();
                }
            };
            document.addEventListener('keyup', this.keyupEvent);
        }
        this.elDialog.offsetWidth;
        if (this.width !== undefined && this.width !== null) {
            let width = typeof(this.width) == 'number' ? this.width + 'px' : this.width;
            this.elDialogMain.style.width = width;
        }

        if (this.height !== undefined && this.height !== null) {
            let height = typeof(this.height) == 'number' ? this.height + 'px' : this.height;
            this.elDialogMain.style.height = height;
        }
        this.elDialog.classList.remove(CLASS_CLOSE);
        this.elDialog.classList.add(CLASS_OPEN);
        if (this.options.animate) {
            this.elDialog.classList.add(CLASS_ANIMATE_START);
            this.elDialog.offsetWidth;
            this.elDialog.classList.add(CLASS_ANIMATE_END);
            this.elDialog.classList.remove(CLASS_ANIMATE_START);
        }
        this.options.onOpen(this);
    }

    close() {
        if (this.keyupEvent) {
            document.removeEventListener('keyup', this.keyupEvent);
            this.keyupEvent = null;
        }
        if (this.options.animate) {
            this.elDialog.classList.remove(CLASS_ANIMATE_END);
            this.elDialog.classList.add(CLASS_ANIMATE_START);
            setTimeout(() => {
                this.elDialog.classList.remove(CLASS_ANIMATE_START);
                this.elDialog.classList.remove(CLASS_OPEN);
                this.elDialog.classList.add(CLASS_CLOSE);
            }, 300);
        } else {
            this.elDialog.classList.remove(CLASS_OPEN);
            this.elDialog.classList.add(CLASS_CLOSE);
        }
        
        
        if (this.options.closeRemove) {
            setTimeout(() => {
                this.elDialog.remove();
            }, 300);
        }
        this.options.onClose(this);
    }

    setTitle(title) {
        this.title = title;
        this.elDialogTitle.textContent = this.title;
    }

    setBody(content) {
        if (content instanceof Node) {
            this.elDialogBody.appendChild(content);
        } else {
            this.elDialogBody.innerHTML = content;
        }
    }

    setFooter(content) {
        if (content instanceof Node) {
            this.elDialogFooter.appendChild(content);
        } else {
            this.elDialogFooter.innerHTML = content;
        }
    }
}

export default Dialog;
