/**
 * IndexedDB操作类 （简单功能）
 * Author: GT
 */
// const webDB = new (require('@libs/webDB').WebDB)();
// await webDB.open();
// let data = await webDB.get(2);
// console.log(data);
// webDB.insert({id:2, name: 'test', email: "aa", as: "sdsd"});
// webDB.update({id:6, bgImg: "two"});
// let a = await webDB.getAll();
// console.log(a);
// webDB.delete(4);
// console.log(data);
class WebDB {
    constructor(dbName = 'dbName', storeName = 'tableName', dbVersion = 1) {
        this.dbName = dbName;
        this.dbVersion = dbVersion;
        this.indexedDB = window.indexedDB;
        this.db = null;
        this.storeName = storeName;
        if (!this.indexedDB) {
            alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
        }
    }

    init() {
        return new Promise((resolve, reject) => {
            this.request = window.indexedDB.open(this.dbName, this.dbVersion);
            this.request.onerror = (e) => {
                alert("Database error: " + e.target.errorCode);
                reject(e.target.error);
            };

            this.request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(true);
            };

            this.request.onupgradeneeded = (e) => {
                this.db = e.target.result;
                if (!this.db.objectStoreNames.contains(this.storeName)) {
                    this.db.createObjectStore(this.storeName, {
                        keyPath: 'id'
                        // autoIncrement: true //当ObjectStore存储值不是对象时，可以设置autoIncrement直接存储字符串
                    });
                }
                
                // this.store.createIndex('indexName', 'indexName', {
                //     unique: false
                // });
            }
        });
    }

    get(id) {
        return new Promise((resolve, reject) => {
            try {
                const objectStore = this.db.transaction(this.storeName, 'readonly').objectStore(this.storeName);
                const request = objectStore.get(id);
                request.onsuccess = function(e) {
                    let data = e.target.result;
                    resolve(data);
                };
                request.onerror = function(e) {
                    reject(e.target.error);
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    getAll() {
        return new Promise((resolve, reject) => {
            try {
                const objectStore = this.db.transaction(this.storeName, 'readonly').objectStore(this.storeName);
                const request = objectStore.getAll();
                request.onsuccess = function(e) {
                    resolve(e.target.result);
                };
                request.onerror = function(e) {
                    reject(e.target.error);
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    insert(data) {
        return new Promise((resolve, reject) => {
            let transaction = this.db.transaction(this.storeName, 'readwrite');
            let objectStore = transaction.objectStore(this.storeName);
            let request = objectStore.add(data);
            transaction.oncomplete = function() {
                resolve(true);
            };
            transaction.onerror = function(e) {
                reject(e.target.error);
            };
            transaction.onabort = function(e) {
                reject(e.target.error);
            };
            request.onerror = function(e) {
                reject(e.target.error);
            };
        });
        
    }

    update(data) {
        return new Promise((resolve, reject) => {
            let transaction = this.db.transaction(this.storeName, 'readwrite');
            let objectStore = transaction.objectStore(this.storeName);
            let request = objectStore.put(data);
            transaction.oncomplete = function() {
                resolve(true);
            };
            transaction.onerror = function(e) {
                reject(e.target.error);
            };
            transaction.onabort = function(e) {
                reject(e.target.error);
            };
            request.onerror = function(e) {
                reject(e.target.error);
            };
        });
    }

    delete(id) {
        return new Promise((resolve, reject) => {
            let transaction = this.db.transaction(this.storeName, 'readwrite');
            let objectStore = transaction.objectStore(this.storeName);
            let request = objectStore.delete(id);
            transaction.oncomplete = function() {
                resolve(true);
            };
            transaction.onerror = function(e) {
                reject(e.target.error);
            };
            transaction.onabort = function(e) {
                reject(e.target.error);
            };
            request.onerror = function(e) {
                reject(e.target.error);
            };
        });
    }
}

export { WebDB };
