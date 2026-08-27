import { WebDB } from '@libs/webDB';

const DATABASE_NAME = 'pdf20-signatures';
const STORE_NAME = 'signatures';
const DATABASE_VERSION = 1;

export default class SignatureStorage {
    constructor() {
        this.database = null;
        this.readyPromise = null;
        this.closed = false;
    }

    async init() {
        if (this.readyPromise) return this.readyPromise;
        this.readyPromise = this.open().catch(error => {
            this.database = null;
            this.readyPromise = null;
            throw error;
        });
        return this.readyPromise;
    }

    async open() {
        if (this.closed) {
            throw new Error('Signature storage is closed.');
        }
        if (!window.indexedDB) {
            throw new Error('IndexedDB is not available.');
        }
        const database = new WebDB(DATABASE_NAME, STORE_NAME, DATABASE_VERSION);
        this.database = database;
        await database.init();
        if (this.closed) {
            database.db.close();
            throw new Error('Signature storage is closed.');
        }
        return database;
    }

    async getAll() {
        const database = await this.init();
        const records = await database.getAll();
        return records.sort((left, right) => Number(right.createdAt) - Number(left.createdAt));
    }

    async get(id) {
        const database = await this.init();
        return database.get(id);
    }

    async save(record) {
        const database = await this.init();
        await database.update(record);
        return record;
    }

    async delete(id) {
        const database = await this.init();
        await database.delete(id);
    }

    close() {
        this.closed = true;
        if (this.database && this.database.db) {
            this.database.db.close();
        }
        this.database = null;
        this.readyPromise = null;
    }
}
