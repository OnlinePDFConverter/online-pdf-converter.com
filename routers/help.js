const PAGES_DIR = './src/pages';

module.exports =  {
    privacy: {
        filename: "privacy-policy.html",
        template: `${PAGES_DIR}/help/privacy.html`,
        chunks: [ "privacy" ]
    },
    terms: {
        filename: "terms.html",
        template: `${PAGES_DIR}/help/terms.html`,
        chunks: [ "privacy" ]
    },
    cookiePolicy: {
        filename: "cookie-policy.html",
        template: `${PAGES_DIR}/help/cookie.html`,
        chunks: [ "privacy" ]
    },
    security: {
        filename: "security.html",
        template: `${PAGES_DIR}/help/security.html`,
        chunks: [ "common" ]
    },
    openSource: {
        filename: "open-source.html",
        template: `${PAGES_DIR}/help/open_source.html`,
        chunks: [ "privacy" ]
    },
    browserExtension: {
        filename: "browser-extension.html",
        template: `${PAGES_DIR}/help/browser_extension.html`,
        chunks: [ "common" ]
    },
    about: {
        filename: "about-us.html",
        template: `${PAGES_DIR}/help/about.html`,
        chunks: [ "common" ]
    },
    contact: {
        filename: "contact-us.html",
        template: `${PAGES_DIR}/help/contact.html`,
        chunks: [ "common" ]
    },
    ext_install: {
        filename: "ext_install.html",
        template: `${PAGES_DIR}/help/ext_install.html`,
        chunks: [ "common" ],
        denyIndex: true
    },
    ext_uninstall: {
        filename: "ext_uninstall.html",
        template: `${PAGES_DIR}/help/ext_uninstall.html`,
        chunks: [ "common" ],
        denyIndex: true
    },
    error: {
        filename: "404.html",
        template: `${PAGES_DIR}/404.html`,
        chunks: [ "error" ],
        denyIndex: true,
        templateParameters: {
            robots: 'noindex,follow'
        }
    },
    pricing: {
        filename: "pricing.html",
        template: `${PAGES_DIR}/pricing.html`,
        chunks: [ "pricing" ],
        templateParameters: {
            robots: 'noindex,follow'
        },
        denyIndex: true
    }
};
