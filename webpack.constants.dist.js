const DOMAIN = 'online-pdf-converter.com';
const BASE_URL = '/';
const ASSETS_URL = BASE_URL + 'assets/';
const TOOL_CATEGORIES = {
    organize: ['split_pdf', 'merge_pdf', 'organize_pdf', 'extract_pages', 'delete_pages', 'pdf_multi_tool'],
    optimize: ['compress_pdf', 'repair_pdf', 'ocr_pdf'],
    convertFromPDF: ['pdf_to_word', 'pdf_to_excel', 'pdf_to_ppt', 'pdf_to_images', 'pdf_to_jpg', 'pdf_to_png', 'pdf_to_webp', 'pdf_to_pdfa', 'rasterize_pdf'],
    convertToPDF: [
        ['word_to_pdf', 'excel_to_pdf', 'ppt_to_pdf', 'images_to_pdf', 'jpg_to_pdf', 'png_to_pdf', 'webp_to_pdf', 'psd_to_pdf', 'heic_to_pdf', 'markdown_to_pdf'],
        ['epub_to_pdf', 'mobi_to_pdf', 'fb2_to_pdf', 'cbz_to_pdf', 'djvu_to_pdf', 'xps_to_pdf', 'odt_to_pdf', 'rtf_to_pdf', 'tiff_to_pdf']
    ],
    edit: ['rotate_pdf', 'page_numbers', 'add_watermark', 'crop_pdf', 'form_creator', 'edit_pdf'],
    secure: ['protect_pdf', 'unlock_pdf', 'sign_pdf']
};

