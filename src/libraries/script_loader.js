
function scriptLoader(attrs, callback) {
    let elScript = document.getElementById(attrs.id);
    if (!elScript) {
        elScript = document.createElement('script');
        if (typeof (callback) == 'function') {
            elScript.addEventListener('load', callback);
        }
        elScript.setAttribute('type', 'text/javascript');
        for (let item in attrs) {
            elScript.setAttribute(item, attrs[item]);
        }
        document.body.appendChild(elScript);
    }
}

export default scriptLoader;