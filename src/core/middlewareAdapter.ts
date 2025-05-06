import { StoreApi } from './createStore';

export type Middleware<T> = (
  store: StoreApi<T>
) => (next: StoreApi<T>['setState']) => StoreApi<T>['setState'];

export function createMiddleware<T extends object>(
  middleware: (store: StoreApi<T>) => (next: StoreApi<T>['setState']) => StoreApi<T>['setState']
): Middleware<T> {
  return middleware;
}

// Storage engine interface
interface StorageEngine {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
}

// Type for Redux DevTools Extension
interface ReduxDevTools {
    connect(options: { name: string, trace?: boolean }): {
      init(state: unknown): void;
      send(action: string, state: unknown): void;
    };
  }
  

// Persist middleware
export const persistMiddleware = <T extends object>(
  store: StoreApi<T>,
  options: { key: string; storage: StorageEngine }
): (next: StoreApi<T>['setState']) => StoreApi<T>['setState'] => {
  const { key, storage } = options;

  // Load initial state from storage
  const loadState = async () => {
    try {
      const savedState = await storage.getItem(key);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        store.setState(parsedState);
      }
    } catch (err) {
      console.error('[PersistMiddleware] Load failed:', err);
    }
  };

  // Load initial state
  loadState();

  return (next) => async (partial) => {
    const nextState = typeof partial === 'function' ? partial(store.getState()) : partial;
    next(nextState);

    try {
      const serialized = JSON.stringify(nextState);
      await storage.setItem(key, serialized);
    } catch (err) {
      console.error('[PersistMiddleware] Save failed:', err);
    }
  };
};

// Offline middleware
interface OfflineAction<T> {
  type: string;
  payload: Partial<T>;
  timestamp: number;
  retries: number;
}

interface RetryStrategy {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
}

interface OfflineConfig {
  storage?: 'localStorage' | 'indexedDB';
  syncInterval?: number;
  retryStrategy?: RetryStrategy;
}

interface OfflineState<T> {
  queue: OfflineAction<T>[];
  isOnline: boolean;
  isProcessing: boolean;
}

interface OfflineMethods<T> {
  queueAction: (action: Omit<OfflineAction<T>, 'timestamp' | 'retries'>) => void;
  processQueue: () => Promise<void>;
  setRetryStrategy: (strategy: RetryStrategy) => void;
  onError: (handler: (error: Error) => void) => void;
  isOnline: () => boolean;
  getQueue: () => OfflineAction<T>[];
}

