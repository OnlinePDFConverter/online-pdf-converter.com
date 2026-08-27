const $C = require('./webpack.constants');
const path = require('path');
const fs = require('fs');

let rewrites = [];

function createRewrites(routers, target) {
    if (!$C.DEFINES.FILTER_URL_SUFFIX) return rewrites;
    rewrites = [];
    if (target == 'apache') {
        createApache(path.resolve(__dirname, '.htaccess'));
    } else if (target == 'nginx') {
        createNginx(path.resolve(__dirname, '.htaccess_nginx'));
    } else if (target == 'devServer') {
        createDevServer(routers, target);
    }
    return rewrites;
}

function createApache(file) {
    let content = 
`<IfModule mod_headers.c>
    Header always set Content-Security-Policy "frame-ancestors 'self'"
    Header always set X-Frame-Options "SAMEORIGIN"
</IfModule>

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    {{content}}
</IfModule>`;
    fs.writeFileSync(file, content.replace('{{content}}', 'RewriteRule ^([^\.]+)$ $1'+ $C.DEFINES.FILTER_URL_SUFFIX +' [NC,L]'));
}

function createNginx(file) {
    let content =
`location / {
    add_header Content-Security-Policy "frame-ancestors 'self'";
    add_header X-Frame-Options "SAMEORIGIN";
    if (!-e $request_filename) {
        {{content}}
    }
}`;
    fs.writeFileSync(file, content.replace('{{content}}', 'rewrite (?i)^([^\.]+)$ $1'+ $C.DEFINES.FILTER_URL_SUFFIX +' last;'));
}

function createDevServer(routers) {
    for (let lang in routers) {
        let langRouters = routers[lang];
        for (let name in langRouters) {
            let route = langRouters[name];
            let url = route.url;
            if (url.lastIndexOf('/') == (url.length - 1)) {
                continue;
            }
            
            let pattern = new RegExp('^' + url + '$', 'i');
            let to = url + $C.DEFINES.FILTER_URL_SUFFIX;
            rewrites.push({ from: pattern, to: to });
        }
    }
}

module.exports = createRewrites;