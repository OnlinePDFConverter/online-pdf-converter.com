import './index.css';
const CLASS_OVERLAY = '__loading_overlay';
const CLASS_ON = 'on';
const CLASS_DISABLED = '__loading_disabled';
const MS = 350;

class Loading {
    constructor(target, width, height, color, text, fontSize) {
        this.status = 0;
        this.el = null;
        this.isOverlay = false;
        if (!width) {
            width = 24;
        }
        if (!height) {
            height = 24;
        }
        if (!color) {
            color = '#212529';
        }
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('viewBox', '0 0 1024 1024');
        this.svg.setAttribute('version', '1.1');
        this.svg.setAttribute('class', 'rotate-loading');
        this.svg.setAttribute('width', width);
        this.svg.setAttribute('height', height);
        this.svg.style.fill = color;
        const elSvgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        // elSvgPath.setAttribute('d', 'M512 981.312a469.312 469.312 0 1 0-445.824-322.24A42.688 42.688 0 1 0 147.2 632.32 384 384 0 1 1 512 896a42.688 42.688 0 1 0 0 85.312z');
        // elSvgPath.setAttribute('d', 'M961.45 362.18V137.45l-96.93 96.93C781.45 128.89 652.62 61.16 507.58 62.57 271.24 64.85 72.15 257.78 62.9 493.94 52.86 750.39 257.78 961.45 512 961.45c166.26 0 311.09-90.52 388.83-224.73h-43.78C775.39 861.87 627.8 940.06 463.37 921.2c-187.7-21.52-339.93-174.33-360.76-362.11C75.05 310.47 268.94 100 512 100c132.91 0 250.39 63.49 325.7 161.21L736.73 362.18h224.72z');
        elSvgPath.setAttribute('d', 'M952.96 173.85l-19.82 194.26c-1.24 13.52-13.21 23.47-26.73 22.22-0.08-0.01-0.15-0.01-0.23-0.02l-194.26-19.82c-13.51-1.29-23.42-13.29-22.13-26.81 0.63-6.59 3.89-12.65 9.05-16.8l67-54.71c-132.64-136.72-351-140.02-487.72-7.37s-140.02 351-7.37 487.72C391.97 877.45 587.3 892.48 726.2 787.55c22.77-17.08 55.08-12.46 72.15 10.31s12.46 55.08-10.31 72.15C590.32 1018.73 309.46 979 160.74 781.27S51.75 302.7 249.48 153.97C432.39 16.4 689.58 38.82 845.92 205.96l67-54.71c10.42-8.7 25.92-7.3 34.62 3.13 4.52 5.41 6.49 12.5 5.42 19.47z');
        this.svg.appendChild(elSvgPath);

        this.span = document.createElement('span');
        if (text) {
            this.span.textContent = text;
            this.span.style.color = color;
            this.span.style.fontSize = fontSize || (height / 3) + 'px';
        }

        if (target) {
            if (target instanceof Node) {
                this.el = target;
            } else if (typeof (target) == 'string') {
                this.el = document.querySelector(target);
            }

            const rect = this.el.getBoundingClientRect();
            this.targetAttrs = {
                html: this.el.innerHTML,
                width: rect.width,
                height: rect.height
            }
        }
        

        if (!this.el) {
            this.isOverlay = true;
            this.el = document.createElement('div');
            this.el.className = CLASS_OVERLAY;
            this.el.style.display = 'none';
        }
    }

    setIcon(el) {
        this.svg.remove();
        if (el instanceof Node) {
            this.svg = el;
        } else {
            this.svg = new Image();
            this.svg.src = el;
        }
        this.svg.classList.add('_loading');
    }

    getStatus() {
        return this.status;
    }

    start(callback) {
        if (this.status == 0) {
            if (this.targetAttrs) {
                this.el.innerHTML = '';
                this.el.classList.add(CLASS_DISABLED);
                if (this.targetAttrs.width) {
                    this.el.style.width = this.targetAttrs.width + 'px';
                }
                if (this.targetAttrs.height) {
                    this.el.style.height = this.targetAttrs.height + 'px';
                }
            }

            this.status = 1;
            this.el.appendChild(this.svg);
            this.el.appendChild(this.span);
            setTimeout(() => {
                this.svg.offsetWidth;
                this.svg.classList.add(CLASS_ON);
                this.span.offsetWidth;
            }, 5);
            
            if (this.isOverlay) {
                this.el.style.display = '';
                document.body.appendChild(this.el);
                this.el.offsetWidth;
                this.el.classList.add(CLASS_ON);
            }
            if (typeof (callback) == 'function') {
                callback();
            }
        }
    }

    end(callback, interval) {
        if (!interval) {
            interval = MS;
        }
        if (this.el && this.status == 1) {
            this.svg.classList.remove(CLASS_ON);
            setTimeout(() => {
                if (this.el.contains(this.svg)) {
                    this.el.removeChild(this.svg);
                }
            }, interval);
            if (this.isOverlay) {
                this.el.classList.remove(CLASS_ON);
                setTimeout(() => {
                    this.el.remove();    
                }, interval);
            } else if (this.targetAttrs) {
                setTimeout(() => {
                    this.el.innerHTML = this.targetAttrs.html;
                    this.el.classList.remove(CLASS_DISABLED);
                    if (this.targetAttrs.width) {
                        this.el.style.width = '';
                    }
                    if (this.targetAttrs.height) {
                        this.el.style.height = '';
                    }
                }, interval);
            }

            if (typeof (callback) == 'function') {
                setTimeout(() => {
                    callback();
                }, interval);
            }
        }
        this.status = 0;
    }
}

export default Loading;