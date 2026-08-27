import '../common';
import '@css/upload.css';
import '@css/pdf/compress_pdf.css';
import { fileUpload } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';

const outputFileName = '{name}_compressed.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/compress_pdf.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    outputFileName
});

fileUpload.setOption({
    acceptedFiles: '.pdf'
});

fileUpload.onProcess = () => {
    startProcess(getSettings());
}

fileUpload.init();

const elCustomSettings = $D.get('[data-compress-custom-settings]');
const elCustomStructure = $D.get('[data-compress-custom-structure]');
const elCustomDpi = $D.get('[data-compress-custom-dpi]');
const elCustomDpiValue = $D.get('[data-compress-custom-dpi-value]');
const elCustomImageQuality = $D.get('[data-compress-custom-image-quality]');
const elCustomImageQualityValue = $D.get('[data-compress-custom-image-quality-value]');

$D.getAll('input[name="compress-quality"]').forEach(input => {
    input.addEventListener('change', syncCustomSettings);
});
elCustomDpi.addEventListener('input', updateCustomValues);
elCustomImageQuality.addEventListener('input', updateCustomValues);

function getSettings() {
    const quality = $D.get('input[name="compress-quality"]:checked')?.value || 'balanced';
    const settings = {
        quality,
        removeMetadata: $D.get('.checkbox[data-compress-metadata]').checked
    };

    if (quality === 'custom') {
        settings.customCoherentQuality = elCustomStructure.value;
        settings.customDpi = parseInt(elCustomDpi.value, 10);
        settings.customJpegQuality = parseInt(elCustomImageQuality.value, 10);
    }

    return {
        settings
    }
}

function syncCustomSettings() {
    const isCustom = $D.get('input[name="compress-quality"]:checked')?.value === 'custom';
    elCustomSettings.classList.toggle('d-hide', !isCustom);
}

function updateCustomValues() {
    elCustomDpiValue.textContent = `${elCustomDpi.value} DPI`;
    elCustomImageQualityValue.textContent = `${elCustomImageQuality.value}%`;
}
