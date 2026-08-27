import PDFHelper from '@src/libraries/PDFHelper.js';
import { formatFileSize } from '@libs/misc.js';

const CLASS_SUCCESS = 'has-success';
const CLASS_ERROR = 'has-error';
const CLASS_IS_READING = 'is-reading';
const PAGE_PREVIEW_ROOT_MARGIN = '300px';
const MAX_PAGE_RENDER_TASKS = 2;

function isPDFFile(file) {
    return file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
}


class FileItem {

    get previewElement() {
        return this.file.previewElement;
    }

    get elFileIconWrapper() {
        return this.previewElement.querySelector('.file-icon');
    }

    get elIcon() {
        return this.elFileIconWrapper.querySelector('[data-dz-thumbnail]');
    }

    get elStatus() {
        return this.previewElement.querySelector('.upload-status');
    }

    get elPagesSize() {
        return this.previewElement.querySelector('.file-pages-size');
    }

    get elPages() {
        return this.elPagesSize.querySelector('.file-pages');
    }

    get elSize() {
        return this.elPagesSize.querySelector('.file-size');
    }

    get elProgressWrapper() {
        return this.previewElement.querySelector('.file-progress');
    }

    get elProgressText() {
        return this.elProgressWrapper.querySelector('[data-progress-text]');
    }

    get elProgressPercent() {
        return this.elProgressWrapper.querySelector('[data-progress-percent]');
    }

    get elProgressBar() {
        return this.elProgressWrapper.querySelector('[data-progress-bar]');
    }

    constructor(file) {
        this.file = file;
        this.pagePreviewObserver = null;
        this.pagesContainer = null;
        this.pageCount = null;
        this.pageElements = [];
        this.previewElement.setAttribute('data-file-id', this.file.upload.uuid);
    }

    async preview(objIcon, mode) {
        this.elStatus.textContent = $L.get('upload.reading');
        this.previewElement.classList.add(CLASS_IS_READING);

        if (objIcon) {
            if (objIcon.icon) {
                this.elIcon.src = objIcon.icon;
            } else if (objIcon.text) {
                this.elFileIconWrapper.classList.add('file-icon-bg');
                this.elFileIconWrapper.textContent = objIcon.text;
            }
            this.setStatus(true, $L.get('upload.fileIsReady'));
            return;
        }

        if (mode == 'img_selectable') {
            this.previewElement.classList.add('is-selected');
            this.previewElement.addEventListener('click', () => this.previewElement.classList.toggle('is-selected'));
        }

        if (this.file.dataURL) {
            this.setStatus(true, $L.get('upload.fileIsReady'));
            return;
        }
        
        if (isPDFFile(this.file)) {
            try {
                const pdfHelper = new PDFHelper({
                    data: await this.file.arrayBuffer()
                });
                const data = await pdfHelper.getPage(1);
                const size = formatFileSize(this.file.size);
                this.setStatus(true, $L.get('upload.fileIsReady'));
                this.elIcon.src = data.canvas.toDataURL('image/png');
                this.elPages.textContent = pdfHelper.document.numPages + ' ' + $L.get('upload.pages');
                this.elSize.textContent = size;
                return {
                    pages: pdfHelper.document.numPages,
                    thumb: data.canvas.toDataURL('image/png'),
                    size: size
                };
            } catch (e) {
                this.setStatus(false, $L.get('upload.fileReadFailed'));
            }
        }
    }

