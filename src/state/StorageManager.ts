/**
 * 存储管理器
 * 使用IndexedDB存储游戏数据
 */
export class StorageManager {
    private static instance: StorageManager;
    private db: IDBDatabase | null = null;
    private dbName: string = 'break-tower-db';
    private storeName: string = 'game-state';
    private version: number = 1;
    private isInitialized: boolean = false;
    private initPromise: Promise<boolean> | null = null;

    /**
     * 获取单例实例
     */
    public static getInstance(): StorageManager {
        if (!StorageManager.instance) {
            StorageManager.instance = new StorageManager();
        }
        return StorageManager.instance;
    }

    /**
     * 私有构造函数
     */
    private constructor() {
        console.log('StorageManager: 初始化');
    }

    /**
     * 初始化数据库
     * @returns 是否成功初始化
     */
    public async initialize(): Promise<boolean> {
        if (this.isInitialized) {
            return true;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise<boolean>((resolve) => {
            try {
                const request = indexedDB.open(this.dbName, this.version);

                request.onupgradeneeded = (event) => {
                    console.log('StorageManager: 数据库升级');
                    const db = (event.target as IDBOpenDBRequest).result;
                    
                    // 如果存储对象已存在，删除它
                    if (db.objectStoreNames.contains(this.storeName)) {
                        db.deleteObjectStore(this.storeName);
                    }
                    
                    // 创建存储对象
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                };

                request.onsuccess = (event) => {
                    console.log('StorageManager: 数据库打开成功');
                    this.db = (event.target as IDBOpenDBRequest).result;
                    this.isInitialized = true;
                    resolve(true);
                };

                request.onerror = (event) => {
                    console.error('StorageManager: 数据库打开失败', event);
                    resolve(false);
                };
            } catch (error) {
                console.error('StorageManager: 初始化失败', error);
                resolve(false);
            }
        });

        return this.initPromise;
    }

    /**
     * 保存数据
     * @param key 键
     * @param data 数据
     * @returns 是否成功保存
     */
    public async save(key: string, data: any): Promise<boolean> {
        if (!await this.initialize()) {
            return false;
        }

        return new Promise<boolean>((resolve) => {
            try {
                if (!this.db) {
                    console.error('StorageManager: 数据库未初始化');
                    resolve(false);
                    return;
                }

                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);

                // 准备要保存的数据对象
                const saveData = {
                    id: key,
                    data: data,
                    timestamp: Date.now()
                };

                const request = store.put(saveData);

                request.onsuccess = () => {
                    console.log(`StorageManager: 保存数据成功 (${key})`);
                    resolve(true);
                };

                request.onerror = (event) => {
                    console.error(`StorageManager: 保存数据失败 (${key})`, event);
                    resolve(false);
                };
            } catch (error) {
                console.error(`StorageManager: 保存数据时发生错误 (${key})`, error);
                resolve(false);
            }
        });
    }

    /**
     * 加载数据
     * @param key 键
     * @returns 加载的数据，如果失败则返回null
     */
    public async load(key: string): Promise<any> {
        if (!await this.initialize()) {
            return null;
        }

        return new Promise<any>((resolve) => {
            try {
                if (!this.db) {
                    console.error('StorageManager: 数据库未初始化');
                    resolve(null);
                    return;
                }

                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(key);

                request.onsuccess = (event) => {
                    const result = (event.target as IDBRequest).result;
                    if (result) {
                        console.log(`StorageManager: 加载数据成功 (${key})`);
                        resolve(result.data);
                    } else {
                        console.log(`StorageManager: 未找到数据 (${key})`);
                        resolve(null);
                    }
                };

                request.onerror = (event) => {
                    console.error(`StorageManager: 加载数据失败 (${key})`, event);
                    resolve(null);
                };
            } catch (error) {
                console.error(`StorageManager: 加载数据时发生错误 (${key})`, error);
                resolve(null);
            }
        });
    }

    /**
     * 删除数据
     * @param key 键
     * @returns 是否成功删除
     */
    public async delete(key: string): Promise<boolean> {
        if (!await this.initialize()) {
            return false;
        }

        return new Promise<boolean>((resolve) => {
            try {
                if (!this.db) {
                    console.error('StorageManager: 数据库未初始化');
                    resolve(false);
                    return;
                }

                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(key);

                request.onsuccess = () => {
                    console.log(`StorageManager: 删除数据成功 (${key})`);
                    resolve(true);
                };

                request.onerror = (event) => {
                    console.error(`StorageManager: 删除数据失败 (${key})`, event);
                    resolve(false);
                };
            } catch (error) {
                console.error(`StorageManager: 删除数据时发生错误 (${key})`, error);
                resolve(false);
            }
        });
    }

    /**
     * 检查数据是否存在
     * @param key 键
     * @returns 数据是否存在
     */
    public async exists(key: string): Promise<boolean> {
        if (!await this.initialize()) {
            return false;
        }

        return new Promise<boolean>((resolve) => {
            try {
                if (!this.db) {
                    console.error('StorageManager: 数据库未初始化');
                    resolve(false);
                    return;
                }

                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.count(key);

                request.onsuccess = (event) => {
                    const count = (event.target as IDBRequest).result;
                    resolve(count > 0);
                };

                request.onerror = (event) => {
                    console.error(`StorageManager: 检查数据是否存在失败 (${key})`, event);
                    resolve(false);
                };
            } catch (error) {
                console.error(`StorageManager: 检查数据是否存在时发生错误 (${key})`, error);
                resolve(false);
            }
        });
    }

    /**
     * 清空所有数据
     * @returns 是否成功清空
     */
    public async clear(): Promise<boolean> {
        if (!await this.initialize()) {
            return false;
        }

        return new Promise<boolean>((resolve) => {
            try {
                if (!this.db) {
                    console.error('StorageManager: 数据库未初始化');
                    resolve(false);
                    return;
                }

                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.clear();

                request.onsuccess = () => {
                    console.log('StorageManager: 清空数据成功');
                    resolve(true);
                };

                request.onerror = (event) => {
                    console.error('StorageManager: 清空数据失败', event);
                    resolve(false);
                };
            } catch (error) {
                console.error('StorageManager: 清空数据时发生错误', error);
                resolve(false);
            }
        });
    }

    /**
     * 关闭数据库
     */
    public close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
            this.initPromise = null;
            console.log('StorageManager: 数据库已关闭');
        }
    }
}