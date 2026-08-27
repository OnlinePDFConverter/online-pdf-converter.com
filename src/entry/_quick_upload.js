const DB_NAME = `${APP_NAME}_quick_upload`;
const STORE_NAME = 'files';
const DB_VERSION = 1;
const MAX_AGE = 30 * 60 * 1000;

let dbPromise = null;

function openDb() {
    if (!window.indexedDB) {
        return Promise.reject(new Error('INDEXED_DB_UNAVAILABLE'));
    }

    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = event => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
            request.onsuccess = event => resolve(event.target.result);
            request.onerror = event => reject(event.target.error || new Error('INDEXED_DB_OPEN_FAILED'));
        }).catch(error => {
            dbPromise = null;
            throw error;
        });
    }

    return dbPromise;
}

function createToken() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID().replace(/-/g, '');
    }
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

async function getAllRecords() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = event => reject(event.target.error);
    });
}

async function deleteRecord(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        transaction.objectStore(STORE_NAME).delete(id);
        transaction.oncomplete = () => resolve();
        transaction.onerror = event => reject(event.target.error);
        transaction.onabort = event => reject(event.target.error);
    });
}

async function cleanupExpiredQuickUploads(now = Date.now()) {
    const records = await getAllRecords();
    const expiredIds = records
        .filter(record => !record.createdAt || now - record.createdAt > MAX_AGE)
        .map(record => record.id);

    await Promise.all(expiredIds.map(deleteRecord));
}

async function saveQuickUpload(file, tool) {
    await cleanupExpiredQuickUploads().catch(() => {});
    const db = await openDb();
    const record = {
        id: createToken(),
        file,
        name: file.name,
        type: file.type,
        lastModified: file.lastModified,
        tool,
        createdAt: Date.now()
    };

    await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        transaction.objectStore(STORE_NAME).put(record);
        transaction.oncomplete = () => resolve();
        transaction.onerror = event => reject(event.target.error);
        transaction.onabort = event => reject(event.target.error);
    });

    return record.id;
}

async function consumeQuickUpload(id, expectedTool) {
    await cleanupExpiredQuickUploads();
    const db = await openDb();
    const record = await new Promise((resolve, reject) => {
        const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = event => reject(event.target.error);
    });

    if (!record) {
        throw new Error('QUICK_UPLOAD_NOT_FOUND');
    }

    await deleteRecord(id);

    if (!record.createdAt || Date.now() - record.createdAt > MAX_AGE) {
        throw new Error('QUICK_UPLOAD_EXPIRED');
    }
    if (record.tool !== expectedTool) {
        throw new Error('QUICK_UPLOAD_TOOL_MISMATCH');
    }

    const file = record.file instanceof File
        ? record.file
        : new File([record.file], record.name || 'file', {
            type: record.type || 'application/octet-stream',
            lastModified: record.lastModified || Date.now()
        });

    return { ...record, file };
}

export {
    cleanupExpiredQuickUploads,
    consumeQuickUpload,
    saveQuickUpload
};
