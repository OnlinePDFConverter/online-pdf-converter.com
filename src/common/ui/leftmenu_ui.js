import { BaseUI } from './base_ui';
import { EVENTS } from '../hook';
import SliderBar from '@components/sliderbar';
import Collapse from '@components/collapse';

let responsiveMenusLeft = null;

class LeftMenuUi extends BaseUI {
    constructor() {
        super();
        this.elLeftBox = $D.get('#left-box');
        this.responsiveLeft();
        this.initLeftNavs(this.elLeftBox);
    }

    initLeftNavs(elLeftBox) {
        if (!elLeftBox) {
            return;
        }
        let elLeftNavExpand = $D.get('#btn-left-nav-expand', elLeftBox);
        if (elLeftNavExpand) {
            elLeftNavExpand.addEventListener('click', () => {
                let status = $D.toggleCss(elLeftBox, 'expand');
                $HOOK.dispatch(EVENTS.LEFT_NAV_COLLAPSED, {
                    status
                });
            });
        }

        let elNavItems = $D.getAll('.nav-item', elLeftBox);
        elNavItems.forEach(navItem => {
            let elLeftNav = $D.get('.left-nav');
            let elBottomNav = $D.get('.bottom-nav');

            navItem.addEventListener('mouseenter', e => {
                if (elLeftBox.classList.contains('expand')) return;
                let elChildItem = $D.get('.nav-item-child-wrapper', navItem);
                elChildItem.style.display = 'block';
                let rect = navItem.getBoundingClientRect();
                let srcollWidth = navItem.parentElement == elBottomNav ? 0 : elLeftNav.offsetWidth - elLeftNav.clientWidth;
                let width = navItem.offsetWidth;
                if (elLeftBox.classList.contains('pos-right')) {
                    elChildItem.style.right = width + srcollWidth + 'px';
                } else {
                    elChildItem.style.left = width + 'px';
                }

                if (navItem.classList.contains('direct-top')) {
                    let top = rect.top - elChildItem.offsetHeight + navItem.offsetHeight;
                    elChildItem.style.top = top + 'px';
                } else {
                    let top = (rect.top + elChildItem.offsetHeight) >  window.innerHeight ? rect.bottom - elChildItem.offsetHeight : rect.top;
                    elChildItem.style.top = (top < 100 ? rect.top : top) + 'px';
                }
            });
            navItem.addEventListener('mouseleave', () => {
                if (elLeftBox.classList.contains('expand')) return;
                let elChildItem = $D.get('.nav-item-child-wrapper', navItem);
                elChildItem.style.display = 'none';
                elChildItem.style.top = '';
                elChildItem.style.left = '';
                elChildItem.style.right = '';
            });


            let elChildNavItemsWrapper = $D.get('.nav-item-child-wrapper', navItem);
            if (!elChildNavItemsWrapper) {
                elChildNavItemsWrapper = $D.create('div', {
                    class: 'nav-item-child-wrapper'
                });

                let elChildNavItems = $D.get('.nav-item-child', navItem);
                if (!elChildNavItems) {
                    elChildNavItems = $D.create('div', {
                        class: 'nav-item-child'
                    });
                    $D.append(elChildNavItems, elChildNavItemsWrapper);
                }
                let elChildTitle = $D.get('a', navItem).cloneNode(true);
                elChildTitle.classList.add('child-title');
                let i = $D.get('i', elChildTitle);
                if (i) {
                    i.remove();
                }
                $D.append(elChildTitle, elChildNavItems);
                $D.append(elChildNavItemsWrapper, navItem);
                return;
            };
            let elChildTitle = $D.get('.child-title', navItem);
            if (!elChildTitle) {
                elChildTitle = $D.get('a', navItem).cloneNode(true);
                // elChildTitle.removeAttribute('data-scroll-target');
                elChildTitle.classList.add('child-title');
                let i = $D.get('i', elChildTitle);
                if (i) {
                    i.remove();
                }
                $D.prepend(elChildTitle, $D.get('.nav-item-child', elChildNavItemsWrapper));
            }
            const collapse = new Collapse(elChildNavItemsWrapper, {
                direction: 'bottom',
                onOpen: () => {
                    navItem.setAttribute('data-expand', true);
                },
                onClose: () => {
                    navItem.setAttribute('data-expand', false);
                }
            });
            if (navItem.classList.contains('active')) {
                let navItemStatus = navItem.getAttribute('data-expand');
                if (navItemStatus === null) {
                    navItem.setAttribute('data-expand', true);
                    if (elLeftBox.classList.contains('expand')) {
                        collapse.open();
                    }
                } else if (navItemStatus == 'true') {
                    elChildNavItemsWrapper.style.transitionDuration = '500ms';
                    elChildNavItemsWrapper.style.height = elChildNavItemsWrapper.offsetHeight + 'px';
                    elChildNavItemsWrapper.classList.add('fold-bottom');
                    collapse.status = true;
                }
            } else {
                navItem.setAttribute('data-expand', false);
            }

            $D.get('a', navItem).addEventListener('click', e => {
                if (!elLeftBox.classList.contains('expand')) {
                    return;
                };
                // let isMobile = true;
                // let elChildItem = $D.get('.nav-item-child-wrapper[data-expand]', navItem);
                // try {
                //     document.createEvent('TouchEvent');
                // } catch (err) {
                //     isMobile = false;
                // }
                // if (isMobile && elChildItem) {
                //     e.preventDefault();
                // }
                if (e.currentTarget.classList.contains('childitems')) {
                    collapse.toggle();
                    e.preventDefault();
                }
            });
            $HOOK.on(EVENTS.LEFT_NAV_COLLAPSED, () => {
                collapse.close();
            });
        });
    }

