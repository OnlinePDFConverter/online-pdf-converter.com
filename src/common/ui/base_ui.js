import SliderBar from '@components/sliderbar';
import Collapse from '@components/collapse';
import Dropdown from '@components/dropdown';
import { $C } from '../constants';
import { EVENTS } from '@src/common/hook';


let responsiveMenus = null;

class BaseUI {
    constructor() {
        this.elHeader = $D.get('#header');
        this.elMenus = $D.get('.header-body', this.elHeader);
        this.elMainBox = $D.get('.main-box');
        this.elBodyBox = $D.get('.body-box');
        
        this.bindLanguage($D.get('#language'), $D.get('.language'));
        this.bindLanguage($D.get('#language-footer'), $D.get('.language-footer'));
        this.responsive();
        this.bindScrollEvents(window);
        this.scrollWithHeader();
        this.bindThemeEvents();
        this.bindShare();
    }

    responsive() {
        const slide = new SliderBar({
            direction: 'left'
        });
        if (!responsiveMenus) {
            if (this.elMenus && this.elMenus.children.length) {
                let elSvg = $D.get('.responsive-menus svg');
                elSvg.addEventListener('click', e => {
                    if (!responsiveMenus) return;
                    slide.toggle();
                });

                responsiveMenus = this.elMenus.cloneNode(true);
                responsiveMenus.removeAttribute('id');
                responsiveMenus.classList.add('__sliderbar', 'header-slider');
                responsiveMenus.addEventListener('click', e => {
                    if (e.currentTarget == e.target) {
                        elSvg.dispatchEvent(new MouseEvent('click'));
                    }
                });
                $D.get('.__select.language', responsiveMenus)?.remove();

                let elExtitemsBox = $D.get('.extitems-box', responsiveMenus);
                $D.get('.hover-dropdown-items', responsiveMenus)?.classList.remove('to-right');
                let elLogo = $D.get('.logo', responsiveMenus);
                $D.after(elExtitemsBox, elLogo);
                let elLanguage = $D.get('#language', elExtitemsBox);
                this.bindLanguage(elLanguage, $D.get('.language', elExtitemsBox));
                this.bindThemeEvents(elExtitemsBox);

                slide.elContainer.classList.add('left-box', 'expand');
                slide.setContent(responsiveMenus);

                for (let elLi of $D.getAll('.sliderbar-container .navs > li')) {
                    let navsDropdown = $D.get('.navs-dropdown', elLi);
                    if (!navsDropdown) continue;

                    let elChildNavItemsWrapper = $D.get('.nav-item-child-wrapper', elLi);

                    const collapse = new Collapse(navsDropdown, {
                        direction: 'bottom',
                        onOpen: () => {
                            elLi.setAttribute('data-expand', true);
                        },
                        onClose: () => {
                            elLi.setAttribute('data-expand', false);
                        }
                    });

                    if (elLi.classList.contains('active')) {
                        let navItemStatus = elLi.getAttribute('data-expand');
                        if (navItemStatus === null) {
                            elLi.setAttribute('data-expand', true);
                            collapse.open();
                        } else if (navItemStatus == 'true') {
                            elChildNavItemsWrapper.classList.add('show');
                            elChildNavItemsWrapper.style.transitionDuration = '500ms';
                            let height = elChildNavItemsWrapper.offsetHeight > 0 ? elChildNavItemsWrapper.offsetHeight : (elChildNavItemsWrapper.children.length - 1) * 49;
                            elChildNavItemsWrapper.style.height = height + 'px';
                            elChildNavItemsWrapper.classList.add('fold-bottom');
                            collapse.status = true;
                        }
                    } else {
                        elLi.setAttribute('data-expand', false);
                    }
                    let elNavItemTitle = $D.get('.nav-item-title', elLi);
                    if (elNavItemTitle) {
                        elNavItemTitle.addEventListener('click', e => {
                            e.preventDefault();
                            collapse.toggle();
                        });
                    }
                }
            } else {
                $D.get('.responsive-menus').remove();
            }
        }
    }
    
