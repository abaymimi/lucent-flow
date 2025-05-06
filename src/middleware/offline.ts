import { StoreApi } from '../core/createStore';

interface OfflineAction {
  type: string;
  payload: Record<string, unknown>;
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

interface OfflineState {
  queue: OfflineAction[];
  isOnline: boolean;
  isProcessing: boolean;
}

interface OfflineMethods {
  queueAction: (action: Omit<OfflineAction, 'timestamp' | 'retries'>) => void;
  processQueue: () => Promise<void>;
  setRetryStrategy: (strategy: RetryStrategy) => void;
  onError: (handler: (error: Error) => void) => void;
  isOnline: () => boolean;
  getQueue: () => OfflineAction[];
}

export const offline = <T extends object>(
  store: StoreApi<T>,
  config: OfflineConfig = {}
) => {
  const {
    storage = 'indexedDB',
    // syncInterval = 5000,
    retryStrategy = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
    },
  } = config;

  const offlineState: OfflineState = {
    queue: [],
    isOnline: navigator.onLine,
    isProcessing: false,
  };

//   let syncIntervalId: NodeJS.Timeout;
  let errorHandler: ((error: Error) => void) | null = null;

  // Initialize IndexedDB if needed
  const initIndexedDB = async () => {
    if (storage !== 'indexedDB') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('lucent-flow-offline', 1);

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
      const queue = localStorage.getItem('lucent-flow-queue');
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
      localStorage.setItem('lucent-flow-queue', JSON.stringify(offlineState.queue));
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
  const queueAction = (action: Omit<OfflineAction, 'timestamp' | 'retries'>) => {
    const queuedAction: OfflineAction = {
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
  const storeWithOffline = store as StoreApi<T> & { offline: OfflineMethods };
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

  // Start sync interval
//   const syncIntervalId = setInterval(processQueue, syncInterval);

  return (set: StoreApi<T>['setState']) => {
    return (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => {
      const nextState = typeof partial === 'function' 
        ? (partial as (state: T) => T | Partial<T>)(store.getState())
        : partial;

      set(nextState as T);

      if (!offlineState.isOnline) {
        queueAction({
          type: 'STATE_UPDATE',
          payload: nextState,
        });
      }
    };
  };
}; 