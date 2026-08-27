const $C = require('../webpack.constants');

const TOOL_IDS = [
    'merge_pdf',
    'compress_pdf',
    'repair_pdf',
    'ocr_pdf',
    'split_pdf',
    'pdf_to_word',
    'pdf_to_excel',
    'pdf_to_ppt',
    'pdf_to_images',
    'pdf_to_jpg',
    'pdf_to_png',
    'pdf_to_webp',
    'pdf_to_pdfa',
    'word_to_pdf',
    'excel_to_pdf',
    'ppt_to_pdf',
    'images_to_pdf',
    'jpg_to_pdf',
    'png_to_pdf',
    'webp_to_pdf',
    'heic_to_pdf',
    'psd_to_pdf',
    'tiff_to_pdf',
    'rtf_to_pdf',
    'odt_to_pdf',
    'xps_to_pdf',
    'epub_to_pdf',
    'mobi_to_pdf',
    'fb2_to_pdf',
    'cbz_to_pdf',
    'djvu_to_pdf',
    'markdown_to_pdf',
    'organize_pdf',
    'extract_pages',
    'delete_pages',
    'pdf_multi_tool',
    'rasterize_pdf',
    'rotate_pdf',
    'page_numbers',
    'protect_pdf',
    'unlock_pdf',
    'sign_pdf',
    'add_watermark',
    'crop_pdf',
    'form_creator',
    'edit_pdf'
];

function getTools(locale) {
    const tools = TOOL_IDS.map(id => {
        return {
            id,
            name: locale.get('page.' + id + '.name'),
            icon: $C.DEFINES.ASSETS_URL + 'images/tools/' + id + '.png'
        }
    });
    tools.get = function (id) {
        if (!id) {
            return null;
        }
        return tools.find(item => item.id == id);
    };
    return tools;
}

module.exports = {
    getTools,
    TOOL_IDS
};