export const offlineMiddleware = <T extends object>(
  store: StoreApi<T>,
  config: OfflineConfig = {}
): (next: StoreApi<T>['setState']) => StoreApi<T>['setState'] => {
  const {
    storage = 'indexedDB',
    retryStrategy = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
    },
  } = config;

  const offlineState: OfflineState<T> = {
    queue: [],
    isOnline: navigator.onLine,
    isProcessing: false,
  };

  let errorHandler: ((error: Error) => void) | null = null;

  // Initialize IndexedDB if needed
  const initIndexedDB = async () => {
    if (storage !== 'indexedDB') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('lucent-offline', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('queue')) {
          db.createObjectStore('queue', { keyPath: 'timestamp' });
        }
      };
    });
  };

  // Load queue from storage
  const loadQueue = async () => {
    if (storage === 'localStorage') {
      const queue = localStorage.getItem('lucent-queue');
      if (queue) {
        offlineState.queue = JSON.parse(queue);
      }
    } else {
      const db = await initIndexedDB();
      const transaction = (db as IDBDatabase).transaction('queue', 'readonly');
      const store = transaction.objectStore('queue');
      const request = store.getAll();

      request.onsuccess = () => {
        offlineState.queue = request.result;
      };
    }
  };

  // Save queue to storage
  const saveQueue = async () => {
    if (storage === 'localStorage') {
      localStorage.setItem('lucent-queue', JSON.stringify(offlineState.queue));
    } else {
      const db = await initIndexedDB();
      const transaction = (db as IDBDatabase).transaction('queue', 'readwrite');
      const store = transaction.objectStore('queue');

      offlineState.queue.forEach((action) => {
        store.put(action);
      });
    }
  };

  // Process queue
  const processQueue = async () => {
    if (offlineState.isProcessing || !offlineState.isOnline) return;

    offlineState.isProcessing = true;

    while (offlineState.queue.length > 0) {
      const action = offlineState.queue[0];

      try {
        // Execute action
        store.setState((state) => ({
          ...state,
          ...action.payload,
        }));

        // Remove processed action
        offlineState.queue.shift();
        await saveQueue();
      } catch (error) {
        if (action.retries < retryStrategy.maxRetries) {
          // Calculate delay with exponential backoff
          const delay = Math.min(
            retryStrategy.initialDelay * Math.pow(2, action.retries),
            retryStrategy.maxDelay
          );

          // Update retry count and timestamp
          action.retries++;
          action.timestamp = Date.now() + delay;

          // Re-queue the action
          offlineState.queue.push(action);
          offlineState.queue.shift();
          await saveQueue();

          if (errorHandler) {
            errorHandler(error as Error);
          }
        } else {
          // Max retries reached, remove the action
          offlineState.queue.shift();
          await saveQueue();
        }
      }
    }

    offlineState.isProcessing = false;
  };

  // Queue an action
  const queueAction = (action: Omit<OfflineAction<T>, 'timestamp' | 'retries'>) => {
    const queuedAction: OfflineAction<T> = {
      ...action,
      timestamp: Date.now(),
      retries: 0,
    };

    offlineState.queue.push(queuedAction);
    saveQueue();

    if (offlineState.isOnline) {
      processQueue();
    }
  };

  // Set retry strategy
  const setRetryStrategy = (strategy: RetryStrategy) => {
    Object.assign(retryStrategy, strategy);
  };

  // Handle online/offline events
  const handleOnline = () => {
    offlineState.isOnline = true;
    processQueue();
  };

  const handleOffline = () => {
    offlineState.isOnline = false;
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Add offline methods to store
  const storeWithOffline = store as StoreApi<T> & { offline: OfflineMethods<T> };
  storeWithOffline.offline = {
    queueAction,
    processQueue,
    setRetryStrategy,
    onError: (handler: (error: Error) => void) => {
      errorHandler = handler;
    },
    isOnline: () => offlineState.isOnline,
    getQueue: () => [...offlineState.queue],
  };

  // Initialize
  loadQueue();
  if (offlineState.isOnline) {
    processQueue();
  }

  return (next) => (partial) => {
    const nextState = typeof partial === 'function' ? partial(store.getState()) : partial;
    
    if (!offlineState.isOnline) {
      queueAction({
        type: 'STATE_UPDATE',
        payload: nextState as Partial<T>,
      });
    } else {
      next(nextState);
    }
  };
};

// DevTools middleware
export const devtoolsMiddleware = <T extends object>(
  store: StoreApi<T>,
  options: { name?: string; enabled?: boolean } = {}
): (next: StoreApi<T>['setState']) => StoreApi<T>['setState'] => {
  const { name = 'Store', enabled = true } = options;

  if (!enabled) {
    return (next) => next;
  }

  const devTools = (window as unknown as { __REDUX_DEVTOOLS_EXTENSION__?: ReduxDevTools }).__REDUX_DEVTOOLS_EXTENSION__?.connect({
    name,
  });

  if (!devTools) {
    console.warn('Redux DevTools not found');
    return (next) => next;
  }

  devTools.init(store.getState());

  return (next) => (partial) => {
    const nextState = typeof partial === 'function' ? partial(store.getState()) : partial;
    next(nextState);
    devTools.send('State Update', nextState);
  };
};

// Logger middleware
export const loggerMiddleware = <T extends object>(
  store: StoreApi<T>
): (next: StoreApi<T>['setState']) => StoreApi<T>['setState'] => {
  return (next) => (partial) => {
    const prevState = store.getState();
    const nextState = typeof partial === 'function' ? partial(prevState) : partial;
    
    console.group('State Update');
    console.log('Previous State:', prevState);
    console.log('Action:', partial);
    console.log('Next State:', nextState);
    console.groupEnd();

    next(nextState);
  };
};

// Undo/Redo middleware
export const undoRedoMiddleware = <T extends object>(
  store: StoreApi<T>,
  options: { maxHistory?: number } = {}
): (next: StoreApi<T>['setState']) => StoreApi<T>['setState'] => {
  const { maxHistory = 100 } = options;
  const history: T[] = [store.getState()];
  let currentIndex = 0;

  return (next) => (partial) => {
    const nextState = typeof partial === 'function' ? partial(store.getState()) : partial;
    
    // Add new state to history
    history.splice(currentIndex + 1);
    history.push(nextState);
    currentIndex = history.length - 1;

    // Trim history if it exceeds maxHistory
    if (history.length > maxHistory) {
      history.shift();
      currentIndex--;
    }

    next(nextState);
  };
};

