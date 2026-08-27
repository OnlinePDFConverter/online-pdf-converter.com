import '../common';
import '@css/upload.css';
import '@css/pdf/pdf_to_png.css';
import { fileUpload, elements } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';

const outputFileName = data => {
    const outputCount = Array.isArray(data.blob) ? data.blob.length : 1;
    return outputCount > 1
        ? `{name}_pdf_to_png.${data.outputFormat}`
        : `{name}.${data.outputFormat}`;
};
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/pdf_to_png.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    elements,
    outputFileName
});

fileUpload.setOption({
    acceptedFiles: '.pdf',
    singleMode: true
});

fileUpload.onProcess = () => {
    startProcess(getSettings());
}
    
fileUpload.init();


const elScale = $D.get('[data-images-scale]');
const elFormat = $D.get('[data-images-format]');
const elQualityWrap = $D.get('[data-images-quality-wrap]');
const elQuality = $D.get('[data-images-quality]');
const elQualityValue = $D.get('[data-images-quality-value]');
const elLayoutGrid = $D.get('[data-images-layout-grid]');
const elCustomLayout = $D.get('[data-images-custom-layout]');
const elCustomLayoutCols = $D.get('[data-images-custom-layout-cols]');
const elCustomLayoutRows = $D.get('[data-images-custom-layout-rows]');

elQuality.addEventListener('input', () => {
    elQualityValue.textContent = `${elQuality.value}%`
});

elFormat.addEventListener('change', () => {
    const outputFormat = elFormat.value;
    const usesQuality = outputFormat === 'jpg' || outputFormat === 'webp';
    elQualityWrap.classList.toggle('d-hide', !usesQuality);
});
$D.getAll('input[name="images-layout"]').forEach(input => {
    input.addEventListener('change', syncLayoutControls);
});

function getSettings() {
    return {
        settings: {
            outputFormat: elFormat.value,
            scale: parseFloat(elScale.value) || 2,
            quality: parseInt(elQuality.value, 10) / 100,
            layout: getSelectedLayout()
        }
    }
}

function getSelectedLayout() {
    const layoutChecked = $D.get('input[name="images-layout"]:checked');
    const isCustom = layoutChecked.value == 'custom';
    return {
        columns: isCustom ? elCustomLayoutCols.value : layoutChecked.dataset.cols,
        rows: isCustom ? elCustomLayoutRows.value : layoutChecked.dataset.rows
    };
}

function syncLayoutControls() {
    $D.getAll('.images-layout-option', elLayoutGrid).forEach(option => {
        const input = $D.get('input[name="images-layout"]', option);
        option.classList.toggle('is-active', input.checked);
    });
    elCustomLayout.classList.toggle('d-hide', $D.get('input[name="images-layout"]:checked').value !== 'custom');
}

