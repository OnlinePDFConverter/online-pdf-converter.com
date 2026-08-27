const ROOT_DIR = './src/pages/pdf/';
const CHUNK_PREFIX = 'pdf_';
const { TOOL_IDS } = require('../tools');

function toFilename(id) {
    return `${id.replace(/_/g, '-')}.html`;
}

const tools = {};
TOOL_IDS.forEach(id => {
    let extraMessages = [];
    if (['sign_pdf', 'add_watermark', 'form_creator', 'edit_pdf'].includes(id)) {
        extraMessages = ['pdfviewer'];
    }
    tools[id] = {
        filename: toFilename(id),
        template: `${ROOT_DIR}${id}.html`,
        chunks: [ `${CHUNK_PREFIX}${id}` ],
        messages: ['upload', id, ...extraMessages]
    };
});

for (let name in tools) {
    const tool = tools[name];
    tools[name + '_download'] = {
        filename: tool.filename.replace('.html', '-download.html'),
        template: `${ROOT_DIR}download.html`,
        chunks: [ `${CHUNK_PREFIX}download` ],
        templateParameters: {
            tool: name,
            robots: 'noindex,follow'
        },
        messages: ['download'],
        denyIndex: true
    }
}

module.exports = tools;
