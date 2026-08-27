import '../common';
import '@css/upload.css';
import '@css/pdf/split_pdf.css';
import { fileUpload, elements } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';
import { EVENTS } from '@src/common/hook';

const outputFileName = '{name}_split.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/split_pdf.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    outputFileName
});

fileUpload.setOption({
    acceptedFiles: '.pdf',
    singleMode: true,
    previewMode: 'page_selectable'
});

fileUpload.availableProcess = () => {
    return elements.elFileList.querySelectorAll('.file-item[data-page-number].is-selected').length > 0;
}

fileUpload.onProcess = () => {
    startProcess(getSettings());
}

fileUpload.init();

const elSplitRange = $D.get('input[name="split-range"]');
const elSplitEveryN = $D.get('input[name="split-every-n"]');
const elDataSelectedPages = $D.get('[data-selected-pages]');
const elDataTotalPages = $D.get('[data-total-pages]');
const elDataPDFs = $D.get('[data-pdfs]');
initOptionInputSelection();
updateDataPDFs();

$HOOK.on(EVENTS.FILE.PREVIEWED, (e) => {
    const pages = e.data.file.extend.pageCount;
    elSplitRange.value = '1-' +pages;
    rangePages();
});

$D.getAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('click', e => {
        switch (e.target.value) {
            case 'range':
                rangePages();
                break;
            case 'every_page':
            case 'every_n':
                selectPages(() => true);
                break;
            case 'odd':
                selectPages(pageNumber => pageNumber % 2 === 1);
                break;
            case 'even':
                selectPages(pageNumber => pageNumber % 2 === 0);
                break;
        }
    })
});


function getSettings() {
    return {
        settings: {
            split: getSplitPages()
        }
    }
}

function getSplitPages() {
    const mode = $D.get('input[name="split-mode"]:checked')?.value;
    const pageElements = Array.from($D.getAll('.file-item[data-page-number]'));
    const allPages = pageElements
        .map(page => parseInt(page.getAttribute('data-page-number')))
        .filter(Number.isInteger)
        .sort((a, b) => a - b);

    let split = [];
    if (mode === 'range') {
        const selectedPages = pageElements
            .filter(page => page.classList.contains('is-selected'))
            .map(page => parseInt(page.getAttribute('data-page-number')))
            .filter(Number.isInteger)
            .sort((a, b) => a - b);
        split = [selectedPages];
    } else if (mode === 'every_page') {
        split = allPages.map(pageNumber => [pageNumber]);
    } else if (mode === 'every_n') {
        const everyN = Math.max(1, parseInt(elSplitEveryN.value) || 1);
        for (let index = 0; index < allPages.length; index += everyN) {
            split.push(allPages.slice(index, index + everyN));
        }
    } else if (mode === 'odd') {
        split = [allPages.filter(pageNumber => pageNumber % 2 === 1)];
    } else if (mode === 'even') {
        split = [allPages.filter(pageNumber => pageNumber % 2 === 0)];
    }

    return split.filter(pages => pages.length > 0);
}

function rangePages() {
    const pages = parsePageRange($D.get('input[name="split-range"]').value);
    if (pages === null) {
        return;
    }
    selectPages(pageNumber => pages.has(pageNumber));
}

function selectPages(predicate) {
    $D.getAll('.file-item[data-page-number]').forEach(page => {
        const pageNumber = parseInt(page.getAttribute('data-page-number'));
        page.classList.toggle('is-selected', predicate(pageNumber));
    });
    updateDataPDFs();
}

function updateDataPDFs() {
    const totalPages = $D.getAll('.file-item[data-page-number]').length;
    const selectedPages = $D.getAll('.file-item[data-page-number].is-selected').length;
    const split = getSplitPages();
    if (elDataSelectedPages) {
        elDataSelectedPages.textContent = selectedPages;
    }
    if (elDataTotalPages) {
        elDataTotalPages.textContent = totalPages;
    }
    if (elDataPDFs) {
        elDataPDFs.textContent = split.length;
    }
    fileUpload.updateProcessButtonState();
}

function initOptionInputSelection() {
    const inputs = document.querySelectorAll('.option-radio input[type="text"], .option-radio input[type="number"]');
    inputs.forEach(input => {
        const selectParentOption = () => {
            const option = input.closest('.option-radio');
            const radio = option.querySelector('input[type="radio"][name="split-mode"]');
            if (!radio || radio.checked) {
                return;
            }
            radio.checked = true;
            radio.dispatchEvent(new Event('click'));
        };
        input.addEventListener('focus', selectParentOption);
        input.addEventListener('click', selectParentOption);
    });

    const rangeInput = $D.get('input[name="split-range"]');
    rangeInput.addEventListener('input', () => {
        if ($D.get('input[name="split-mode"]:checked')?.value === 'range') {
            rangePages();
        }
    });

    elSplitEveryN.addEventListener('input', updateDataPDFs);
    elements.elFileList.addEventListener('click', e => {
        if (e.target.closest('.file-item[data-page-number]')) {
            updateDataPDFs();
        }
    });
}

function parsePageRange(value) {
    const valueTrimmed = value.trim();
    if (!valueTrimmed) {
        return new Set();
    }

    const pages = new Set();
    const parts = valueTrimmed.split(',');
    for (const item of parts) {
        const match = item.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
        if (!match) {
            return null;
        }

        let start = parseInt(match[1]);
        let end = match[2] ? parseInt(match[2]) : start;
        if (start < 1 || end < 1) {
            return null;
        }
        if (start > end) {
            [start, end] = [end, start];
        }
        for (let pageNumber = start; pageNumber <= end; pageNumber++) {
            pages.add(pageNumber);
        }
    }
    return pages;
}
