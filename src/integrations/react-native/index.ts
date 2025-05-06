import { createStore as create } from '../../core/createStore';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';

// Types
// interface StorageAdapter {
//   getItem: (key: string) => Promise<string | null>;
//   setItem: (key: string, value: string) => Promise<void>;
//   removeItem: (key: string) => Promise<void>;
// }

// interface ReactNativeConfig {
//   storage?: StorageAdapter;
//   retryStrategy?: {
//     maxRetries: number;
//     backoffFactor: number;
//     initialDelay: number;
//     maxDelay?: number;
//   };
//   batchStorage?: boolean;
//   batchSize?: number;
//   backgroundSync?: boolean;
//   syncInterval?: number;
//   storageOptions?: {
//     size?: number;
//     autoCleanup?: boolean;
//     cleanupInterval?: number;
//   };
// }

interface ReactNativeState {
  isOnline: boolean;
  appState: AppStateStatus;
  offline?: {
    processQueue: () => void;
  };
}

type StoreState<T> = T & ReactNativeState;

// Default storage adapter
// const defaultStorage: StorageAdapter = {
//   getItem: async (key: string) => {
//     try {
//       return await AsyncStorage.getItem(key);
//     } catch (error) {
//       console.error('Error reading from storage:', error);
//       return null;
//     }
//   },
//   setItem: async (key: string, value: string) => {
//     try {
//       await AsyncStorage.setItem(key, value);
//     } catch (error) {
//       console.error('Error writing to storage:', error);
//     }
//   },
//   removeItem: async (key: string) => {
//     try {
//       await AsyncStorage.removeItem(key);
//     } catch (error) {
//       console.error('Error removing from storage:', error);
//     }
//   },
// };

// Default retry strategy
// const defaultRetryStrategy = {
//   maxRetries: 3,
//   backoffFactor: 2,
//   initialDelay: 1000,
//   maxDelay: 30000,
// };

// Create React Native store factory
export const createReactNativeStore = <T extends object>(
  initialState: T,
//   config: ReactNativeConfig = {}
) => {
//   const {
//     storage = defaultStorage,
//     retryStrategy = defaultRetryStrategy,
//     batchStorage = true,
//     batchSize = 10,
//     backgroundSync = true,
//     syncInterval = 300000,
//     storageOptions = {
//       size: 10 * 1024 * 1024, // 10MB
//       autoCleanup: true,
//       cleanupInterval: 86400000, // 24 hours
//     },
//   } = config;

  // Create store with offline support
  const useStore = create<StoreState<T>>(() => ({
    ...initialState,
    // Add React Native specific state
    isOnline: true,
    appState: 'active' as AppStateStatus,
  }));

  // Handle network connectivity
  const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    useStore.setState((prev) => ({
      ...prev,
      isOnline: state.isConnected ?? false
    }));
    if (state.isConnected) {
      const storeState = useStore.getState();
      if (storeState.offline?.processQueue) {
        storeState.offline.processQueue();
      }
    }
  });

  // Handle app state changes
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    useStore.setState((prev) => ({
      ...prev,
      appState: nextAppState
    }));
    if (nextAppState === 'active') {
      const storeState = useStore.getState();
      if (storeState.offline?.processQueue) {
        storeState.offline.processQueue();
      }
    }
  };

  const appStateSubscription = AppState.addEventListener(
    'change',
    handleAppStateChange
  );

  // Cleanup function
  const cleanup = () => {
    unsubscribeNetInfo();
    appStateSubscription.remove();
  };

  return {
    useStore,
    cleanup,
  };
};

// Example usage:
/*
const { useStore, cleanup } = createReactNativeStore(
  {
    items: [],
    addItem: (item) => set((state) => ({
      items: [...state.items, item],
    })),
  },
  {
    retryStrategy: {
      maxRetries: 5,
      backoffFactor: 1.5,
      initialDelay: 1000,
    },
    batchStorage: true,
    batchSize: 10,
  }
);

// In your component:
const MyComponent = () => {
  const items = useStore((state) => state.items);
  const isOnline = useStore((state) => state.isOnline);
  
  useEffect(() => {
    return () => cleanup();
  }, []);
  
  return (
    // Your component JSX
  );
};
*/ 