//输入到全局常量
const DEFINES = {
    APP_NAME: 'Online PDF Converter',
    BASE_URL: BASE_URL,
    ASSETS_URL: ASSETS_URL,
    ASSETS_VER: '',
    GA_ID: '',
    ADSENSE_ID: '',
    ADSENSE_AD_DISPLAY: true,
    DOMAIN: DOMAIN,
    COOKIE_DOMAIN: '.' + DOMAIN,
    CONTACT_EMAIL: 'contact@' + DOMAIN,
    API_URL: '/sr',
    FILTER_URL_SUFFIX: '.html',
    DEF_LANG: 'en',
    CURRENCY: 'US$',
    ALLOW_DOMAIN: [
        DOMAIN.split(''),
        'localhost'.split('')
    ],
    EXTENSION: {
        chrome: '',
        edge: '',
        firefox: ''
    },
    THIRD_PARTY: {
        GOOGLE_DRIVE: {
            clientId: '',
            scopes: 'https://www.googleapis.com/auth/drive.file',
            appId: '',
            apiKey: '',
            discoveryDocs: [
                'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
            ]
        },
        DROPBOX: {
            apiKey: ''
        }
    },
    PLANS: {
        lv_0: {
            code: 0,
            price: {
                month: 0,
                year: 0
            },
            tools: {
                pdf_multi_tool:       [ 2, 25 ],
                merge_pdf:            [ 2, 25 ],
                compress_pdf:         [ 2, 50 ],
                split_pdf:            [ 1, 25 ],
                extract_pages:         [ 1, 25 ],
                delete_pages:          [ 1, 25 ],
                organize_pdf:         [ 1, 25 ],
                page_numbers:         [ 1, 25 ],
                add_watermark:        [ 1, 25 ],
                sign_pdf:             [ 1, 25 ],
                edit_pdf:             [ 1, 25 ],
                form_creator:         [ 1, 25 ],
                crop_pdf:             [ 1, 25 ],
                ocr_pdf:              [ 1, 25 ],
                rotate_pdf:           [ 1, 25 ],
                protect_pdf:          [ 1, 25 ],
                unlock_pdf:           [ 1, 25 ],
                repair_pdf:           [ 1, 25 ],
                rasterize_pdf:        [ 1, 25 ],
                pdf_to_pdfa:          [ 2, 25 ],
                pdf_to_images:        [ 1, 25 ],
                pdf_to_jpg:           [ 1, 25 ],
                pdf_to_png:           [ 1, 25 ],
                pdf_to_webp:          [ 1, 25 ],
                jpg_to_pdf:           [ 5, 25 ],
                images_to_pdf:        [ 5, 25 ],
                png_to_pdf:           [ 5, 25 ],
                tiff_to_pdf:          [ 5, 25 ],
                webp_to_pdf:          [ 5, 25 ],
                heic_to_pdf:          [ 5, 25 ],
                psd_to_pdf:           [ 2, 25 ],
                epub_to_pdf:          [ 2, 25 ],
                mobi_to_pdf:          [ 2, 25 ],
                fb2_to_pdf:           [ 2, 25 ],
                cbz_to_pdf:           [ 2, 25 ],
                djvu_to_pdf:          [ 2, 25 ],
                xps_to_pdf:           [ 2, 25 ],
                odt_to_pdf:           [ 2, 25 ],
                rtf_to_pdf:           [ 2, 25 ],
                markdown_to_pdf:      [ 1, 25 ],
                word_to_pdf:          [ 2, 25 ],
                excel_to_pdf:         [ 2, 25 ],
                ppt_to_pdf:           [ 2, 25 ],
                pdf_to_word:          [ 2, 25 ],
                pdf_to_excel:         [ 2, 25 ],
                pdf_to_ppt:           [ 2, 25 ]
            }
        },
        lv_1: {
            code: 1,
            price: {
                month: 7,
                year: 48
            },
            tools: {
                pdf_multi_tool:       [ 20, 250 ],
                merge_pdf:            [ 20, 250 ],
                compress_pdf:         [ 10, 250 ],
                split_pdf:            [ 1, 250 ],
                extract_pages:         [ 1, 250 ],
                delete_pages:          [ 1, 250 ],
                organize_pdf:         [ 1, 250 ],
                page_numbers:         [ 1, 250 ],
                add_watermark:        [ 1, 250 ],
                sign_pdf:             [ 1, 250 ],
                edit_pdf:             [ 1, 250 ],
                form_creator:         [ 1, 250 ],
                crop_pdf:             [ 1, 250 ],
                ocr_pdf:              [ 1, 250 ],
                rotate_pdf:           [ 1, 250 ],
                protect_pdf:          [ 20, 250 ],
                unlock_pdf:           [ 20, 250 ],
                repair_pdf:           [ 20, 250 ],
                rasterize_pdf:        [ 1, 250 ],
                pdf_to_pdfa:          [ 10, 250 ],
                pdf_to_images:        [ 1, 250 ],
                pdf_to_jpg:           [ 1, 250 ],
                pdf_to_png:           [ 1, 250 ],
                pdf_to_webp:          [ 1, 250 ],
                jpg_to_pdf:           [ 20, 250 ],
                images_to_pdf:        [ 20, 250 ],
                png_to_pdf:           [ 20, 250 ],
                tiff_to_pdf:          [ 20, 250 ],
                webp_to_pdf:          [ 20, 250 ],
                heic_to_pdf:          [ 20, 250 ],
                psd_to_pdf:           [ 20, 250 ],
                epub_to_pdf:          [ 20, 250 ],
                mobi_to_pdf:          [ 20, 250 ],
                fb2_to_pdf:           [ 20, 250 ],
                cbz_to_pdf:           [ 20, 250 ],
                djvu_to_pdf:          [ 20, 250 ],
                xps_to_pdf:           [ 20, 250 ],
                odt_to_pdf:           [ 20, 250 ],
                rtf_to_pdf:           [ 20, 250 ],
                markdown_to_pdf:      [ 1, 250 ],
                word_to_pdf:          [ 10, 250 ],
                excel_to_pdf:         [ 10, 250 ],
                ppt_to_pdf:           [ 10, 250 ],
                pdf_to_word:          [ 10, 250 ],
                pdf_to_excel:         [ 10, 250 ],
                pdf_to_ppt:           [ 10, 250 ]
            }
        },
        lv_2: {
            code: 2,
            price: {
                month: 12,
                year: 96
            },
            tools: {
                pdf_multi_tool:       [ null, null ],
                merge_pdf:            [ null, null ],
                compress_pdf:         [ null, null ],
                split_pdf:            [ 1, null ],
                extract_pages:         [ 1, null ],
                delete_pages:          [ 1, null ],
                organize_pdf:         [ 1, null ],
                page_numbers:         [ 1, null ],
                add_watermark:        [ 1, null ],
                sign_pdf:             [ 1, null ],
                edit_pdf:             [ 1, null ],
                form_creator:         [ 1, null ],
                crop_pdf:             [ 1, null ],
                ocr_pdf:              [ 1, null ],
                rotate_pdf:           [ 1, null ],
                protect_pdf:          [ null, null ],
                unlock_pdf:           [ null, null ],
                repair_pdf:           [ null, null ],
                rasterize_pdf:        [ 1, null ],
                pdf_to_pdfa:          [ null, null ],
                pdf_to_images:        [ 1, null ],
                pdf_to_jpg:           [ 1, null ],
                pdf_to_png:           [ 1, null ],
                pdf_to_webp:          [ 1, null ],
                jpg_to_pdf:           [ null, null ],
                images_to_pdf:        [ null, null ],
                png_to_pdf:           [ null, null ],
                tiff_to_pdf:          [ null, null ],
                webp_to_pdf:          [ null, null ],
                heic_to_pdf:          [ null, null ],
                psd_to_pdf:           [ null, null ],
                epub_to_pdf:          [ null, null ],
                mobi_to_pdf:          [ null, null ],
                fb2_to_pdf:           [ null, null ],
                cbz_to_pdf:           [ null, null ],
                djvu_to_pdf:          [ null, null ],
                xps_to_pdf:           [ null, null ],
                odt_to_pdf:           [ null, null ],
                rtf_to_pdf:           [ null, null ],
                markdown_to_pdf:      [ 1, null ],
                word_to_pdf:          [ null, null ],
                excel_to_pdf:         [ null, null ],
                ppt_to_pdf:           [ null, null ],
                pdf_to_word:          [ null, null ],
                pdf_to_excel:         [ null, null ],
                pdf_to_ppt:           [ null, null ]
            }
        }
    }
};


const PROD_CONFIGS = {
    NODE_ENV: 'production',
    OUTPUT_PATH: 'build/app',
    MINIFY: false,
    jsOutput: 'js/[id].js?[chunkhash]',
    cssOutput: 'css/[id].css?[chunkhash]',
    DEFINES: DEFINES,
    DEV_SERVER: {
        API_URL_TARGET_TEST: '',
        API_URL_TARGET: DEFINES.API_URL,
        HOST: 'localhost',
        PORT: 3000
    },
    TOOL_CATEGORIES,
    REWRITE: 'nginx'
};

module.exports = PROD_CONFIGS;
