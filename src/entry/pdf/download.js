import '../common';
import '@css/upload.css';
import '@css/download.css';
import { dbGet, dbGetAll, dbGetLatestByTool, dbDelete } from './_db';
import { EVENTS } from '@common/hook';
import { saveAs } from 'file-saver';
import DialogConfirm from '@components/dialog/confirm';
import { getUrlParam } from '@libs/misc';

try {
    const elBtnDownload = $D.get('.btn-download');
    const elBtnRemove = $D.get('#btn-remove');
    const dataId = getUrlParam('id');
    const tool = PAGE_NAME.replace('_download', '');
    const dataPromise = dataId ? dbGet(dataId) : dbGetLatestByTool(tool);
    dataPromise.then(data => {
        if (!data) {
            setDeletedState();
            return;
        }
        setReadyState();

        elBtnDownload.addEventListener('click', () => {
            if (data) {
                if (!$APP.checkUploadConfig(tool, data)) {
                    return false;
                }
                saveAs(data.file, data.fileName);
            } else {
                $L.get('download.fileHasDeleted');
            }
        });

        const elYes = $D.create('a');
        elYes.classList.add('btn', 'btn-red', 'btn-sm');
        elYes.textContent = $L.get('download.delete');
        const elNo = $D.create('a');
        elNo.classList.add('btn', 'btn-normal', 'btn-sm');
        elNo.textContent = $L.get('download.cancel');
        const dialog = new DialogConfirm({
            showClose: false,
            title: $L.get('download.confirmDeleteFile'),
            order: 'DESC',
            width: 'auto',
            height: 'auto',
            elYes: elYes,
            elNo: elNo,
            initOpened: false,
            onYes: () => {
                if (!data) {
                    return;
                }
                dbDelete(data.id);
                location.reload();
            }
        });

        elBtnRemove.addEventListener('click', e => {
            e.preventDefault();
            dialog.open();
        });
    });
} catch (e) {
    $HOOK.dispatch(EVENTS.MESSAGE.ERROR, {
        msg: $L.get('common.errorMsg')
    });
}

function setReadyState() {
    const elCardSuccess = $D.get('.card-success');
    const elBtnDownload = $D.get('.btn-download');
    const elBtnRemove = $D.get('#btn-remove');
    const elActions = $D.get('.actions');

    if (elCardSuccess) {
        elCardSuccess.classList.remove('visible-hidden', 'is-deleted');
    }
    if (elBtnDownload) {
        elBtnDownload.classList.remove('d-hide');
        elBtnDownload.removeAttribute('disabled');
    }
    if (elBtnRemove) {
        elBtnRemove.classList.remove('d-hide');
    }
    if (elActions) {
        elActions.classList.remove('d-hide');
    }
}

function setDeletedState() {
    const elCardSuccess = $D.get('.card-success');
    const elIconSuccess = $D.get('.icon-success', elCardSuccess);
    const elContent = $D.get('.card-success-content', elCardSuccess);
    const elTitle = $D.get('strong', elContent);
    const elDesc = elContent ? $D.getAll('p', elContent) : [];
    const elBtnDownload = $D.get('.btn-download');
    const elBtnUploadAgain = $D.get('.btn-upload-again');
    const elBtnRemove = $D.get('#btn-remove');
    const elActions = $D.get('.actions');

    if (elCardSuccess) {
        elCardSuccess.classList.remove('visible-hidden');
        elCardSuccess.classList.add('is-deleted');
    }
    if (elIconSuccess) {
        elIconSuccess.textContent = '\u00d7';
    }
    if (elTitle) {
        elTitle.textContent = $L.get('download.fileHasDeleted');
    }
    if (elDesc[0]) {
        elDesc[0].textContent = $L.get('download.downError');
    }
    if (elDesc[1]) {
        elDesc[1].textContent = $L.get('download.downError2');
    }
    if (elBtnDownload) {
        elBtnDownload.classList.add('d-hide');
        elBtnDownload.setAttribute('disabled', 'disabled');
    }
    if (elBtnRemove) {
        elBtnRemove.classList.add('d-hide');
    }
    if (elBtnUploadAgain) {
        elBtnUploadAgain.classList.remove('d-hide');
    }
    if (elActions) {
        elActions.classList.remove('d-hide');
    }
}