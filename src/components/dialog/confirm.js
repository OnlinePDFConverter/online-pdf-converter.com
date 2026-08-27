import Dialog from './index';

class DialogConfirm extends Dialog {
    constructor(options) {
        options.showFooter = true;
        super(options);
        this.order = this.options.order || 'ASC';
        this.elDialogMain.classList.add('__dialog_confirm');
        let btnYesClass = this.options.btnYesClass || '';
        let btnNoClass = this.options.btnNoClass || '';

        this.elContainer = document.createElement('div');
        this.elContainer.className = '__dialog_confirm_buttons';
        if (this.options.elYes) {
            this.elYes = this.options.elYes;
            this.elYes.classList.add('__dialog_confirm_btn', '__dialog_confirm_yes');
            if (btnYesClass) {
                this.elYes.classList.add(btnYesClass);
            }
        } else {
            this.elYes = document.createElement('button');
            this.elYes.textContent = this.options.yes || 'Yes';
            this.elYes.className = '__dialog_confirm_btn __dialog_confirm_yes ' + btnYesClass;
        }
        this.elYes.addEventListener('click', e => {
            e.preventDefault();
            if (typeof(this.options.onYes) == 'function') {
                if (this.options.onYes(this) !== false) {
                    this.close();
                    return;
                }
            } else {
                this.close();
            }
        });

        if (this.options.elNo) {
            this.elNo = this.options.elNo;
            this.elNo.classList.add('__dialog_confirm_btn', '__dialog_confirm_no');
            if (btnNoClass) {
                this.elYes.classList.add(btnNoClass);
            }
        } else {
            this.elNo = document.createElement('button');
            this.elNo.textContent = this.options.no || 'No';
            this.elNo.className = '__dialog_confirm_btn __dialog_confirm_no ' + btnNoClass;
        }
        this.elNo.addEventListener('click', e => {
            e.preventDefault();
            if (typeof(this.options.onNo) == 'function') {
                this.options.onNo(this);
            }
            this.close();
        });

        if (this.order == 'ASC') {
            this.elContainer.appendChild(this.elYes);
            this.elContainer.appendChild(this.elNo);
        } else {
            this.elContainer.appendChild(this.elNo);
            this.elContainer.appendChild(this.elYes);
        }
        this.setFooter(this.elContainer);
    }
}

export default DialogConfirm;