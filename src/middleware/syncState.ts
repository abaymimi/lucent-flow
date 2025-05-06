import { StoreApi } from '../core/createStore';

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

interface SyncStateMethods<T> {
  sync: () => void;
  pause: () => void;
  resume: () => void;
  onConflict: (handler: (localState: T, remoteState: T) => T) => void;
  isSyncing: () => boolean;
  getLastSync: () => number;
}

export const syncState = <T extends object>(
  store: StoreApi<T>,
  config: SyncStateConfig
) => {
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

  // Handle storage events
  const handleStorageEvent = (e: StorageEvent) => {
    if (
      e.key !== channel ||
      e.storageArea !== window[storage] ||
      !e.newValue ||
      syncState.paused
    ) {
      return;
    }

    try {
      const remoteState = JSON.parse(e.newValue) as T;
      const localState = store.getState();

      if (conflictHandler) {
        const resolvedState = conflictHandler(localState, remoteState);
        store.setState(resolvedState);
      } else {
        // Default conflict resolution: use the most recent state
        const updatedState = { ...localState } as T;
        Object.keys(remoteState).forEach(key => {
          if (!blacklist.includes(key)) {
            updatedState[key as keyof T] = remoteState[key as keyof T];
          }
        });
        store.setState(updatedState);
      }

      syncState.lastSync = Date.now();
    } catch (error) {
      console.error('Error syncing state:', error);
    }
  };

  // Subscribe to storage events
  window.addEventListener('storage', handleStorageEvent);

  // Sync methods
  const sync = () => {
    if (syncState.paused) return;

    syncState.isSyncing = true;
    const state = store.getState();
    const filteredState = { ...state } as T;

    // Remove blacklisted properties
    blacklist.forEach((key) => {
      delete (filteredState as Record<string, unknown>)[key];
    });

    window[storage].setItem(channel, JSON.stringify(filteredState));
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

  // Add sync methods to store
  (store as StoreApi<T> & { syncState: SyncStateMethods<T> }).syncState = {
    sync,
    pause,
    resume,
    onConflict,
    isSyncing: () => syncState.isSyncing,
    getLastSync: () => syncState.lastSync,
  };

  return (set: StoreApi<T>['setState']) => {
    return (partial: T | ((state: T) => T)) => {
      const nextState = typeof partial === 'function' 
        ? (partial as (state: T) => T)(store.getState())
        : partial;

      set(nextState);

      // Debounce sync
      clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        sync();
      }, debounce);
    };
  };
}; 