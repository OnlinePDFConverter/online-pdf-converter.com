const path = require('path');
const fs = require('fs');
const glob = require('glob-all');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { PurgeCSSPlugin } = require('purgecss-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

function getDefines($C) {
    let defines = {};
    for (let key in $C.DEFINES) {
        defines[key] = JSON.stringify($C.DEFINES[key]);
    }
    return defines;
}

function getPerformance() {
    return {
        hints: 'warning',
        maxEntrypointSize: 5000000,
        maxAssetSize: 3000000,
        assetFilter: function (assetFilename) {
            return assetFilename.endsWith('.js');
        }
    };
}

function getResolve(rootDir) {
    return {
        alias: {
            '@src': path.resolve(rootDir, 'src'),
            '@common': path.resolve(rootDir, 'src/common'),
            '@components': path.resolve(rootDir, 'src/components'),
            '@libs': path.resolve(rootDir, 'src/libraries'),
            '@assets': path.resolve(rootDir, 'src/assets'),
            '@css': path.resolve(rootDir, 'src/css')
        },
        fallback: {
            util: false
        },
        mainFiles: [
            'index'
        ]
    };
}

function getCorePlugins(rootDir, $C, options = {}) {
    const plugins = [
        new MiniCssExtractPlugin({
            filename: options.cssFilename || $C.cssOutput,
            ignoreOrder: true
        })
    ];

    if (options.copyAssets) {
        plugins.push(new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(rootDir, 'src/assets'),
                    to: 'assets',
                    noErrorOnMissing: true,
                    // globOptions: {
                    //     ignore: [
                    //         '**/libreoffice-wasm/**',
                    //         '**/pymupdf/**',
                    //         '**/qpdf/**',
                    //         '**/js/pdfjs/**',
                    //         '**/fonts/**'
                    //     ]
                    // }
                }
            ]
        }));
    }

    plugins.push(
        new webpack.EnvironmentPlugin({
            DEBUG: $C.NODE_ENV == 'development'
        }),
        new webpack.DefinePlugin(getDefines($C)),
        new webpack.ProvidePlugin({
            $D: [ path.resolve(rootDir, 'src/common/dom.js'), 'DOM' ],
            $API: [ path.resolve(rootDir, 'src/common/api.js'), 'API' ],
            $HOOK: [ path.resolve(rootDir, 'src/common/hook.js'), 'HOOK' ],
            $APP: [ path.resolve(rootDir, 'src/common/app.js'), 'APP' ],
            $L: [ path.resolve(rootDir, 'src/common/locale.js'), 'LOCALE' ]
        })
    );

    return plugins;
}

function getModuleRules(rootDir) {
    const fontsDir = path.resolve(rootDir, 'src/assets/fonts');
    const imagesDir = path.resolve(rootDir, 'src/assets/images');

    return [
        {
            test: /\.css$/i,
            use: [
                MiniCssExtractPlugin.loader,
                'css-loader',
                'postcss-loader'
            ]
        },
        {
            test: /\.(eot|ttf|woff|woff2)$/i,
            type: 'asset/resource',
            generator: {
                filename: pathData => {
                    let resourcePath = pathData.module.resource || pathData.filename;
                    let relativePath = path.relative(fontsDir, resourcePath).replace(/\\/g, '/');
                    if (relativePath.startsWith('../')) {
                        relativePath = path.basename(resourcePath);
                    }
                    return `assets/fonts/${relativePath}`;
                }
            }
        },
        {
            test: /\.(png|jpe?g|gif|svg|webp)$/i,
            type: 'asset/resource',
            generator: {
                filename: pathData => {
                    let resourcePath = pathData.module.resource || pathData.filename;
                    let relativePath = path.relative(imagesDir, resourcePath).replace(/\\/g, '/');
                    if (relativePath.startsWith('../')) {
                        relativePath = path.basename(resourcePath);
                    }
                    return `assets/images/${relativePath}`;
                }
            }
        }
    ];
}

function getMinimizerOptimization() {
    return {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    format: {
                        comments: false
                    }
                },
                extractComments: true,
                parallel: true
            }),
            new CssMinimizerPlugin()
        ],
        minimize: true
    };
}

function getPurgeCssPlugin(rootDir) {
    const purgeContentPaths = [
        path.resolve(rootDir, 'src/pages') + `/**/*`,
        path.resolve(rootDir, 'src/entry') + `/**/*`,
        path.resolve(rootDir, 'src/components') + `/**/*`,
        path.resolve(rootDir, 'src/common') + `/**/*.js`,
        path.resolve(rootDir, 'server', 'application', 'views') + `/**/*`
    ];

    return new PurgeCSSPlugin({
        variables: false,
        keyframes: false,
        safelist: {
            greedy: [
                /^tippy\-/,
                /^nprogress/,
                /^klaro/,
                /^ext-/,
                /^home-tool-menu-icon-/
            ]
        },
        paths: glob.sync(purgeContentPaths, { nodir: true })
    });
}

