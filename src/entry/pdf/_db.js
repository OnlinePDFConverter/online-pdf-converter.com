import { WebDB } from '@libs/webDB';
import { $C } from '@common/constants';

const webDB = new WebDB($C.store.name, $C.store.tableName, $C.store.version);
let readyPromise = null;

function dbInit() {
    if (!readyPromise) {
        readyPromise = webDB.init();
    }
    return readyPromise;
}

function normalizeTool(tool) {
    const pageName = typeof PAGE_NAME === 'undefined' ? '' : PAGE_NAME;
    return String(tool || pageName).replace(/_download$/, '');
}

function getUserId() {
    return typeof $APP === 'undefined' ? 0 : parseInt($APP.user.id, 10) || 0;
}

function getDownloadUrl(tool) {
    const baseUrl = typeof BASE_URL === 'undefined' ? '/' : BASE_URL;
    const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    return base + normalizeTool(tool).replace(/_/g, '-') + '-download';
}

function createDbId(tool) {
    const random = Math.random().toString(36).slice(2, 10);
    return `${normalizeTool(tool)}_${Date.now()}_${random}`;
}

function dbSave(id, fileName, file, fileCount, extra, tool, callback) {
    const toolId = normalizeTool(tool);
    const data = {
        id: id,
        user_id: getUserId(),
        fileName: encodeURIComponent(fileName),
        file,
        fileCount,
        extra,
        date: new Date().getTime(),
        tool: toolId,
        toolName: TOOL_NAME ?? ''
    };

    return dbInit().then(() => webDB.update(data)).then(() => {
        if (typeof (callback) == 'function') {
            callback(file, data);
        }
        return data;
    });
}

function dbGet(id) {
    return dbInit().then(() => webDB.get(id));
}

function dbGetAll() {
    return dbInit().then(() => webDB.getAll());
}

function dbGetLatestByTool(tool) {
    const currentTool = normalizeTool(tool);
    return dbGetAll().then(items => {
        return items
            .filter(item => normalizeTool(item.tool || item.id) === currentTool)
            .sort((a, b) => (b.date || 0) - (a.date || 0))[0];
    });
}

function dbDelete(id) {
    return dbInit().then(() => webDB.delete(id));
}

function dbSaveAndRedirect({ id, fileName, file, fileCount, extra, tool, callback }) {
    const dataId = id || createDbId(tool);
    const dataTool = tool || normalizeTool(dataId);
    return dbSave(dataId, fileName, file, fileCount, extra, dataTool, callback).then(data => {
        return dbGet(data.id).then(storedData => {
            if (!storedData) {
                throw new Error('File save failed.');
            }
            window.location.href = `${getDownloadUrl(dataTool)}?id=${encodeURIComponent(data.id)}`;
            return data;
        });
    });
}

export {
    dbInit,
    dbSave,
    dbGet,
    dbGetAll,
    dbGetLatestByTool,
    dbDelete,
    getDownloadUrl,
    createDbId,
    dbSaveAndRedirect
}
