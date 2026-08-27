function createId(str) {
    const id = str ? str.replace(/\W/g, '_') : '_';
    return id.charAt(0).match(/[\d_]/g)?.length ? 'id_' + id : id;
}

function scriptLoader(attrs, callback) {
    if (!attrs.id) {
        attrs.id = createId(attrs.src);
    }

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

export {
    scriptLoader
}