const crossOriginIsolationHeaders = [
    ['Cross-Origin-Embedder-Policy', 'require-corp'],
    ['Cross-Origin-Opener-Policy', 'same-origin'],
    ['Cross-Origin-Resource-Policy', 'cross-origin']
];
const securityHeaders = [
    ['X-Content-Type-Options', 'nosniff'],
    ['X-Frame-Options', 'SAMEORIGIN'],
    ['X-XSS-Protection', '1; mode=block'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin']
];
const isolatedSecurityHeaders = [
    ...securityHeaders,
    ...crossOriginIsolationHeaders
];
const libreOfficeAssetHeaders = {
    '/assets/libreoffice-wasm/soffice.wasm.bin.gz': [
        ['Content-Type', 'application/wasm'],
        ['Content-Encoding', 'gzip'],
        ['Cache-Control', 'public, max-age=31536000, immutable'],
        ...crossOriginIsolationHeaders
    ],
    '/assets/libreoffice-wasm/soffice.data.bin.gz': [
        ['Content-Type', 'application/octet-stream'],
        ['Content-Encoding', 'gzip'],
        ['Cache-Control', 'public, max-age=31536000, immutable'],
        ...crossOriginIsolationHeaders
    ],
    '/assets/libreoffice-wasm/soffice.wasm.bin': [
        ['Content-Type', 'application/wasm'],
        ['Cache-Control', 'public, max-age=31536000, immutable'],
        ...crossOriginIsolationHeaders
    ],
    '/assets/libreoffice-wasm/soffice.data.bin': [
        ['Content-Type', 'application/octet-stream'],
        ['Cache-Control', 'public, max-age=31536000, immutable'],
        ...crossOriginIsolationHeaders
    ],
    '/assets/libreoffice-wasm/browser.worker.global.js': [
        ['Content-Type', 'application/javascript'],
        ['Cache-Control', 'public, max-age=31536000, immutable'],
        ...crossOriginIsolationHeaders
    ]
};

function getRequestPath(req) {
    return (req.path || req.url || '').split('?')[0];
}

function getLibreOfficeAssetHeaders(req) {
    return libreOfficeAssetHeaders[getRequestPath(req)];
}

function isUserRoute(req) {
    return /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?user(?:\/|$)/i.test(getRequestPath(req));
}

function setLibreOfficeAssetHeaders(req, res, next) {
    const headers = getLibreOfficeAssetHeaders(req);
    if (headers) {
        headers.forEach(([key, value]) => res.setHeader(key, value));
    }
    next();
}

function serveGzippedLibreOfficeAsset(rootDir) {
    const libreOfficeAssetsDir = path.resolve(rootDir, 'src/assets/libreoffice-wasm');

    return (req, res, next) => {
        const fileName = path.basename(req.path || '');
        if (fileName !== 'soffice.wasm.bin' && fileName !== 'soffice.data.bin') {
            return next();
        }

        const gzFile = path.join(libreOfficeAssetsDir, fileName + '.gz');
        if (!fs.existsSync(gzFile)) {
            return next();
        }

        const stat = fs.statSync(gzFile);
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Type', fileName === 'soffice.wasm.bin' ? 'application/wasm' : 'application/octet-stream');
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        fs.createReadStream(gzFile).pipe(res);
    };
}

function getI18nLanguages(rootDir) {
    const i18nDir = path.resolve(rootDir, 'i18n');
    return fs.existsSync(i18nDir)
        ? fs.readdirSync(i18nDir, { withFileTypes: true }).filter(item => item.isDirectory()).map(item => item.name)
        : [];
}

function getDevServer(rootDir, $C, ROUTERS, options = {}) {
    const createRewrites = require('./rewrite');
    const pathRewrite = {
        ['^' + $C.DEFINES.API_URL]: ''
    };
    const proxy = [
        {
            context: [$C.DEFINES.API_URL],
            target: $C.DEV_SERVER.API_URL_TARGET,
            pathRewrite,
            changeOrigin: true,
            secure: false
        },
        {
            context: ['/user'],
            target: $C.DEV_SERVER.API_URL_TARGET,
            changeOrigin: true,
            secure: false
        },
        {
            context: ['/oauth'],
            target: $C.DEV_SERVER.API_URL_TARGET,
            changeOrigin: true,
            secure: false
        },
        ...getI18nLanguages(rootDir).map(langCode => ({
            context: ['/' + langCode + '/user'],
            target: $C.DEV_SERVER.API_URL_TARGET,
            changeOrigin: true,
            secure: false
        }))
    ];
    const serveLibreOfficeAsset = serveGzippedLibreOfficeAsset(rootDir);

    return {
        compress: Boolean(options.compress),
        host: $C.DEV_SERVER.HOST,
        port: $C.DEV_SERVER.PORT,
        // https: true,
        server: {
            type: 'https'
        },
        proxy,
        open: false,
        hot: false,
        headers: req => Object.fromEntries([
            ...(isUserRoute(req) ? securityHeaders : isolatedSecurityHeaders),
            ...(getLibreOfficeAssetHeaders(req) || [])
        ]),
        setupMiddlewares: (middlewares, devServer) => {
            devServer.app.use(setLibreOfficeAssetHeaders);
            devServer.app.get('/assets/libreoffice-wasm/soffice.wasm.bin', serveLibreOfficeAsset);
            devServer.app.get('/assets/libreoffice-wasm/soffice.data.bin', serveLibreOfficeAsset);
            return middlewares;
        },
        historyApiFallback: {
            rewrites: createRewrites(ROUTERS, 'devServer')
        }
    };
}

module.exports = {
    getCorePlugins,
    getDefines,
    getDevServer,
    getMinimizerOptimization,
    getModuleRules,
    getPerformance,
    getPurgeCssPlugin,
    getResolve
};