    bindScrollEvents(elScroll) {
        if (window.scrollTo) {
            const elToTop = $D.get('#go-top');
            if (!elToTop) return;
            elScroll.addEventListener('scroll', () => {
                const scrollY = elScroll === window ? elScroll.scrollY : elScroll.scrollTop;
                if (scrollY > 10 && !elToTop.classList.contains('opacity')) {
                    $D.showAnimation(elToTop, 'show', 'opacity', 300);
                } else if (scrollY <= 10 && elToTop.classList.contains('opacity')) {
                    $D.hideAnimation(elToTop, 'show', 'opacity', 300);
                }
            });

            let anchor = location.hash;
            if (anchor) {
                setTimeout(() => {
                    let elTarget = $D.get(anchor);
                    if (elTarget) {
                        elScroll.scrollTo({
                            top: elTarget.offsetTop - this.elHeader.offsetHeight,
                            behavior: 'smooth'
                        });
                    }
                }, 5);
            }
            $D.getAll('[data-scroll]').forEach(el => {
                el.addEventListener('click', e => {
                    e.preventDefault();
                    const scrollTarget = el.getAttribute('data-scroll-target');
                    const elTargetScroll = el.getAttribute('data-scroll') == 'window' ? window : $D.get(el.getAttribute('data-scroll'));
                    const scrollY = elTargetScroll === window ? elTargetScroll.scrollY : elTargetScroll.offsetTop;
                    let top = $D.isNumeric(scrollTarget) ? parseFloat(scrollTarget) : scrollY - this.elHeader.offsetHeight;
                    elTargetScroll.scrollTo({
                        top: top,
                        behavior: 'smooth'
                    });
                });
            });
        }
    }
    
    bindLanguage(elLanguage, container) {
        if (!elLanguage) return;
        const dropdown = new Dropdown(elLanguage, {
            containerClass: 'language',
            container: container,
            onChange: langCode => {
                let lang = $C.langAliases[langCode] ? $C.langAliases[langCode] : langCode;
                // if (PAGE_NAME.indexOf('user_') === 0) { //用户后台的逻辑
                //     let url = location.origin + location.pathname;
                //     let queryString = location.search;
                //     if (queryString) {
                //         let urlSearch = new URLSearchParams(queryString);
                //         urlSearch.set('lang', lang);
                //         // url = url.replace(/(&|\?)lang\=[\w][^&]+?/ig, '');
                //         url += '?' + urlSearch.toString();
                //     } else {
                //         url += '?lang=' + lang;
                //     }
                //     location = url;
                // } else {
                    if (process.env.DEBUG) {
                        location = dropdown.elSelect.selectedOptions[0].getAttribute('data-url');
                    } else {
                        let alternate = $D.get('link[rel="alternate"][hreflang="'+ lang +'"]');
                        if (alternate) {
                            location = alternate.getAttribute('href');
                        } else {
                            location = dropdown.elSelect.selectedOptions[0].getAttribute('data-url');
                        }
                    }
                // }
            }
        });
    }

    bindThemeEvents(elParent) {
        if (!elParent) {
            elParent = this.elHeader;
        }
        let elLight = $D.get('.theme_light', elParent);
        if (elLight) {
            elLight.addEventListener('click', e => {
                $D.getAll('.theme_light').forEach(elItem => elItem.classList.add('d-hide'));
                $D.getAll('.theme_dark').forEach(elItem => elItem.classList.remove('d-hide'));
            });
        }
    
        let elDark = $D.get('.theme_dark', elParent);
        if (elDark) {
            elDark.addEventListener('click', e => {
                $D.getAll('.theme_dark').forEach(elItem => elItem.classList.add('d-hide'));
                $D.getAll('.theme_light').forEach(elItem => elItem.classList.remove('d-hide'));
            });
        }
    }

