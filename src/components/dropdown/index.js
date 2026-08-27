import './index.css';

const CONTAINER_CLASS = '__select';
const SELECTED_CLASS = '__selected';
const SHOW_CLASS = '_show';
const ICON_CLASS = '__icon';
const TEXT_CLASS = '__text';
const INITED_CLASS = '__select_inited';

class Dropdown {
    constructor(selector, options) {
        this.elSelect = selector instanceof Node ? selector : document.querySelector(selector);
        this.elSelect.style.display = 'none';

        this._keyEvents = e => {
            return this.keyEvents(e);
        }

        if (options.container) {
            this.elContainer = options.container;
        } else {
            this.elContainer = document.createElement('div');
            this.elSelect.parentNode.insertBefore(this.elContainer, this.elSelect);
        }

        this.elContainer.classList.add(CONTAINER_CLASS);
        this.options = {
            containerClass: null,
            onClick: e => {},
            onChange: value => {}
        };
        if (options) {
            this.options = Object.assign(this.options, options);
        }
        
        this.elContainer.addEventListener('click', e => {
            e.stopPropagation();
            if (this.elListBox.classList.contains(SHOW_CLASS)) {
                this.close();
            } else {
                this.elListBox.classList.add(SHOW_CLASS);
                window.addEventListener('click', () => {
                    if (this.elListBox.classList.contains(SHOW_CLASS)) {
                        this.close();
                    }
                }, { once: true });
                window.addEventListener('keyup', this._keyEvents);
            }
            this.options.onClick(e);
        });

        if (!(this.elDivSelected = this.elContainer.querySelector('.' + SELECTED_CLASS))) {
            this.elDivSelected = this.elContainer.querySelector('div') || document.createElement('div');
            this.elDivSelected.classList.add(SELECTED_CLASS);
            this.elContainer.appendChild(this.elDivSelected);
        }
        
        if (this.options.containerClass) {
            this.elContainer.classList.add(this.options.containerClass);
        }
        
        this.elListBox = document.createElement('ul');
        this.elContainer.appendChild(this.elListBox);
        this.elListOptions = [];

        this.elSelect.querySelectorAll('option').forEach((option, i) => {
            let elOption = document.createElement('li');
            elOption.setAttribute('data-value', option.value);
            let elText = document.createElement('div');
            elText.classList.add(TEXT_CLASS);
            elText.textContent = option.textContent;
            elOption.appendChild(elText);

            let icon = option.getAttribute('data-icon');
            if (icon) {
                const img = document.createElement('img');
                img.setAttribute('src', icon);
                img.classList.add(ICON_CLASS);
                elOption.insertBefore(img, elOption.firstChild);
            }

            elOption.addEventListener('click', e => {
                e.stopPropagation();
                this.elSelect.value = option.value;
                this.value = option.value;
                this.options.onChange(this.value, option);
            });
            this.elListOptions.push(elOption);
            this.elListBox.appendChild(elOption);
        });
        this.value = this.elSelect.value;
        this.elContainer.classList.add(INITED_CLASS);
    }

    get value() {
        return this.elSelect.value;
    }
    
    set value(val) {
        if (this.elListBox.classList.contains(SHOW_CLASS)) {
            this.close();
        }
        this.elSelect.value = val;
        let option = this.elSelect[this.elSelect.selectedIndex];
        this.elDivSelected.textContent = option.textContent;
        let icon = option.getAttribute('data-icon');
        if (icon) {
            const img = document.createElement('img');
            img.setAttribute('src', icon);
            img.classList.add(ICON_CLASS);
            this.elDivSelected.insertBefore(img, this.elDivSelected.firstChild);
        }
        this.elListBox.querySelector('li.' + SELECTED_CLASS)?.classList.remove(SELECTED_CLASS);
        this.elListOptions[this.elSelect.selectedIndex]?.classList.add(SELECTED_CLASS);
    }

    close() {
        this.elListBox.classList.remove(SHOW_CLASS);
        window.removeEventListener('keyup', this._keyEvents);
    }

    keyEvents(e) {
        switch (e.key) {
            case 'Escape':
                this.close();
        }
    }
}

export default Dropdown;