    responsiveLeft() {
        if (!responsiveMenusLeft && this.elLeftBox) {
            let elSvg = $D.get('.responsive-menus-left svg');
            if (!elSvg) return;

            responsiveMenusLeft = this.elLeftBox.cloneNode(true);
            responsiveMenusLeft.removeAttribute('id');
            responsiveMenusLeft.classList.add('__sliderbar', 'header-body');
            $D.get('.logo', responsiveMenusLeft)?.classList.remove('d-hide');
            const slide = new SliderBar({
                containerClass: 'left-slider',
                direction: 'right',
                onOpen: e => {
                    responsiveMenusLeft.classList.add('expand');
                    responsiveMenusLeft.style.display = 'flex';
                },
                onClose: e => {
                    responsiveMenusLeft.classList.remove('expand');
                    responsiveMenusLeft.style.display = '';
                }
            });
            elSvg.addEventListener('click', e => {
                slide.open();
            });

            responsiveMenusLeft.addEventListener('click', e => {
                if (e.currentTarget == e.target) {
                    elSvg.dispatchEvent(new MouseEvent('click'));
                }
            });
            slide.setContent(responsiveMenusLeft);
            this.initLeftNavs(responsiveMenusLeft);
        }
    }

    scrollWithHeader() {
        let bgClass = 'bg-wrapper';
        let fixedClass = 'fixed';
        let elHeaderWrapper = $D.get('.' + bgClass);
        if (elHeaderWrapper) {
            let elBodyBox = null;
            if (this.elBodyBox) {
                elBodyBox = this.elBodyBox.firstElementChild;
            }
            let offsetHeight = elHeaderWrapper.offsetHeight - this.elHeader.offsetHeight;
            this.elMainBox.addEventListener('scroll', e => {
                if (e.target.scrollTop > 10) {
                    elHeaderWrapper.classList.remove(bgClass);
                } else {
                    elHeaderWrapper.classList.add(bgClass);
                }
                if (e.target.scrollTop > this.elHeader.offsetHeight) {
                    // this.elHeader.style.width = this.elMainBox.scrollWidth + 'px';
                    //this.elHeader.style.width = (this.elMainBox.offsetWidth - (this.elMainBox.scrollWidth - this.elMainBox.clientWidth)) + 'px';
                    this.elHeader.style.width = (this.elMainBox.scrollWidth - (this.elMainBox.scrollWidth - this.elMainBox.clientWidth)) + 'px';
                    if (e.target.scrollTop > offsetHeight) {
                        this.elHeader.classList.add(fixedClass);
                        elBodyBox.style.paddingTop = this.elHeader.offsetHeight + 'px';
                    }
                } else {
                    this.elHeader.classList.remove(fixedClass);
                    this.elHeader.style.width = '';
                    elBodyBox.style.paddingTop = '';
                }
            });
            window.addEventListener('resize', () => {
                this.elHeader.style.width = this.elMainBox.clientWidth + 'px';
            });

            $HOOK.on(EVENTS.LEFT_NAV_COLLAPSED, () => {
                // if (!e.data.status) {
                    setTimeout(() => {
                        this.elHeader.style.width = this.elMainBox.clientWidth + 'px';
                    }, 550);
                // }
            });
        }
    }
}

export { LeftMenuUi };