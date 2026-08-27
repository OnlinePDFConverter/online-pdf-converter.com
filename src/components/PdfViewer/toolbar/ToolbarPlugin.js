const EMPTY_ICON = Object.freeze({});

export default class ToolbarPlugin {
    constructor({ id = '', group = '', groupClass = '', icon = EMPTY_ICON } = {}) {
        this.id = id;
        this.group = group || id;
        this.groupClass = groupClass;
        this.icon = icon;
        this.viewer = null;
        this.toolbar = null;
    }

    render() {
        throw new Error(`PdfViewer toolbar plugin "${this.id}" must implement render().`);
    }

    mount({ viewer, toolbar }) {
        this.viewer = viewer;
        this.toolbar = toolbar;
    }

    update() {}

    onDocumentLoad() {}

    onDocumentDestroy() {}

    onPageRendered() {}

    onPageChange() {}

    onScaleChange() {}

    destroy() {
        this.viewer = null;
        this.toolbar = null;
    }
}
