import '../common';
import '@css/upload.css';
import '@css/pdf/pdf_multi_tool.css';
import { fileUpload, elements, setPreviewTemplate } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';
import { initFileSortable } from './_file_sortable';
import { EVENTS } from '@src/common/hook';

const PAGE_SELECTOR = '.file-item[data-page-number]';
const ROTATION_STEP = 90;

let previewTemplate = `
<div class="file-item">
    <span class="file-check"></span>
    <div class="file-icon">
        <img data-dz-thumbnail data-page-preview />
    </div>
    <div class="file-meta">
        <strong data-dz-name></strong>
        <span class="upload-status" data-dz-errormessage></span>
    </div>
    <div class="file-pages-size">
        <span class="file-pages"></span>
        <span class="file-size"></span>
    </div>
    <button class="file-remove" type="button" data-dz-remove>×</button>
    <div class="d-flex justify-content-center gap-10">
        <button type="button" class="action-button" data-add-page>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path d="M304 112L192 112C183.2 112 176 119.2 176 128L176 512C176 520.8 183.2 528 192 528L448 528C456.8 528 464 520.8 464 512L464 272L376 272C336.2 272 304 239.8 304 200L304 112zM444.1 224L352 131.9L352 200C352 213.3 362.7 224 376 224L444.1 224zM128 128C128 92.7 156.7 64 192 64L325.5 64C342.5 64 358.8 70.7 370.8 82.7L493.3 205.3C505.3 217.3 512 233.6 512 250.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128z"/>
            </svg>
        </button>
        <button type="button" class="action-button" data-duplicate>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path d="M480 400L288 400C279.2 400 272 392.8 272 384L272 128C272 119.2 279.2 112 288 112L421.5 112C425.7 112 429.8 113.7 432.8 116.7L491.3 175.2C494.3 178.2 496 182.3 496 186.5L496 384C496 392.8 488.8 400 480 400zM288 448L480 448C515.3 448 544 419.3 544 384L544 186.5C544 169.5 537.3 153.2 525.3 141.2L466.7 82.7C454.7 70.7 438.5 64 421.5 64L288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L368 496L368 512C368 520.8 360.8 528 352 528L160 528C151.2 528 144 520.8 144 512L144 256C144 247.2 151.2 240 160 240L176 240L176 192L160 192z"></path>
            </svg>
        </button>
        <button type="button" class="action-button" data-rotate-left>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path
                    d="M88 256L232 256C241.7 256 250.5 250.2 254.2 241.2C257.9 232.2 255.9 221.9 249 215L202.3 168.3C277.6 109.7 386.6 115 455.8 184.2C530.8 259.2 530.8 380.7 455.8 455.7C380.8 530.7 259.3 530.7 184.3 455.7C174.1 445.5 165.3 434.4 157.9 422.7C148.4 407.8 128.6 403.4 113.7 412.9C98.8 422.4 94.4 442.2 103.9 457.1C113.7 472.7 125.4 487.5 139 501C239 601 401 601 501 501C601 401 601 239 501 139C406.8 44.7 257.3 39.3 156.7 122.8L105 71C98.1 64.2 87.8 62.1 78.8 65.8C69.8 69.5 64 78.3 64 88L64 232C64 245.3 74.7 256 88 256z">
                </path>
            </svg>
        </button>
        <button type="button" class="action-button" data-rotate-right>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path
                    d="M552 256L408 256C398.3 256 389.5 250.2 385.8 241.2C382.1 232.2 384.1 221.9 391 215L437.7 168.3C362.4 109.7 253.4 115 184.2 184.2C109.2 259.2 109.2 380.7 184.2 455.7C259.2 530.7 380.7 530.7 455.7 455.7C463.9 447.5 471.2 438.8 477.6 429.6C487.7 415.1 507.7 411.6 522.2 421.7C536.7 431.8 540.2 451.8 530.1 466.3C521.6 478.5 511.9 490.1 501 501C401 601 238.9 601 139 501C39.1 401 39 239 139 139C233.3 44.7 382.7 39.4 483.3 122.8L535 71C541.9 64.1 552.2 62.1 561.2 65.8C570.2 69.5 576 78.3 576 88L576 232C576 245.3 565.3 256 552 256z">
                </path>
            </svg>
        </button>
    </div>
    <div class="file-progress d-hide">
        <div class="file-progress-info">
            <span data-progress-text></span>
            <span data-progress-percent>0%</span>
        </div>
        <div class="file-progress-bar"><span data-progress-bar></span></div>
    </div>
</div>
`;
setPreviewTemplate(previewTemplate);