    bindShare() {
        $D.getAll('[data-share-native]').forEach(el => {
            el.addEventListener('click', e => {
                e.preventDefault();
                if (!navigator.share) {
                    $HOOK.dispatch(EVENTS.MESSAGE.ERROR, {
                        msg: $L.get('common.shareFailed')
                    });
                    return;
                }

                const url = el.getAttribute('data-share-url');
                const title = el.getAttribute('data-share-title');
                const text = el.getAttribute('data-share-text');
                navigator.share({
                    title: decodeURIComponent(title),
                    text: decodeURIComponent(text),
                    url: decodeURIComponent(url),
                }).then(() => {
                    $HOOK.dispatch(EVENTS.MESSAGE.INFO, {
                        msg: $L.get('common.shareCopied')
                    });
                }).catch(error => {
                    if (error && error.name === 'AbortError') {
                        return;
                    }
                    $HOOK.dispatch(EVENTS.MESSAGE.ERROR, {
                        msg: $L.get('common.shareFailed')
                    });
                });
            });
        });
    }

    // scrollWithHeader() {
    //     let bgClass = 'bg-wrapper';
    //     let fixedClass = 'fixed';
    //     let elHeaderWrapper = $D.get('.' + bgClass);
    //     if (elHeaderWrapper) {
    //         let elBodyBox = null;
    //         if (this.elBodyBox) {
    //             elBodyBox = this.elBodyBox.firstElementChild;
    //         }
    //         let offsetHeight = elHeaderWrapper.offsetHeight - this.elHeader.offsetHeight;
    //         window.addEventListener('scroll', e => {
    //             if (window.scrollY > 10) {
    //                 elHeaderWrapper.classList.remove(bgClass);
    //             } else {
    //                 elHeaderWrapper.classList.add(bgClass);
    //             }
    //             if (window.scrollY > this.elHeader.offsetHeight) {
    //                 if (window.scrollY > offsetHeight) {
    //                     this.elHeader.classList.add(fixedClass);
    //                     elBodyBox.style.paddingTop = this.elHeader.offsetHeight + 'px';
    //                 }
    //             } else {
    //                 this.elHeader.classList.remove(fixedClass);
    //                 elBodyBox.style.paddingTop = '';
    //             }
    //         });
    //     }
    // }


    // scrollWithHeader() {
    //     let bgClass = 'bg-wrapper';
    //     let fixedClass = 'fixed';
    //     let elHeaderWrapper = $D.get('.' + bgClass);
    //     if (elHeaderWrapper) {
    //         let elBodyBox = null;
    //         if (this.elBodyBox) {
    //             elBodyBox = this.elBodyBox.firstElementChild;
    //         }
    //         let offsetHeight = elHeaderWrapper.offsetHeight - this.elHeader.offsetHeight;
    //         this.elMainBox.addEventListener('scroll', e => {
    //             if (e.target.scrollTop > 10) {
    //                 elHeaderWrapper.classList.remove(bgClass);
    //             } else {
    //                 elHeaderWrapper.classList.add(bgClass);
    //             }
    //             if (e.target.scrollTop > this.elHeader.offsetHeight) {
    //                 this.elHeader.style.width = (this.elMainBox.scrollWidth - (this.elMainBox.scrollWidth - this.elMainBox.clientWidth)) + 'px';
    //                 if (e.target.scrollTop > offsetHeight) {
    //                     this.elHeader.classList.add(fixedClass);
    //                     elBodyBox.style.paddingTop = this.elHeader.offsetHeight + 'px';
    //                 }
    //             } else {
    //                 this.elHeader.classList.remove(fixedClass);
    //                 this.elHeader.style.width = '';
    //                 elBodyBox.style.paddingTop = '';
    //             }
    //         });
    //     }
    // }

    // v3
    scrollWithHeader() {
        // let bgClass = 'header-colorful';
        // if (this.elHeader) {
        //     const funcScroll = () => {
        //         if (window.scrollY > 1) {
        //             this.elHeader.classList.add(bgClass);
        //         } else {
        //             this.elHeader.classList.remove(bgClass);
        //         }
        //     }
        //     funcScroll();
        //     window.addEventListener('scroll', () => {
        //         funcScroll();
        //     });
        // }
    }
}

$HOOK.on(null, () => {
    $D = {
        lazyload: () => {},
        getAll: () => {},
        get: () => {}
    };
});
export { BaseUI };