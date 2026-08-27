import '../common';
import '@css/upload.css';
import '@css/pdf/protect_pdf.css';
import { fileUpload, elements } from '@src/entry/pdf/_file_upload';
import { initWorker } from './_worker';

const outputFileName = '{name}_protected.pdf';
const { startProcess } = initWorker({
    worker: new Worker(new URL('@src/workers/protect_pdf.worker.js', import.meta.url), { type: 'module' }),
    fileUpload,
    elements,
    outputFileName
});

fileUpload.setOption({
    acceptedFiles: '.pdf'
});

fileUpload.onProcess = () => {
    if (!validatePasswords()) {
        fileUpload.updateProcessButtonState();
        return;
    }
    startProcess(getSettings());
}
    
fileUpload.init();

const elUserPassword = $D.get('[data-protect-user-password]');
const elUserPasswordConfirm = $D.get('[data-protect-user-password-confirm]');
const elOwnerPassword = $D.get('[data-protect-owner-password]');
const elOwnerPasswordConfirm = $D.get('[data-protect-owner-password-confirm]');

[elUserPassword, elUserPasswordConfirm].forEach(input => {
    input.addEventListener('input', () => elUserPasswordConfirm.setCustomValidity(''));
});

[elOwnerPassword, elOwnerPasswordConfirm].forEach(input => {
    input.addEventListener('input', () => elOwnerPasswordConfirm.setCustomValidity(''));
});

function getSettings() {
    const permissions = {};
    $D.getAll('[data-protect-permission]').forEach(input => {
        permissions[input.getAttribute('data-protect-permission')] = input.checked;
    });

    return {
        settings: {
            userPassword: elUserPassword.value,
            ownerPassword: elOwnerPassword.value,
            permissions
        }
    }
}

function validatePasswords() {
    elUserPasswordConfirm.setCustomValidity('');
    elOwnerPasswordConfirm.setCustomValidity('');

    if (elUserPassword.value !== elUserPasswordConfirm.value) {
        elUserPasswordConfirm.setCustomValidity('User passwords do not match.');
        elUserPasswordConfirm.reportValidity();
        elUserPasswordConfirm.focus();
        return false;
    }

    if (elOwnerPassword.value !== elOwnerPasswordConfirm.value) {
        elOwnerPasswordConfirm.setCustomValidity('Owner passwords do not match.');
        elOwnerPasswordConfirm.reportValidity();
        elOwnerPasswordConfirm.focus();
        return false;
    }

    return true;
}
