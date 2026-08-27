import './common';
import '@css/index.css';
import { saveQuickUpload } from './_quick_upload';

const PDF_TARGETS = {
    doc: 'word_to_pdf',
    docx: 'word_to_pdf',
    xls: 'excel_to_pdf',
    xlsx: 'excel_to_pdf',
    csv: 'excel_to_pdf',
    ppt: 'ppt_to_pdf',
    pptx: 'ppt_to_pdf',
    jpg: 'images_to_pdf',
    jpeg: 'images_to_pdf',
    png: 'images_to_pdf',
    webp: 'images_to_pdf',
    bmp: 'images_to_pdf'
};

document.addEventListener('DOMContentLoaded', () => {
    const quickConverter = $D.get('[data-quick-converter]');
    if (quickConverter) {
        initQuickConverter(quickConverter);
    }

    function scrollToTarget(target, hash) {
        if (!target) return;
        const offset = 130;
        const targetTop = window.scrollY + target.getBoundingClientRect().top - offset;
        window.scrollTo({
            top: Math.max(targetTop, 0),
            behavior: 'smooth'
        });

        if (hash) {
            if (window.history?.replaceState) {
                window.history.replaceState(null, '', hash);
            } else {
                window.location.hash = hash.replace(/^#/, '');
            }
        }
    }

    function setActiveMenuLink(activeLink) {
        $D.getAll('[data-tool-menu-link]').forEach(link => {
            link.classList.toggle('is-active', link === activeLink);
        });
    }

    $D.getAll('.all-tools, [data-tool-menu-link]').forEach(trigger => {
        const hash = trigger.getAttribute('href');
        if (!hash || hash.charAt(0) !== '#') return;

        trigger.addEventListener('click', e => {
            const target = $D.get(hash);
            if (!target) return;

            e.preventDefault();
            scrollToTarget(target, hash);

            if (trigger.hasAttribute('data-tool-menu-link')) {
                setActiveMenuLink(trigger);
            }
        });
    });

    const hashLink = window.location.hash ? $D.get(`[data-tool-menu-link][href="${window.location.hash}"]`) : null;
    if (hashLink) {
        setActiveMenuLink(hashLink);
    }
});

function initQuickConverter(wrapper) {
    const dropzone = $D.get('[data-quick-dropzone]', wrapper);
    const input = $D.get('[data-quick-file]', wrapper);
    const target = $D.get('[data-quick-target]', wrapper);
    const chooseButton = $D.get('[data-quick-choose]', wrapper);
    const submitButton = $D.get('[data-quick-submit]', wrapper);
    const note = $D.get('[data-quick-note]', wrapper);
    const error = $D.get('[data-quick-error]', wrapper);
    const routeData = $D.get('[data-pdf-route-word_to_pdf]', wrapper);
    const emptyState = $D.get('[data-quick-empty]', wrapper);
    const selectedState = $D.get('[data-quick-selected]', wrapper);
    const selectedFileName = $D.get('[data-quick-file-name]', wrapper);
    const selectedFileSize = $D.get('[data-quick-file-size]', wrapper);
    const reselectButton = $D.get('[data-quick-reselect]', wrapper);
    const removeButton = $D.get('[data-quick-remove]', wrapper);
    let selectedFile = null;

    function getExtension(file) {
        const name = file && file.name ? file.name : '';
        return name.includes('.') ? name.split('.').pop().toLowerCase() : '';
    }

    function updateAcceptedFiles() {
        const toPdf = target.value === 'pdf';
        input.accept = toPdf
            ? '.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.bmp'
            : '.pdf';
        note.textContent = toPdf
            ? wrapper.dataset.supportedToPdf
            : wrapper.dataset.pdfOnly;
        error.textContent = '';
    }

    function openPicker() {
        if (submitButton.disabled) return;
        input.value = '';
        input.click();
    }

    function formatFileSize(bytes) {
        if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
        const value = bytes / Math.pow(1024, unitIndex);
        const precision = unitIndex === 0 || value >= 10 ? 0 : 1;
        return `${value.toFixed(precision)} ${units[unitIndex]}`;
    }

    function resolveDestination(file) {
        const extension = getExtension(file);
        if (target.value === 'pdf') {
            const tool = PDF_TARGETS[extension];
            if (!tool) {
                error.textContent = wrapper.dataset.invalidPdfTarget;
                return null;
            }
            return {
                tool,
                url: routeData.getAttribute(`data-pdf-route-${tool}`)
            };
        }

        if (extension !== 'pdf') {
            error.textContent = wrapper.dataset.invalidPdf;
            return null;
        }

        const option = target.options[target.selectedIndex];
        return {
            tool: option.dataset.tool,
            url: option.dataset.url
        };
    }

    async function handleFile(file) {
        if (!file || submitButton.disabled) return;
        error.textContent = '';
        const destination = resolveDestination(file);
        if (!destination || !destination.url) return;

        submitButton.disabled = true;

        try {
            const token = await saveQuickUpload(file, destination.tool);
            const url = new URL(destination.url, window.location.href);
            url.searchParams.set('quick_upload', token);
            window.location.href = url.toString();
        } catch (storageError) {
            error.textContent = wrapper.dataset.storageError;
            submitButton.disabled = false;
        }
    }

    function selectFile(file) {
        if (!file) return;
        selectedFile = file;
        selectedFileName.textContent = file.name;
        selectedFileName.title = file.name;
        selectedFileSize.textContent = formatFileSize(file.size);
        emptyState.classList.add('d-hide');
        selectedState.classList.remove('d-hide');
        dropzone.classList.add('has-file');
        submitButton.classList.add('is-ready');
        error.textContent = '';
    }

    function clearSelectedFile() {
        selectedFile = null;
        input.value = '';
        selectedFileName.textContent = '';
        selectedFileName.removeAttribute('title');
        selectedFileSize.textContent = '';
        selectedState.classList.add('d-hide');
        emptyState.classList.remove('d-hide');
        dropzone.classList.remove('has-file');
        submitButton.classList.remove('is-ready');
        error.textContent = '';
    }

    target.addEventListener('change', updateAcceptedFiles);
    input.addEventListener('change', () => selectFile(input.files && input.files[0]));
    chooseButton.addEventListener('click', event => {
        event.stopPropagation();
        openPicker();
    });
    reselectButton.addEventListener('click', event => {
        event.stopPropagation();
        openPicker();
    });
    removeButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        clearSelectedFile();
    });
    submitButton.addEventListener('click', () => {
        if (!selectedFile) {
            openPicker();
            return;
        }
        handleFile(selectedFile);
    });
    dropzone.addEventListener('click', event => {
        if (!event.target.closest('[data-quick-action]')) openPicker();
    });
    dropzone.addEventListener('keydown', event => {
        if (event.target !== dropzone) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPicker();
        }
    });
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, event => {
            event.preventDefault();
            dropzone.classList.add('is-dragging');
        });
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, event => {
            event.preventDefault();
            dropzone.classList.remove('is-dragging');
        });
    });
    dropzone.addEventListener('drop', event => {
        selectFile(event.dataTransfer && event.dataTransfer.files[0]);
    });

    updateAcceptedFiles();
}