// Time Travel middleware
interface TimeTravelState<T> {
  past: T[];
  present: T;
  future: T[];
  currentIndex: number;
  actions: string[];
}

interface TimeTravelConfig {
  maxHistory?: number;
  enableDevTools?: boolean;
  recordActions?: boolean;
}

interface TimeTravelMethods<T> {
  back: () => void;
  forward: () => void;
  jumpTo: (index: number) => void;
  replayFrom: (index: number) => void;
  clearHistory: () => void;
  getCurrentIndex: () => number;
  getHistory: () => {
    past: T[];
    present: T;
    future: T[];
    actions: string[];
  };
}

export const timeTravelMiddleware = <T extends object>(
  store: StoreApi<T>,
  config: TimeTravelConfig = {}
): (next: StoreApi<T>['setState']) => StoreApi<T>['setState'] => {
  const { maxHistory = 50, enableDevTools = true, recordActions = true } = config;

  const timeTravelState: TimeTravelState<T> = {
    past: [],
    present: store.getState(),
    future: [],
    currentIndex: 0,
    actions: [],
  };

  const devTools = enableDevTools
    ?  (window as unknown as { __REDUX_DEVTOOLS_EXTENSION__?: ReduxDevTools }).__REDUX_DEVTOOLS_EXTENSION__?.connect({
        name: 'Lucent Time Travel',
        trace: false,
      })
    : null;

  if (devTools) {
    devTools.init(timeTravelState.present);
  }

  const back = () => {
    if (timeTravelState.past.length === 0) return;

    const previous = timeTravelState.past[timeTravelState.past.length - 1];
    const newPast = timeTravelState.past.slice(0, -1);

    timeTravelState.past = newPast;
    timeTravelState.future = [timeTravelState.present, ...timeTravelState.future];
    timeTravelState.present = previous;
    timeTravelState.currentIndex--;

    store.setState(previous);
    if (devTools) {
      devTools.send('BACK', timeTravelState.present);
    }
  };

  const forward = () => {
    if (timeTravelState.future.length === 0) return;

    const next = timeTravelState.future[0];
    const newFuture = timeTravelState.future.slice(1);

    timeTravelState.past = [...timeTravelState.past, timeTravelState.present];
    timeTravelState.future = newFuture;
    timeTravelState.present = next;
    timeTravelState.currentIndex++;

    store.setState(next);
    if (devTools) {
      devTools.send('FORWARD', timeTravelState.present);
    }
  };

  const jumpTo = (index: number) => {
    if (index < 0 || index >= timeTravelState.past.length + timeTravelState.future.length + 1) {
      return;
    }

    const targetIndex = index;
    const currentIndex = timeTravelState.currentIndex;

    if (targetIndex === currentIndex) return;

    if (targetIndex < currentIndex) {
      const steps = currentIndex - targetIndex;
      for (let i = 0; i < steps; i++) {
        back();
      }
    } else {
      const steps = targetIndex - currentIndex;
      for (let i = 0; i < steps; i++) {
        forward();
      }
    }
  };

  const replayFrom = (index: number) => {
    if (index < 0 || index >= timeTravelState.actions.length) return;
    jumpTo(index);
    timeTravelState.actions.slice(index).forEach((action) => {
      console.log('Replaying action:', action);
    });
  };

  const clearHistory = () => {
    timeTravelState.past = [];
    timeTravelState.future = [];
    timeTravelState.actions = [];
    timeTravelState.currentIndex = 0;
  };

  const storeWithTimeTravel = store as StoreApi<T> & { timeTravel: TimeTravelMethods<T> };
  storeWithTimeTravel.timeTravel = {
    back,
    forward,
    jumpTo,
    replayFrom,
    clearHistory,
    getCurrentIndex: () => timeTravelState.currentIndex,
    getHistory: () => ({
      past: timeTravelState.past,
      present: timeTravelState.present,
      future: timeTravelState.future,
      actions: timeTravelState.actions,
    }),
  };

  return (next) => (partial) => {
    const nextState = typeof partial === 'function' ? partial(store.getState()) : partial;

    timeTravelState.past = [...timeTravelState.past, timeTravelState.present].slice(-maxHistory);
    timeTravelState.present = nextState as T;
    timeTravelState.future = [];
    timeTravelState.currentIndex = timeTravelState.past.length;

    if (recordActions && typeof partial === 'function') {
      timeTravelState.actions = [...timeTravelState.actions, 'STATE_UPDATE'].slice(-maxHistory);
    }

    next(nextState);

    if (devTools) {
      devTools.send('STATE_UPDATE', timeTravelState.present);
    }
  };
};

