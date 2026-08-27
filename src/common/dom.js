const DOM = {
    get(selector, parent, n) {
        let el = parent ? parent : document;
        if (typeof(el) == 'string') {
            el = document.querySelector(el);
        }
        if (n !== undefined) {
            selector += ':nth-child('+ n +')';
        }
        try {
            return el.querySelector(selector);
        } catch(e) {
            return false;
        }
    },

    getAll(selector, parent) {
        let el = parent ? parent : document;
        if (typeof(el) == 'string') {
            el = DOM.get(el);
        }
        return el.querySelectorAll(selector);
    },

    create(dom, attrs) {
        const el = document.createElement(dom);
        if (attrs) {
            let keys = Object.keys(attrs);
            for (let i = 0; i < keys.length; i++) {
                let key = keys[i];
                el.setAttribute(key, attrs[key]);
            }
        }
        return el;
    },

    createFromHTML(htmlString) {
        const elTemp = document.createElement('div');
        elTemp.innerHTML = typeof(htmlString) == 'function' ? htmlString() : htmlString;
        if (elTemp.childElementCount > 1) {
            return elTemp;
        }
        return elTemp.firstElementChild ? elTemp.firstElementChild : elTemp;
    },

    before(newElement, targetElement) {
        if (targetElement.insertAdjacentElement) {
            targetElement.insertAdjacentElement('beforebegin', newElement);
        } else {
            targetElement.parentNode.insertBefore(newElement, targetElement);
        }
    },

    after(newElement, targetElement) {
        if (targetElement.insertAdjacentElement) {
            targetElement.insertAdjacentElement('afterend', newElement);
        } else {
            targetElement.parentNode.insertBefore(newElement, targetElement.nextElementSibling);
        }
    },

    prepend(newElement, targetElement) {
        if (targetElement.insertAdjacentElement) {
            targetElement.insertAdjacentElement('afterbegin', newElement);
        } else {
            targetElement.insertBefore(newElement, targetElement.firstElementChild);
        }
    },

    append(newElement, targetElement) {
        if (targetElement.insertAdjacentElement) {
            targetElement.insertAdjacentElement('beforeend', newElement);
        } else {
            targetElement.appendChild(newElement);
        }
    },

    lazyload(elements) {
        const { default: _lazyload } = require('@libs/lazyload');
        return new _lazyload({
            selector: elements,
            threshold: 0.3
        }, (entry, observer) => {
            let dataSrc = entry.target.getAttribute('data-src');
            if (!dataSrc) {
                return;
            }
            let elContainer = entry.target;
            elContainer.removeAttribute('data-src');
            let elImg = null;
            if (elContainer instanceof Image) {
                elImg = elContainer;
            } else {
                elImg = DOM.create('img');
                elContainer.appendChild(elImg);
            }
            elImg.addEventListener('load', e => {
                elImg.classList.add('loaded');
            });
            elImg.src = dataSrc;
            observer.unobserve(elContainer);
        });
    },

    trim(str) {
        if (String.prototype.trim) {
            return str.trim();
        }
        return str.replace(/^\s+|\s+$/g, '');
    },

    empty(element) {
        while (element.firstElementChild) {
            element.removeChild(element.firstElementChild);
        }
    },

    cursorToEnd(dom) {
        dom.focus();
        let selection = window.getSelection();
        selection.selectAllChildren(dom);
        selection.collapseToEnd();
    },

    textSelected(dom) {
        let selection = window.getSelection();
        let range = document.createRange();
        range.selectNodeContents(dom);
        selection.removeAllRanges();
        selection.addRange(range);
        if (dom.select) {
            dom.select();
        }
    },

    toggleCss(element, className) {
        let status = element.classList.contains(className);
        if (status) {
            element.classList.remove(className);
        } else {
            element.classList.add(className);
        }
        return !status;
    },

    toggleDisplay(element, valDisplay) {
        if (!valDisplay) {
            valDisplay = '';
        }
        element.style.display = (element.style.display != 'none' ? 'none' : valDisplay);
    },
    
    toggleGroup(elements, element, className) {
        if (!className) {
            className = 'active';
        }

        let status = false;
        if (element.classList.contains(className)) {
            return status;
        }
        
        if (typeof(elements.forEach) == 'function') {
            elements.forEach(el => {
                if (el == element) {
                    status = this.toggleCss(el, className);
                } else {
                    el.classList.remove(className);
                }
            });
        } else {
            status = this.toggleCss(element, className);
        }
        return status;
    },

    toggleAnimation(targetElement, showClass, processClass, time) {
        if (!targetElement.classList.contains(processClass)) {
            this.showAnimation(targetElement, showClass, processClass);
        } else {
            this.hideAnimation(targetElement, showClass, processClass, time);
        }
    },

    showAnimation(targetElement, showClass, processClass) {
        targetElement.classList.add(showClass);
        targetElement.offsetWidth;
        targetElement.classList.add(processClass);
        targetElement.classList.remove(showClass);
    },

    hideAnimation(targetElement, showClass, processClass, time) {
        targetElement.classList.add(showClass);
        targetElement.classList.remove(processClass);
        setTimeout(() => {
            targetElement.classList.remove(showClass);
        }, time);
    },

    isNumeric(val) {
        return !isNaN(parseFloat(val)) && isFinite(val);
    }
};

export { DOM };