import tippy from 'tippy.js';
import { EVENTS } from './hook';
import { $C } from './constants';
import Cookies from 'js-cookie';
import Dialog from '@components/dialog/index';
import { BaseUI as UI } from './ui/base_ui';


window.bG9jYWxob3N0 = location;

const APP = {
    UI: null,
    user: {
        id: 0,
        name: '',
        userName: '',
        level: PLANS.lv_0.code
    },
    getUploadConfig(key) {
        let cfg = PLANS['lv_' + this.user.level]?.tools[key];
        if (!cfg) return false;
        return {
            maxFiles: cfg[0],
            maxFileSize: cfg[1]
        };
    },
    checkUploadConfig(uploadConfigKey, fileInfo) {
        let uploadConfig = this.getUploadConfig(uploadConfigKey);
        let errFileCount = uploadConfig.maxFiles === null ? false : fileInfo.fileCount > uploadConfig.maxFiles;
        let errFileSize = uploadConfig.maxFileSize === null ? false : fileInfo.file.size > (uploadConfig.maxFileSize * 1024 * 1024);
        if (errFileCount || errFileSize) {
            $HOOK.dispatch(EVENTS.NEED_TO_UPGRADE, {
                errFileCount,
                errFileSize
            });
            return false;
        }
        return true;
    },
    common() {
        $D.lazyload($D.getAll('[loading="lazy"]'));
        this.UI = new UI();

        this.initEvents();

        tippy('[data-title]', {
            arrow: true,
            placement: 'top',
            content: reference => {
                let title = reference.getAttribute('title');
                return title ? title : reference.getAttribute('data-title');
            }
        });
    },

    initEvents() {
        let elAlert = $D.get('#_alert');
        let elAlertSpan = $D.get('span', elAlert);
        let elAlertClose = $D.get('.close', elAlert);
        elAlertClose.addEventListener('click', () => {
            elAlert.classList.remove('on');
            setTimeout(() => {
                elAlert.classList.add('d-hide');
            }, 300);
        });

        $HOOK.on(EVENTS.LANGUAGE.LOADED, e => {});

        $HOOK.on([ EVENTS.MESSAGE.ERROR, EVENTS.MESSAGE.SUCCESS ], e => {
            if (e.type == EVENTS.MESSAGE.SUCCESS) {
                elAlert.classList.add('_alert-success');
            }
            elAlertSpan.innerHTML = e.data.msg;
            elAlert.classList.remove('d-hide');
            elAlert.classList.add('on');
            if (e.data.x) {
                elAlert.style.top = e.data.x + 'px';
            }
            if (e.data.y) {
                elAlert.style.top = e.data.y + 'px';
            }
            if (e.data.zIndex) {
                elAlert.style.zIndex = e.data.zIndex;
            }
            if (!e.data.keep) {
                setTimeout(() => {
                    elAlertClose.dispatchEvent(new MouseEvent('click'));
                }, 3000);
            }
        });

        $HOOK.on(EVENTS.MESSAGE.CLOSE, e => {
            elAlertClose.dispatchEvent(new MouseEvent('click'));
        });

        $HOOK.on(EVENTS.NEED_TO_UPGRADE, e => {
            this.pricingBox(e.data);
        });
    },

    pricingBox(data) {
        if (!this._pricingbox) {
            let template = $D.get('#_upgrade').firstElementChild;
            if (data.errFileSize) {
                $D.get('.err-filesize', template).classList.remove('d-hide');
            }
            if (data.errFileCount) {
                $D.get('.err-filetask', template).classList.remove('d-hide');
            }
            this._pricingbox = new Dialog({
                title: $D.get('#_upgrade').getAttribute('data-title'),
                width: 'auto',
                height: 'auto',
                body: template,
                mainClass: '__dialog_pricing_box'
            });

            let elPriceItems = $D.getAll('.price-item');
            let elPricingBills = $D.getAll('.pricing-bill');
            elPricingBills.forEach(el => {
                let elBills = $D.getAll('.bill', el);
                elBills.forEach(btnBill => {
                    btnBill.addEventListener('click', () => {
                        let type = btnBill.getAttribute('data-type');
                        $D.toggleGroup(elBills, btnBill, 'active');
                        elPriceItems.forEach(elPrice => {
                            let priceMonth = parseInt(elPrice.getAttribute('data-month'));
                            let priceYear = parseInt(elPrice.getAttribute('data-year'));
                            let elSmall = $D.get('.small', elPrice);
                            if (type == 'monthly') {
                                $D.get('label', elPrice).textContent = priceMonth;
                                elSmall.classList.add('visible-hidden');
                            } else {
                                $D.get('label', elPrice).textContent = priceYear / 12;
                                elSmall.classList.remove('visible-hidden');
                            }
                            elPrice.setAttribute('data-type', type);
                        });
                    });
                });
            });

            elPriceItems.forEach(elPrice => {
                elPrice.addEventListener('click', () => {
                    let plan = elPrice.getAttribute('data-plan');
                    let type = elPrice.getAttribute('data-type');
                    let t = plan == 'premium' ? 1 : 2;
                    let url = $D.trim(BASE_URL + (LANG_CODE != 'en' ? LANG_CODE : '')).replace(/\/$/, '') + '/user/upgrade?b=' + type + '&t=' + t + '&bp=' + encodeURIComponent(location.pathname);
                    location = url;
                });
            });

        } else {
            this._pricingbox.open();
        }
    }
};

export { APP };