// Sync State middleware
interface SyncStateConfig {
  channel: string;
  storage?: 'localStorage' | 'sessionStorage';
  debounce?: number;
  blacklist?: string[];
}

interface SyncState {
  isSyncing: boolean;
  lastSync: number;
  paused: boolean;
}

interface TimestampedState {
  lastUpdated?: number;
  [key: string]: unknown;
}

interface SyncStateMethods<T> {
  sync: () => void;
  pause: () => void;
  resume: () => void;
  onConflict: (handler: (localState: T, remoteState: T) => T) => void;
  isSyncing: () => boolean;
  getLastSync: () => number;
}

export const syncStateMiddleware = <T extends object>(
  store: StoreApi<T>,
  config: SyncStateConfig
): (next: StoreApi<T>['setState']) => StoreApi<T>['setState'] => {
  const {
    channel,
    storage = 'localStorage',
    debounce = 100,
    blacklist = [],
  } = config;

  const syncState: SyncState = {
    isSyncing: false,
    lastSync: Date.now(),
    paused: false,
  };

  let syncTimeout: NodeJS.Timeout;
  let conflictHandler: ((localState: T, remoteState: T) => T) | null = null;

  const broadcast = (state: T) => {
    if (syncState.paused) return;

    const storageEvent = new StorageEvent('storage', {
      key: channel,
      newValue: JSON.stringify(state),
      oldValue: null,
      storageArea: window[storage],
    });

    window.dispatchEvent(storageEvent);
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (
      event.key !== channel ||
      event.storageArea !== window[storage] ||
      !event.newValue
    ) {
      return;
    }

    try {
      const remoteState = JSON.parse(event.newValue) as T;
      const localState = store.getState();

      if (conflictHandler) {
        const resolvedState = conflictHandler(localState, remoteState);
        store.setState(resolvedState);
      } else {
        const localTimestamp = (localState as TimestampedState).lastUpdated || 0;
        const remoteTimestamp = (remoteState as TimestampedState).lastUpdated || 0;

        if (remoteTimestamp > localTimestamp) {
          store.setState(remoteState);
        }
      }

      syncState.lastSync = Date.now();
    } catch (error) {
      console.error('Error syncing state:', error);
    }
  };

  window.addEventListener('storage', handleStorageEvent);

  const sync = () => {
    if (syncState.paused) return;

    syncState.isSyncing = true;
    const state = store.getState();
    const filteredState = { ...state };

    blacklist.forEach((key) => {
      delete (filteredState as Record<string, unknown>)[key];
    });

    broadcast(filteredState);
    syncState.isSyncing = false;
    syncState.lastSync = Date.now();
  };

  const pause = () => {
    syncState.paused = true;
  };

  const resume = () => {
    syncState.paused = false;
  };

  const onConflict = (handler: (localState: T, remoteState: T) => T) => {
    conflictHandler = handler;
  };

  const storeWithSync = store as StoreApi<T> & { syncState: SyncStateMethods<T> };
  storeWithSync.syncState = {
    sync,
    pause,
    resume,
    onConflict,
    isSyncing: () => syncState.isSyncing,
    getLastSync: () => syncState.lastSync,
  };

  return (next) => (partial) => {
    const nextState = typeof partial === 'function' ? partial(store.getState()) : partial;

    next(nextState);

    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      sync();
    }, debounce);
  };
};

export type MiddlewareAdapter<T> = (
  set: (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void,
  get: () => T,
  api: StoreApi<T>
) => (partial: T | Partial<T> | ((state: T) => T | Partial<T>), ...args: unknown[]) => void;

export function createMiddlewareAdapter<T>(
  middleware: MiddlewareAdapter<T>,
  options?: { onError?: (error: unknown) => void }
): MiddlewareAdapter<T> {
  return (set, get, api) => {
    const next = middleware(set, get, api);
    return (partial, ...args) => {
      try {
        next(partial, ...args);
      } catch (error) {
        options?.onError?.(error);
      }
    };
  };
} 