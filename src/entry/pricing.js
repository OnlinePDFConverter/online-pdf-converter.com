import './common';
import '@css/pricing.css';
import Collapse from '@components/collapse';

let elPriceItems = $D.getAll('.price-item');
let elPricingBills = $D.getAll('.pricing-bill');
elPricingBills.forEach(el => {
    let elBills = $D.getAll('.bill', el);
    elBills.forEach(btnBill => {
        btnBill.addEventListener('click', () => {
            billClickEvent(elPriceItems, elBills, btnBill);
        });
    });
});



let collapses = {
    tools: [],
    filesize: [],
    process: []
};
$D.getAll('.collapse').forEach(elItem => {
    let collapse = new Collapse($D.get('.collapse-desc', elItem), {
        direction: 'bottom',
        duration: 200
    });
    let group = elItem.getAttribute('data-group');
    collapses[group].push(collapse);
    
    let elBtn = $D.get('.collapse-btn', elItem);
    elBtn.addEventListener('click', () => {
        collapses[group].forEach(c => c.toggle());
    });
});

$D.getAll('.accordion-item').forEach(elItem => {
    let elBtn = $D.get('.accordion-title', elItem);
    let collapse = new Collapse($D.get('.accordion-content', elItem), {
        direction: 'bottom',
        duration: 200,
        onOpen: () => {
            elBtn.classList.add('accordion-opened');
        },
        onClose: () => {
            elBtn.classList.remove('accordion-opened');
        }
    });
    elBtn.addEventListener('click', () => collapse.toggle());
});

function billClickEvent(elPriceItems, elBills, btnBill, relClick) {
    let type = btnBill.getAttribute('data-type');
    $D.toggleGroup(elBills, btnBill, 'active');
    if (!relClick) {
        //触发另一组相同的按钮事件
        let group = btnBill.getAttribute('data-group') == "1" ? "2" : "1";
        let groupItems = $D.getAll('.bill[data-group="'+ group +'"]');
        billClickEvent(elPriceItems, groupItems, $D.get('.bill[data-group="'+ group +'"][data-type="'+ type +'"]'), true);
    }
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
        
        if (elPrice.classList.contains('plan-premium') || elPrice.classList.contains('plan-unlimited')) {
            let elLink = $D.get('a', elPrice);
            let url = elLink.getAttribute('href');
            url = url.replace(/b\=[\w][^&]+/ig, 'b=' + type);
            elLink.setAttribute('href', url);
        }
    });
}