import * as pdfjsLib from 'pdfjs-dist';
import viewerTemplate from './PdfViewer.html';
import { button, clamp, escapeHtml, loadSource } from './utils';
import ToolbarManager from './toolbar/ToolbarManager';
import { resolveToolbarPlugins } from './toolbar';
import PageOverlayManager from './PageOverlayManager';


// pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
pdfjsLib.GlobalWorkerOptions.workerSrc = ASSETS_URL + 'js/pdfjs-dist/build/pdf.worker.min.mjs';
const CMAP_URL = ASSETS_URL + 'js/pdfjs-dist/web/cmaps/';
const STANDARD_FONT_DATA_URL = ASSETS_URL + 'js/pdfjs-dist/web/standard_fonts/';

const DEFAULT_SCALE = 1.15;
const MIN_SCALE = 0.35;
const MAX_SCALE = 4;
const SCALE_STEP = 0.15;
const SIDEBAR_ICON = '<svg viewBox="0 0 24 24"><path d="M4 7h16v2H4V7Zm0 4h16v2H4v-2Zm0 4h16v2H4v-2Z"/></svg>';

export default class PdfViewer {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        if (!this.container) {
            throw new Error('PdfViewer container was not found.');
        }

        this.options = {
            source: null,
            fileName: null,
            scale: DEFAULT_SCALE,
            defaultZoom: 'fit-width',
            showToolbar: true,
            renderTextLayer: true,
            renderAnnotations: true,
            sidebarCollapsed: false,
            respectPageRotation: false,
            onLoad: null,
            onPageChange: null,
            onPageRendered: null,
            onScaleChange: null,
            toolbar: undefined,
            ...options
        };

        this.pdf = null;
        this.loadingTask = null;
        this.pages = [];
        this.thumbs = [];
        this.renderQueue = new Set();
        this.thumbQueue = new Set();
        this.pageText = new Map();
        this.searchMatches = [];
        this.searchQuery = '';
        this.currentSearchIndex = -1;
        this.currentPage = 1;
        this.programmaticScrollPage = null;
        this.programmaticScrollTimer = null;
        this.fitWidthTimer = null;
        this.fitWidthRequestId = 0;
        this.handleWindowResize = null;
        this.scale = clamp(this.options.scale, MIN_SCALE, MAX_SCALE);
        this.lastManualScale = this.scale;
        this.rotation = 0;
        this.sidebarCollapsed = Boolean(this.options.sidebarCollapsed);
        this.fitMode = this.options.defaultZoom === 'fit-width';
        this.pageOverlay = new PageOverlayManager(this);
        const toolbarItems = resolveToolbarPlugins(this.options.toolbar);
        this.toolbar = new ToolbarManager(this, toolbarItems);

        this.render();
        this.toolbar.mount(this.toolbarEl);
        this.bindEvents();
        this.createObservers();
        this.updateToolbar();

