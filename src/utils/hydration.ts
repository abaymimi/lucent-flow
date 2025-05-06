import { StoreApi } from '../core/createStore';

interface HydrationConfig {
  storage?: 'localStorage' | 'indexedDB';
  key?: string;
  version?: number;
  migrate?: (oldState: unknown) => unknown;
  blacklist?: string[];
  whitelist?: string[];
}

interface HydrationState {
  isHydrated: boolean;
  version: number;
}

interface HydrationMethods<T> {
  saveState: (state: T) => Promise<void>;
  loadState: () => Promise<T | null>;
  clearState: () => Promise<void>;
  hydrate: () => Promise<void>;
  isHydrated: () => boolean;
}

export const createHydration = <T extends object>(
  store: StoreApi<T>,
  config: HydrationConfig = {}
) => {
  const {
    storage = 'localStorage',
    key = 'lucent-flow-state',
    version = 1,
    migrate,
    blacklist = [],
    whitelist = [],
  } = config;

  const hydrationState: HydrationState = {
    isHydrated: false,
    version,
  };

  // Initialize IndexedDB if needed
  const initIndexedDB = async () => {
    if (storage !== 'indexedDB') return;

    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('lucent-flow-hydration', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('state')) {
          db.createObjectStore('state');
        }
      };
    });
  };

  // Save state to storage
  const saveState = async (state: T) => {
    const stateToSave = { ...state };
    
    // Apply blacklist/whitelist filters
    if (blacklist.length > 0) {
      blacklist.forEach((key) => {
        delete (stateToSave as Record<string, unknown>)[key];
      });
    } else if (whitelist.length > 0) {
      Object.keys(stateToSave).forEach((key) => {
        if (!whitelist.includes(key)) {
          delete (stateToSave as Record<string, unknown>)[key];
        }
      });
    }

    if (storage === 'localStorage') {
      localStorage.setItem(key, JSON.stringify({
        state: stateToSave,
        version,
      }));
    } else {
      const db = await initIndexedDB();
      if (!db) return;
      const transaction = db.transaction('state', 'readwrite');
      const store = transaction.objectStore('state');
      store.put({
        state: stateToSave,
        version,
      }, key);
    }
  };

  // Load state from storage
  const loadState = async (): Promise<T | null> => {
    try {
      let savedState: { state: T; version: number } | null = null;

      if (storage === 'localStorage') {
        const stateStr = localStorage.getItem(key);
        if (stateStr) {
          savedState = JSON.parse(stateStr);
        }
      } else {
        const db = await initIndexedDB();
        if (!db) return null;
        const transaction = db.transaction('state', 'readonly');
        const store = transaction.objectStore('state');
        const request = store.get(key);

        savedState = await new Promise((resolve) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(null);
        });
      }

      if (!savedState) return null;

      // Handle version migration
      if (migrate && savedState.version !== version) {
        savedState.state = migrate(savedState.state) as T;
        savedState.version = version;
        await saveState(savedState.state);
      }

      return savedState.state;
    } catch (error) {
      console.error('Error loading state:', error);
      return null;
    }
  };

  // Clear saved state
  const clearState = async () => {
    if (storage === 'localStorage') {
      localStorage.removeItem(key);
    } else {
      const db = await initIndexedDB();
      if (!db) return;
      const transaction = db.transaction('state', 'readwrite');
      const store = transaction.objectStore('state');
      store.delete(key);
    }
  };

  // Hydrate store with saved state
  const hydrate = async () => {
    const savedState = await loadState();
    if (savedState) {
      store.setState(savedState);
    }
    hydrationState.isHydrated = true;
  };

  // Add hydration methods to store
  (store as StoreApi<T> & { hydration: HydrationMethods<T> }).hydration = {
    saveState,
    loadState,
    clearState,
    hydrate,
    isHydrated: () => hydrationState.isHydrated,
  };

  // Auto-save on state changes
  const unsubscribe = store.subscribe(() => {
    if (hydrationState.isHydrated) {
      saveState(store.getState());
    }
  });

  return {
    hydrate,
    unsubscribe,
  };
}; 