    async previewPages(elContainer, mode) {
        if (!isPDFFile(this.file)) {
            return;
        }
        this.pagesContainer = elContainer;
        this.destroyPagePreview();

        try {
            const pdfHelper = new PDFHelper({
                data: await this.file.arrayBuffer()
            });
            const pdf = await pdfHelper.getPDFDocument();
            this.pageCount = pdf.numPages;
            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                const pageElement = this.createPageElement(pageNumber);
                if (mode == 'page_selectable') {
                    pageElement.classList.add('is-selected');
                    pageElement.addEventListener('click', () => pageElement.classList.toggle('is-selected'));
                } else if (mode == 'page_removable') {
                    pageElement.querySelector('[data-dz-remove]').addEventListener('click', () => {
                        pageElement.remove();
                    });
                }
            }

            const renderQueue = this.createPageRenderQueue(pdfHelper);
            if ('IntersectionObserver' in window) {
                this.pagePreviewObserver = new IntersectionObserver(entries => {
                    entries.forEach(entry => {
                        if (!entry.isIntersecting) {
                            return;
                        }
                        this.pagePreviewObserver.unobserve(entry.target);
                        renderQueue.enqueue(entry.target);
                    });
                }, {
                    root: this.pagesContainer,
                    rootMargin: PAGE_PREVIEW_ROOT_MARGIN
                });
                this.pageElements.forEach(pageElement => this.pagePreviewObserver.observe(pageElement));
            } else {
                this.pageElements.forEach(pageElement => renderQueue.enqueue(pageElement));
            }
        } catch (e) {
            throw e;
        }
    }

    createPageElement(pageNumber) {
        const pageElement = this.previewElement.cloneNode(true);
        pageElement.classList.add(CLASS_IS_READING);
        pageElement.setAttribute('data-file-id', this.file.upload.uuid);
        pageElement.setAttribute('data-page-number', pageNumber);
        pageElement.querySelector('[data-dz-name]').textContent = `Page ${pageNumber}`;
        this.pageElements.push(pageElement);
        this.pagesContainer.appendChild(pageElement);
        return pageElement;
    }

    async renderPreviewPage(pdfHelper, pageElement, pageNumber) {
        if (pageElement.getAttribute('data-render-state') === 'done') {
            return;
        }
        pageElement.setAttribute('data-render-state', 'rendering');
        pageElement.classList.add(CLASS_IS_READING);
        try {
            const data = await pdfHelper.getPage(pageNumber);
            pageElement.setAttribute('data-render-state', 'done');
            pageElement.querySelector('[data-dz-thumbnail]').src = data.canvas.toDataURL('image/png');
        } catch (e) {
            pageElement.classList.add(CLASS_ERROR);
            pageElement.setAttribute('data-render-state', 'error');
            pageElement.querySelector('.upload-status').textContent = $L.get('upload.fileReadFailed');
        }
        pageElement.classList.remove(CLASS_IS_READING);
    }

    createPageRenderQueue(pdfHelper) {
        const pending = [];
        const queuedElements = new WeakSet();
        let activeCount = 0;

        const runNext = () => {
            while (activeCount < MAX_PAGE_RENDER_TASKS && pending.length > 0) {
                const pageElement = pending.shift();
                if (pageElement.getAttribute('data-render-state')) {
                    continue;
                }

                activeCount++;
                const pageNumber = Number(pageElement.getAttribute('data-page-number'));
                this.renderPreviewPage(pdfHelper, pageElement, pageNumber).catch(() => {}).finally(() => {
                    activeCount--;
                    runNext();
                });
            }
        };

        return {
            enqueue: pageElement => {
                if (!pageElement || queuedElements.has(pageElement) || pageElement.getAttribute('data-render-state')) {
                    return;
                }
                queuedElements.add(pageElement);
                pending.push(pageElement);
                runNext();
            }
        };
    }

    destroyPagePreview() {
        $D.empty(this.pagesContainer);
        if (this.pagePreviewObserver) {
            this.pagePreviewObserver.disconnect();
            this.pagePreviewObserver = null;
        }
    }

    setStatus(isSuccess, msg) {
        this.previewElement.classList.remove(CLASS_IS_READING);
        if (isSuccess) {
            this.previewElement.classList.remove(CLASS_ERROR);
            this.previewElement.classList.add(CLASS_SUCCESS);
        } else {
            this.previewElement.classList.remove(CLASS_SUCCESS);
            this.previewElement.classList.add(CLASS_ERROR);
        }
        if (msg) {
            this.elStatus.textContent = msg;
        }
    }

    setProgress(percent, text) {
        if (this.elProgressWrapper.classList.contains('d-hide')) {
            this.elProgressWrapper.classList.remove('d-hide');
        }
        this.elProgressText.textContent = text;
        this.elProgressPercent.textContent = percent + '%';
        this.elProgressBar.style.width = percent + '%';
        if (percent == 100) {
            this.elProgressWrapper.classList.add('is-processed');
        }
    }
}

export default FileItem;
