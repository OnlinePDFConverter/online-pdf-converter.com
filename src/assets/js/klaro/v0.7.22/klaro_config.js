var privacyUrl = '/privacy-policy';

var klaroConfig = {
    version: 1,
    elementID: 'klaro',
    styling: {
        theme: ['light', 'bottom'],
    },
    showDescriptionEmptyStore: true,
    noAutoLoad: false,
    htmlTexts: true,
    embedded: false,
    groupByPurpose: true,
    autoFocus: false,
    showNoticeTitle: false,
    storageMethod: 'cookie',
    cookieName: 'klaro',
    cookieExpiresAfterDays: 365,
    //cookiePath: '/',
    default: false,
    mustConsent: false,
    acceptAll: true,
    hideDeclineAll: false,
    hideLearnMore: false,
    noticeAsModal: false,
    translations: {
        zz: {
            privacyPolicyUrl: privacyUrl,
        },
        en: {
            consentModal: {
                title: '<u>Information that we collect</u>',
                description:
                    'Here you can see and customize the information that we collect about you. These services process personal information to show you relevant content about products, services or topics that you might be interested in.',
            },
            cloudflare: {
                description: 'Protection against DDoS attacks',
            },
            purposes: {
                analytics: 'Analytics',
                security: 'Security',
                advertising: 'Advertising',
                styling: 'Styling',
            },
        }
    },
    services: [
        {
            name: 'google-analytics',
            title: 'Google Analytics',
            description: 'Helps us understand how visitors use the site.',
            default: false,
            cookies: [
                /^_ga(_.*)?/ // Klaro deletes Google Analytics cookies if the user declines.
            ],
            purposes: ['analytics'],
            onAccept: `
                if (typeof window.gtag === 'function') {
                    window.gtag('consent', 'update', {
                        'analytics_storage': 'granted'
                    })
                }
            `,
            onDecline: `
                if (typeof window.gtag === 'function') {
                    window.gtag('consent', 'update', {
                        'analytics_storage': 'denied'
                    })
                }
            `,
        },
        {
            name: 'google-ads',
            title: 'Google Ads',
            description: 'Allows Google to serve, measure, and personalize advertisements.',
            default: false,
            cookies: [],
            onAccept: `
                if (typeof window.gtag === 'function') {
                    window.gtag('consent', 'update', {
                        'ad_storage': 'granted',
                        'ad_user_data': 'granted',
                        'ad_personalization': 'granted'
                    })
                }
            `,
            onDecline: `
                if (typeof window.gtag === 'function') {
                    window.gtag('consent', 'update', {
                        'ad_storage': 'denied',
                        'ad_user_data': 'denied',
                        'ad_personalization': 'denied'
                    })
                }
            `,
            purposes: ['advertising'],
        },
        {
            name: 'cloudflare',
            title: 'Cloudflare',
            purposes: ['security'],
            required: true,
        },
    ],
};