const outputFileName = '{name}_pdf_multi_tool.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/pdf_multi_tool.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    elements,
    outputFileName
});

fileUpload.setOption({
    acceptedFiles: '.pdf',
    singleMode: true,
    previewMode: 'page_removable',
    previewClass: ['cursor-move']
});

fileUpload.availableProcess = () => {
    return fileUpload.getAcceptedFiles().length > 0
        && elements.elFileList.querySelector(PAGE_SELECTOR) !== null;
}

fileUpload.onProcess = () => {
    startProcess({}, customGetFiles);
}
    
fileUpload.init();

initFileSortable(fileUpload, elements.elFileList, {
    animation: 150,
    draggable: '.file-item',
    ghostClass: 'merge-sort-ghost',
    chosenClass: 'merge-sort-chosen',
    dragClass: 'merge-sort-drag',
    filter: 'button, input, textarea, select, a, label',
    preventOnFilter: false
});

$HOOK.on(EVENTS.FILE.PREVIEWED, () => {
    $D.getAll('.file-item', elements.elFileList).forEach(pageElement => {
        bindEvents(pageElement);
    });
});

function bindEvents(pageElement, isBindDelete) {
    $D.get('[data-add-page]', pageElement).addEventListener('click', e => {
        addBlankPage(pageElement);
    });
    $D.get('[data-duplicate]', pageElement).addEventListener('click', e => {
        duplicatePage(pageElement);
    });
    $D.get('[data-rotate-left]', pageElement).addEventListener('click', e => {
        setPageRotation(pageElement, getPageRotation(pageElement) - ROTATION_STEP);
    });
    $D.get('[data-rotate-right]', pageElement).addEventListener('click', e => {
        setPageRotation(pageElement, getPageRotation(pageElement) + ROTATION_STEP);
    });
    if (isBindDelete) {
        $D.get('[data-dz-remove]', pageElement).addEventListener('click', e => {
            pageElement.remove();
        });
    }
}

function duplicatePage(pageElement) {
    const duplicate = pageElement.cloneNode(true);
    bindEvents(duplicate, true);
    pageElement.after(duplicate);
}

function normalizeRotation(rotation) {
    return ((rotation % 360) + 360) % 360;
}

function getPageRotation(pageElement) {
    const rotation = Number(pageElement.getAttribute('data-rotation'));
    return Number.isFinite(rotation) ? rotation : 0;
}

function setPageRotation(pageElement, rotation) {
    const pageRotation = Number.isFinite(rotation) ? rotation : 0;
    const normalizedRotation = normalizeRotation(pageRotation);
    const isQuarterTurn = normalizedRotation === 90 || normalizedRotation === 270;
    pageElement.setAttribute('data-rotation', pageRotation);
    pageElement.toggleAttribute('data-quarter-turn', isQuarterTurn);
    pageElement.style.setProperty('--page-rotation', `${pageRotation}deg`);
}

function addBlankPage(pageElement) {
    const blankPage = pageElement.cloneNode(true);
    const blankPreview = document.createElement('span');
    blankPreview.classList.add('blank-page-preview', 'wp-100');
    blankPreview.setAttribute('data-page-preview', '');
    const clonedPreview = blankPage.querySelector('[data-page-preview]');
    if (clonedPreview) {
        clonedPreview.replaceWith(blankPreview);
    }
    blankPage.setAttribute('data-blank-page', 'true');
    blankPage.setAttribute('data-render-state', 'done');
    setPageRotation(blankPage, 0);
    blankPage.querySelector('[data-dz-name]').textContent = $L.get('pdf_multi_tool.blankPage');
    blankPage.querySelector('[data-dz-errormessage]').textContent = '';
    blankPage.querySelector('.file-pages').textContent = '';
    blankPage.querySelector('.file-size').textContent = '';
    bindEvents(blankPage, true);
    pageElement.after(blankPage);
}

function customGetFiles() {
    return Array.from(elements.elFileList.querySelectorAll(PAGE_SELECTOR)).map(pageElement => {
        const fileId = pageElement.getAttribute('data-file-id');
        const pageNumber = Number(pageElement.getAttribute('data-page-number'));
        const blank = pageElement.hasAttribute('data-blank-page');
        const rawRotation = pageElement.getAttribute('data-rotation');

        return {
            fileId,
            file: fileUpload.getFileById(fileId),
            pageNumber,
            rotation: rawRotation === null ? null : normalizeRotation(Number(rawRotation)),
            blank
        };
    }).filter(item => item.file && Number.isInteger(item.pageNumber) && item.pageNumber > 0);
}
