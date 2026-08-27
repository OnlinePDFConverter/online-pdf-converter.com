const PAGES_DIR = './src/pages';
let _tools = [
    'help',
    'pdf'
];

let TOOLS = {};
_tools.forEach(tool => {
    Object.assign(TOOLS, require('./' + tool));
});


module.exports = {
    index: {
        filename: "index.html",
        template: `${PAGES_DIR}/index.html`,
        chunks: [ "index" ]
    },
    allTools: {
        filename: "all-tools.html",
        template: `${PAGES_DIR}/all_tools.html`,
        chunks: [ "index" ]
    },
    ...TOOLS
};
