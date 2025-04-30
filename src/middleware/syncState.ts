import { StoreApi } from 'zustand';

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

  // Broadcast changes to other tabs
  const broadcast = (state: T) => {
    if (syncState.paused) return;

    const storageEvent = new StorageEvent('storage', {
      key: channel,
      newValue: JSON.stringify(state),
      oldValue: null,
      storageArea: window[storage],
    });

    // Dispatch the event
    window.dispatchEvent(storageEvent);
  };

  // Handle incoming changes from other tabs
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
        // Default conflict resolution: use the most recent state
        const localTimestamp = (localState as any).lastUpdated || 0;
        const remoteTimestamp = (remoteState as any).lastUpdated || 0;

        if (remoteTimestamp > localTimestamp) {
          store.setState(remoteState);
        }
      }

      syncState.lastSync = Date.now();
    } catch (error) {
      console.error('Error syncing state:', error);
    }
  };

  // Add event listener for storage events
  window.addEventListener('storage', handleStorageEvent);

  // Sync methods
  const sync = () => {
    if (syncState.paused) return;

    syncState.isSyncing = true;
    const state = store.getState();
    const filteredState = { ...state };

    // Remove blacklisted properties
    blacklist.forEach((key) => {
      delete (filteredState as any)[key];
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

  // Add sync methods to store
  (store as any).syncState = {
    sync,
    pause,
    resume,
    onConflict,
    isSyncing: () => syncState.isSyncing,
    getLastSync: () => syncState.lastSync,
  };

  return (set: StoreApi<T>['setState']) => {
    return (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => {
      const nextState = typeof partial === 'function' 
        ? (partial as (state: T) => T | Partial<T>)(store.getState())
        : partial;

      set(nextState, false);

      // Debounce sync
      clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        sync();
      }, debounce);
    };
  };
}; 