        if (this.options.source) {
            this.load(this.options.source, { fileName: this.options.fileName });
        }
    }

    render() {
        this.container.classList.add('pdf-viewer');
        const toolbarHtml = this.toolbar.render([{
            group: 'file',
            html: button(SIDEBAR_ICON, 'Toggle thumbnails', 'sidebar')
        }]);
        this.container.innerHTML = viewerTemplate({
            options: this.options,
            toolbarHtml,
            canOpenFile: this.hasToolbarPlugin('open')
        });

        this.app = this.container.querySelector('.pv-app');
        this.toolbarEl = this.container.querySelector('.pv-toolbar');
        this.stage = this.container.querySelector('[data-role="stage"]');
        this.pagesEl = this.container.querySelector('[data-role="pages"]');
        this.thumbsEl = this.container.querySelector('[data-role="thumbs"]');
        this.empty = this.container.querySelector('[data-role="empty"]');
        this.setSidebarCollapsed(this.sidebarCollapsed);
    }

    bindEvents() {
        this.handleContainerClick = event => {
            const btn = event.target.closest('[data-action="sidebar"]');
            if (btn && this.container.contains(btn)) {
                this.toggleSidebar();
            }
        };
        this.handleStageScroll = () => this.handleScroll();
        this.handleStageWheel = event => this.handleWheel(event);

        this.container.addEventListener('click', this.handleContainerClick);
        this.stage.addEventListener('scroll', this.handleStageScroll, { passive: true });
        this.stage.addEventListener('wheel', this.handleStageWheel, { passive: false });
    }

    setSidebarCollapsed(collapsed) {
        this.sidebarCollapsed = Boolean(collapsed);
        this.app?.classList.toggle('pv-sidebar-collapsed', this.sidebarCollapsed);
        const button = this.container.querySelector('[data-action="sidebar"]');
        if (button) {
            button.setAttribute('aria-expanded', String(!this.sidebarCollapsed));
        }
        return this.sidebarCollapsed;
    }

    toggleSidebar() {
        return this.setSidebarCollapsed(!this.sidebarCollapsed);
    }

    createObservers() {
        this.pageObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) this.renderPage(Number(entry.target.dataset.pageNumber));
            });
        }, { root: this.stage, rootMargin: '900px 0px' });

        this.thumbObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) this.renderThumb(Number(entry.target.dataset.pageNumber));
            });
        }, { root: this.thumbsEl, rootMargin: '400px 0px' });

        const handleResize = () => {
            if (!this.fitMode || !this.pdf) return;
            window.clearTimeout(this.fitWidthTimer);
            this.fitWidthTimer = window.setTimeout(() => this.fitWidth(), 120);
        };

        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(handleResize);
            this.resizeObserver.observe(this.stage);
        } else {
            this.handleWindowResize = handleResize;
            window.addEventListener('resize', this.handleWindowResize);
        }
    }

    async load(source, options = {}) {
        this.destroyDocument();
        this.setLoading('Loading PDF...');

        try {
            const params = await loadSource(source);
            this.loadingTask = pdfjsLib.getDocument({
                cMapUrl: CMAP_URL,
                standardFontDataUrl: STANDARD_FONT_DATA_URL,
                ...params
            });
            this.loadingTask.onPassword = (updatePassword) => {
                const password = window.prompt('Enter the password for this PDF:');
                if (password) updatePassword(password);
            };
            this.pdf = await this.loadingTask.promise;
            this.options.fileName = options.fileName || source.name || params.url || 'PDF document';
            this.currentPage = 1;
            this.rotation = 0;
            this.pageText.clear();
            this.searchMatches = [];
            this.currentSearchIndex = -1;
            this.searchQuery = '';
            this.buildPages();
            this.updateToolbar();
            this.empty.classList.add('d-none');
            const loadPayload = { pdf: this.pdf, totalPages: this.pdf.numPages, viewer: this };
            this.toolbar.notify('onDocumentLoad', loadPayload);
            if (typeof this.options.onLoad === 'function') {
                this.options.onLoad(loadPayload);
            }
            this.toolbar.notify('onPageChange', { pageNumber: this.currentPage, viewer: this });
            if (typeof this.options.onPageChange === 'function') {
                this.options.onPageChange(this.currentPage, this);
            }
            if (this.options.defaultZoom === 'fit-width' || this.fitMode) {
                await this.fitWidth();
            } else {
                this.renderVisiblePages();
            }
            this.renderVisibleThumbs();
        } catch (error) {
            this.showError(error);
        }
    }

    destroyDocument() {
        if (this.pdf || this.loadingTask) {
            this.toolbar.notify('onDocumentDestroy', { pdf: this.pdf, viewer: this });
        }
        this.pageOverlay.clearDocument();
        this.pages = [];
        this.thumbs = [];
        this.renderQueue.clear();
        this.thumbQueue.clear();
        this.pagesEl.innerHTML = '';
        this.thumbsEl.innerHTML = '';
        if (this.loadingTask) {
            this.loadingTask.destroy();
            this.loadingTask = null;
        }
        this.pdf = null;
    }

    buildPages() {
        const pageCount = this.pdf.numPages;
        const pageFrag = document.createDocumentFragment();
        const thumbFrag = document.createDocumentFragment();

        for (let i = 1; i <= pageCount; i += 1) {
            const pageWrap = document.createElement('section');
            pageWrap.className = 'pv-page';
            pageWrap.dataset.pageNumber = i;
            pageWrap.innerHTML = `
                <div class="pv-canvas-wrap">
                    <canvas></canvas>
                    <div class="pv-text-layer"></div>
                </div>
            `;
            pageFrag.appendChild(pageWrap);
            this.pages.push({ el: pageWrap, canvas: pageWrap.querySelector('canvas'), textLayer: pageWrap.querySelector('.pv-text-layer'), renderedKey: '' });
            this.pageObserver.observe(pageWrap);

            const thumb = document.createElement('button');
            thumb.className = 'pv-thumb';
            thumb.type = 'button';
            thumb.dataset.pageNumber = i;
            thumb.innerHTML = `<div class="pv-thumb-page"><canvas></canvas></div><span>${i}</span>`;
            thumb.addEventListener('click', () => this.goToPage(i));
            thumbFrag.appendChild(thumb);
            this.thumbs.push({ el: thumb, canvas: thumb.querySelector('canvas'), renderedKey: '' });
            this.thumbObserver.observe(thumb);
        }

        this.pagesEl.appendChild(pageFrag);
        this.thumbsEl.appendChild(thumbFrag);
    }

    async renderPage(pageNumber) {
        if (!this.pdf || this.renderQueue.has(pageNumber)) return;
        const item = this.pages[pageNumber - 1];
        if (!item) return;

        const key = `${this.scale}:${this.rotation}`;
        if (item.renderedKey === key) return;
        this.renderQueue.add(pageNumber);

        try {
            const page = await this.pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: this.scale, rotation: this.getPageRotation(page) });
            const pixelRatio = window.devicePixelRatio || 1;
            const wrap = item.canvas.closest('.pv-canvas-wrap');
            item.canvas.width = Math.floor(viewport.width * pixelRatio);
            item.canvas.height = Math.floor(viewport.height * pixelRatio);
            item.canvas.style.width = `${viewport.width}px`;
            item.canvas.style.height = `${viewport.height}px`;
            item.el.style.setProperty('--pv-page-width', `${viewport.width}px`);
            item.el.style.setProperty('--pv-page-height', `${viewport.height}px`);
            item.el.style.setProperty('--pv-page-ratio', `${viewport.width} / ${viewport.height}`);
            if (wrap) {
                wrap.style.width = `${viewport.width}px`;
                wrap.style.height = `${viewport.height}px`;
            }
            item.textLayer.style.setProperty('--total-scale-factor', viewport.scale);

            const context = item.canvas.getContext('2d');
            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, viewport.width, viewport.height);
            await page.render({
                canvasContext: context,
                viewport,
                background: '#ffffff',
                annotationMode: this.options.renderAnnotations
                    ? pdfjsLib.AnnotationMode.ENABLE
                    : pdfjsLib.AnnotationMode.DISABLE
            }).promise;
            item.renderedKey = key;
            if (this.options.renderTextLayer) {
                await this.renderTextLayer(page, item, viewport, pageNumber);
            }
            if (typeof this.options.onPageRendered === 'function') {
                this.options.onPageRendered(pageNumber, item, viewport, page, this);
            }
            this.toolbar.notify('onPageRendered', { pageNumber, item, viewport, page, viewer: this });
        } catch (error) {
            item.el.classList.add('pv-page-error');
            item.el.querySelector('.pv-canvas-wrap').innerHTML = '<div class="pv-page-error-msg">Could not render this page.</div>';
        } finally {
            this.renderQueue.delete(pageNumber);
        }
    }

    async renderTextLayer(page, item, viewport, pageNumber) {
        const textContent = await page.getTextContent();
        this.pageText.set(pageNumber, textContent.items.map(text => text.str).join(' '));
        item.textLayer.innerHTML = '';
        item.textLayer.style.setProperty('--total-scale-factor', viewport.scale);
        const layer = new pdfjsLib.TextLayer({
            textContentSource: textContent,
            container: item.textLayer,
            viewport
        });
        await layer.render();
        if (this.searchQuery.trim()) {
            this.highlightPage(pageNumber);
        }
    }

    async renderThumb(pageNumber) {
        if (!this.pdf || this.thumbQueue.has(pageNumber)) return;
        const item = this.thumbs[pageNumber - 1];
        if (!item) return;

        const key = `${this.rotation}`;
        if (item.renderedKey === key) return;
        this.thumbQueue.add(pageNumber);

        try {
            const page = await this.pdf.getPage(pageNumber);
            const pageRotation = this.getPageRotation(page);
            const baseViewport = page.getViewport({ scale: 1, rotation: pageRotation });
            const scale = Math.min(150 / baseViewport.width, 190 / baseViewport.height);
            const viewport = page.getViewport({ scale, rotation: pageRotation });
            const pixelRatio = window.devicePixelRatio || 1;
            item.canvas.width = Math.floor(viewport.width * pixelRatio);
            item.canvas.height = Math.floor(viewport.height * pixelRatio);
            item.canvas.style.width = `${viewport.width}px`;
            item.canvas.style.height = `${viewport.height}px`;
            const context = item.canvas.getContext('2d');
            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, viewport.width, viewport.height);
            await page.render({
                canvasContext: context,
                viewport,
                background: '#ffffff',
                annotationMode: this.options.renderAnnotations
                    ? pdfjsLib.AnnotationMode.ENABLE
                    : pdfjsLib.AnnotationMode.DISABLE
            }).promise;
            item.renderedKey = key;
        } finally {
            this.thumbQueue.delete(pageNumber);
        }
    }

    renderVisiblePages() {
        this.pages.forEach(item => {
            const rect = item.el.getBoundingClientRect();
            const rootRect = this.stage.getBoundingClientRect();
            if (rect.bottom >= rootRect.top - 900 && rect.top <= rootRect.bottom + 900) {
                this.renderPage(Number(item.el.dataset.pageNumber));
            }
        });
    }

    renderVisibleThumbs() {
        this.thumbs.slice(0, 8).forEach(item => this.renderThumb(Number(item.el.dataset.pageNumber)));
    }

    clearRenderedPages() {
        this.pages.forEach(item => {
            item.renderedKey = '';
            item.textLayer.innerHTML = '';
        });
    }

    setScale(scale, keepFit = false) {
        if (!this.pdf) return;
        this.fitMode = keepFit;
        this.app.classList.toggle('pv-fit-width', this.fitMode);
        this.scale = clamp(scale, MIN_SCALE, MAX_SCALE);
        if (!keepFit) {
            this.fitWidthRequestId += 1;
            this.lastManualScale = this.scale;
        }
        this.clearRenderedPages();
        this.updateToolbar();
        this.renderVisiblePages();
        if (typeof this.options.onScaleChange === 'function') {
            this.options.onScaleChange(this.scale, this);
        }
        this.toolbar.notify('onScaleChange', { scale: this.scale, viewer: this });
    }

    zoomBy(delta) {
        this.setScale(this.scale + delta, false);
    }

    handleWheel(event) {
        if (!this.pdf || !event.ctrlKey) return;
        event.preventDefault();
        this.zoomBy((event.deltaY < 0 ? 1 : -1) * SCALE_STEP);
    }

    toggleFitWidth() {
        if (!this.pdf) return;
        if (this.fitMode) {
            this.setScale(this.lastManualScale || DEFAULT_SCALE, false);
            return;
        }
        this.lastManualScale = this.scale;
        this.fitWidth();
    }

    getFitAvailableWidth() {
        const style = window.getComputedStyle(this.pagesEl);
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const paddingRight = parseFloat(style.paddingRight) || 0;
        const width = this.pagesEl.clientWidth - paddingLeft - paddingRight;
        return width > 1 ? width : 0;
    }

    async getFitScale() {
        const availableWidth = this.getFitAvailableWidth();
        if (!availableWidth) {
            return null;
        }
        const pageNumber = clamp(this.currentPage || 1, 1, this.pdf.numPages);
        const page = await this.pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1, rotation: this.getPageRotation(page) });
        return clamp(availableWidth / viewport.width, MIN_SCALE, MAX_SCALE);
    }

    async fitWidth() {
        if (!this.pdf) return;
        const requestId = this.fitWidthRequestId + 1;
        this.fitWidthRequestId = requestId;
        this.fitMode = true;
        this.app.classList.add('pv-fit-width');
        const nextScale = await this.getFitScale();
        if (nextScale == null) {
            return;
        }
        if (!this.pdf || !this.fitMode || requestId !== this.fitWidthRequestId) return;
        this.scale = nextScale;
        this.clearRenderedPages();
        this.updateToolbar();
        this.renderVisiblePages();
        if (typeof this.options.onScaleChange === 'function') {
            this.options.onScaleChange(this.scale, this);
        }
        this.toolbar.notify('onScaleChange', { scale: this.scale, viewer: this });
    }

    rotate() {
        if (!this.pdf) return;
        this.rotation = (this.rotation + 90) % 360;
        this.clearRenderedPages();
        this.thumbs.forEach(item => {
            item.renderedKey = '';
        });
        if (this.fitMode) {
            this.fitWidth();
        } else {
            this.renderVisiblePages();
        }
        this.renderVisibleThumbs();
    }

    goToPage(pageNumber) {
        if (!this.pdf) return;
        const nextPage = clamp(pageNumber || 1, 1, this.pdf.numPages);
        const item = this.pages[nextPage - 1];
        if (!item) return;
        this.programmaticScrollPage = nextPage;
        window.clearTimeout(this.programmaticScrollTimer);
        this.stage.scrollTo({
            top: Math.max(0, item.el.offsetTop - this.pagesEl.offsetTop - 18),
            behavior: 'smooth'
        });
        this.setCurrentPage(nextPage);
    }

    setCurrentPage(pageNumber) {
        const previousPage = this.currentPage;
        this.currentPage = pageNumber;
        this.thumbs.forEach((thumb, index) => {
            thumb.el.classList.toggle('active', index + 1 === pageNumber);
        });
        const thumb = this.thumbs[pageNumber - 1];
        if (thumb) this.scrollThumbIntoComfortView(thumb.el);
        this.updateToolbar();
        if (previousPage !== pageNumber) {
            this.toolbar.notify('onPageChange', { pageNumber, viewer: this });
        }
        if (previousPage !== pageNumber && typeof this.options.onPageChange === 'function') {
            this.options.onPageChange(pageNumber, this);
        }
    }

    getPageItem(pageNumber) {
        return this.pages[pageNumber - 1] || null;
    }

    getPageRotation(page) {
        const sourceRotation = this.options.respectPageRotation ? Number(page?.rotate) || 0 : 0;
        return ((sourceRotation + this.rotation) % 360 + 360) % 360;
    }

    getCurrentPageItem() {
        return this.getPageItem(this.currentPage);
    }

    scrollThumbIntoComfortView(thumbEl) {
        const viewHeight = this.thumbsEl.clientHeight;
        const viewTop = this.thumbsEl.scrollTop;
        const thumbTop = thumbEl.offsetTop;
        const thumbHeight = thumbEl.offsetHeight;
        const thumbCenter = thumbTop + thumbHeight / 2;
        const comfortTop = viewTop + viewHeight * 0.34;
        const comfortBottom = viewTop + viewHeight * 0.66;

        if (thumbCenter < comfortTop) {
            this.thumbsEl.scrollTo({
                top: Math.max(0, thumbCenter - viewHeight * 0.42),
                behavior: 'smooth'
            });
        } else if (thumbCenter > comfortBottom) {
            this.thumbsEl.scrollTo({
                top: Math.max(0, thumbCenter - viewHeight * 0.58),
                behavior: 'smooth'
            });
        }
    }

    handleScroll() {
        if (!this.pdf) return;
        if (this.programmaticScrollPage) {
            window.clearTimeout(this.programmaticScrollTimer);
            this.programmaticScrollTimer = window.setTimeout(() => {
                const pageNumber = this.programmaticScrollPage;
                this.programmaticScrollPage = null;
                this.setCurrentPage(pageNumber);
            }, 180);
            return;
        }

        const stageTop = this.stage.getBoundingClientRect().top;
        let active = this.currentPage;
        let best = Infinity;

        this.pages.forEach(item => {
            const rect = item.el.getBoundingClientRect();
            const distance = Math.abs(rect.top - stageTop - 18);
            if (distance < best) {
                best = distance;
                active = Number(item.el.dataset.pageNumber);
            }
        });

        if (active !== this.currentPage) {
            this.setCurrentPage(active);
        }
    }

    async search(query) {
        this.searchQuery = query.trim();
        const needle = this.searchQuery.toLowerCase();
        this.clearHighlights();
        this.searchMatches = [];
        this.currentSearchIndex = -1;

        if (!this.pdf || !needle) {
            this.updateToolbar();
            return;
        }

        for (let pageNumber = 1; pageNumber <= this.pdf.numPages; pageNumber += 1) {
            if (!this.pageText.has(pageNumber)) {
                const page = await this.pdf.getPage(pageNumber);
                const textContent = await page.getTextContent();
                this.pageText.set(pageNumber, textContent.items.map(text => text.str).join(' '));
            }
            const haystack = this.pageText.get(pageNumber).toLowerCase();
            if (haystack.includes(needle)) {
                this.searchMatches.push(pageNumber);
                this.highlightPage(pageNumber);
            }
        }

        this.updateToolbar();
        if (this.searchMatches.length) {
            this.goToSearchMatch(0);
        }
    }

    highlightPage(pageNumber) {
        const item = this.pages[pageNumber - 1];
        const needle = this.searchQuery.trim();
        if (!item || !needle || !item.textLayer.children.length) return;

        Array.from(item.textLayer.querySelectorAll('span')).forEach(span => {
            const text = span.textContent;
            const index = text.toLowerCase().indexOf(needle.toLowerCase());
            if (index === -1) return;
            const before = text.slice(0, index);
            const match = text.slice(index, index + needle.length);
            const after = text.slice(index + needle.length);
            span.innerHTML = `${escapeHtml(before)}<mark>${escapeHtml(match)}</mark>${escapeHtml(after)}`;
        });
    }

    clearHighlights() {
        this.pages.forEach(item => {
            Array.from(item.textLayer.querySelectorAll('span')).forEach(span => {
                span.textContent = span.textContent;
            });
        });
    }

    goToSearchMatch(index) {
        if (!this.searchMatches.length) return;
        const normalized = (index + this.searchMatches.length) % this.searchMatches.length;
        this.currentSearchIndex = normalized;
        this.goToPage(this.searchMatches[normalized]);
        this.updateToolbar();
    }

    updateToolbar() {
        this.app.classList.toggle('pv-has-document', Boolean(this.pdf));
        this.toolbar.update();
    }

    setLoading(message) {
        this.empty.classList.remove('d-none');
        this.empty.innerHTML = `<div class="pv-loader"></div><h2>${message}</h2><p>Please wait while the document is prepared.</p>`;
    }

    showError(error) {
        this.empty.classList.remove('d-none');
        const openButton = this.hasToolbarPlugin('open')
            ? '<button class="btn btn-blue pv-empty-open" type="button" data-action="open">Choose another PDF</button>'
            : '';
        this.empty.innerHTML = `
            <div class="pv-empty-icon pv-empty-error">!</div>
            <h2>Could not open this PDF</h2>
            <p>${escapeHtml(error && error.message ? error.message : 'The selected file could not be loaded.')}</p>
            ${openButton}
        `;
        this.updateToolbar();
    }

    getToolbarPlugin(id) {
        return this.toolbar.get(id);
    }

    hasToolbarPlugin(id) {
        return this.toolbar.has(id);
    }

    destroy() {
        this.destroyDocument();
        window.clearTimeout(this.fitWidthTimer);
        window.clearTimeout(this.programmaticScrollTimer);
        this.toolbar.destroy();
        this.pageOverlay.destroy();
        this.container.removeEventListener('click', this.handleContainerClick);
        this.stage.removeEventListener('scroll', this.handleStageScroll);
        this.stage.removeEventListener('wheel', this.handleStageWheel);
        this.pageObserver.disconnect();
        this.thumbObserver.disconnect();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.handleWindowResize) {
            window.removeEventListener('resize', this.handleWindowResize);
        }
        this.container.innerHTML = '';
        this.container.classList.remove('pdf-viewer');
    }
}
