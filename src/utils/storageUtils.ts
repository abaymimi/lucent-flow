import { StoreApi } from 'zustand';
import { Draft } from 'immer';

// Storage backend types
export type StorageBackend = 'localStorage' | 'indexedDB';

// Storage configuration interface
export interface StorageConfig {
  backend: StorageBackend;
  version: string;
  encryptionKey?: string;
  migrateOnVersionChange?: boolean;
  maxSize?: number;
  prefix?: string;
}

// Storage migration interface
export interface StorageMigration {
  fromVersion: string;
  toVersion: string;
  migrate: (data: any) => any;
}

// Storage backend interface
interface StorageBackendInterface {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  keys: () => Promise<string[]>;
}

// LocalStorage backend implementation
class LocalStorageBackend implements StorageBackendInterface {
  private prefix: string;

  constructor(prefix: string = 'lucent_') {
    this.prefix = prefix;
  }

  private getPrefixedKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get(key: string): Promise<any> {
    const prefixedKey = this.getPrefixedKey(key);
    const value = localStorage.getItem(prefixedKey);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any): Promise<void> {
    const prefixedKey = this.getPrefixedKey(key);
    localStorage.setItem(prefixedKey, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    const prefixedKey = this.getPrefixedKey(key);
    localStorage.removeItem(prefixedKey);
  }

  async clear(): Promise<void> {
    const keys = await this.keys();
    for (const key of keys) {
      await this.remove(key);
    }
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keys.push(key.slice(this.prefix.length));
      }
    }
    return keys;
  }
}

// IndexedDB backend implementation
class IndexedDBBackend implements StorageBackendInterface {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;

  constructor(dbName: string = 'lucent_db', storeName: string = 'lucent_store') {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async get(key: string): Promise<any> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async set(key: string, value: any): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async remove(key: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async keys(): Promise<string[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }
}

// Encryption utilities
class EncryptionUtils {
  private key: CryptoKey | null = null;

  constructor(private encryptionKey: string) {}

  private async getKey(): Promise<CryptoKey> {
    if (this.key) return this.key;

    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(this.encryptionKey),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    this.key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('lucent-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return this.key;
  }

  async encrypt(data: any): Promise<string> {
    const key = await this.getKey();
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encoder.encode(JSON.stringify(data))
    );

    const encryptedArray = new Uint8Array(encrypted);
    const result = new Uint8Array(iv.length + encryptedArray.length);
    result.set(iv);
    result.set(encryptedArray, iv.length);

    return btoa(String.fromCharCode(...result));
  }

  async decrypt(encryptedData: string): Promise<any> {
    const key = await this.getKey();
    const encryptedArray = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = encryptedArray.slice(0, 12);
    const data = encryptedArray.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      data
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  }
}

// Storage versioning and migration
class StorageVersioning {
  private migrations: StorageMigration[] = [];

  constructor(private currentVersion: string) {}

  addMigration(migration: StorageMigration): void {
    this.migrations.push(migration);
  }

  async migrate(data: any, fromVersion: string): Promise<any> {
    if (fromVersion === this.currentVersion) return data;

    const applicableMigrations = this.migrations
      .filter(m => m.fromVersion === fromVersion)
      .sort((a, b) => a.toVersion.localeCompare(b.toVersion));

    let currentData = data;
    for (const migration of applicableMigrations) {
      currentData = await migration.migrate(currentData);
    }

    return currentData;
  }
}

// Main storage class
export class StorageManager {
  private backend: StorageBackendInterface;
  private encryption: EncryptionUtils | null = null;
  private versioning: StorageVersioning;

  constructor(private config: StorageConfig) {
    this.backend = config.backend === 'localStorage'
      ? new LocalStorageBackend(config.prefix)
      : new IndexedDBBackend();

    if (config.encryptionKey) {
      this.encryption = new EncryptionUtils(config.encryptionKey);
    }

    this.versioning = new StorageVersioning(config.version);
  }

  addMigration(migration: StorageMigration): void {
    this.versioning.addMigration(migration);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      let data = await this.backend.get(key);
      if (!data) return null;

      // Check version and migrate if needed
      if (this.config.migrateOnVersionChange && data.version !== this.config.version) {
        data = await this.versioning.migrate(data, data.version);
        await this.set(key, data);
      }

      // Decrypt if encrypted
      if (this.encryption && data.encrypted) {
        data = await this.encryption.decrypt(data.data);
      }

      return data as T;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  async set(key: string, value: any): Promise<void> {
    try {
      let data = {
        ...value,
        version: this.config.version,
        timestamp: Date.now(),
      };

      // Encrypt if encryption is enabled
      if (this.encryption) {
        data = {
          encrypted: true,
          data: await this.encryption.encrypt(data),
        };
      }

      await this.backend.set(key, data);
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await this.backend.remove(key);
    } catch (error) {
      console.error('Storage remove error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.backend.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  }

  async keys(): Promise<string[]> {
    try {
      return await this.backend.keys();
    } catch (error) {
      console.error('Storage keys error:', error);
      return [];
    }
  }
}

// Zustand middleware for storage persistence
export const withStorage = <T extends object>(
  store: StoreApi<T>,
  config: StorageConfig
) => {
  const storage = new StorageManager(config);

  // Load initial state from storage
  const loadState = async () => {
    try {
      const savedState = await storage.get<T>('state');
      if (savedState) {
        store.setState(savedState);
      }
    } catch (error) {
      console.error('Failed to load state from storage:', error);
    }
  };

  // Save state to storage on changes
  const saveState = async (state: T) => {
    try {
      await storage.set('state', state);
    } catch (error) {
      console.error('Failed to save state to storage:', error);
    }
  };

  // Load initial state
  loadState();

  // Subscribe to state changes
  const unsubscribe = store.subscribe(saveState);

  return {
    ...store,
    unsubscribe,
  };
}; 