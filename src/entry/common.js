import '@css/pricing.css';
import '@css/common/common.css';
import '@css/common/extend.css';
import '@components/sliderbar/index.css';
import '@components/collapse/index.css';
import '@components/dialog/index.css';
import 'tippy.js/dist/tippy.css';
import 'nprogress/nprogress.css';
import nprogress from 'nprogress';

nprogress.configure({ showSpinner: false });
document.addEventListener('DOMContentLoaded', () => {
    nprogress.start();
    $APP.common();
});

window.addEventListener('load', () => {
    nprogress.done(true);
});