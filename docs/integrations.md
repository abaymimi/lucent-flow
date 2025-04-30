# Integration Features

## React Native Integration

### Basic Setup

```typescript
import { create } from "zustand";
import { createHydration } from "lucent-flow/utils/hydration";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Custom storage adapter for React Native
const storage = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error("Error reading from storage:", error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error("Error writing to storage:", error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error("Error removing from storage:", error);
    }
  },
};

// Create store with React Native storage
const useStore = create(
  withOffline(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
        })),
    }),
    {
      storage: storage,
      retryStrategy: {
        maxRetries: 3,
        backoffFactor: 2,
      },
    }
  )
);
```

### Performance Optimizations

```typescript
// Optimize for React Native
const useStore = create(
  withOffline(
    (set) => ({
      // ... store implementation
    }),
    {
      // Batch storage operations
      batchStorage: true,
      batchSize: 10,

      // Optimize for mobile networks
      retryStrategy: {
        maxRetries: 5,
        backoffFactor: 1.5,
        initialDelay: 1000,
        maxDelay: 30000, // 30 seconds
      },

      // Handle app state changes
      onAppStateChange: (nextAppState) => {
        if (nextAppState === "active") {
          // Process queued actions when app becomes active
          store.offline.processQueue();
        }
      },
    }
  )
);
```

### Offline Support

```typescript
// Handle offline scenarios in React Native
const useStore = create(
  withOffline(
    (set) => ({
      // ... store implementation
    }),
    {
      // Check network status
      checkConnection: async () => {
        const netInfo = await NetInfo.fetch();
        return netInfo.isConnected;
      },

      // Handle background sync
      backgroundSync: true,
      syncInterval: 300000, // 5 minutes

      // Optimize storage for mobile
      storageOptions: {
        size: 10 * 1024 * 1024, // 10MB limit
        autoCleanup: true,
        cleanupInterval: 86400000, // 24 hours
      },
    }
  )
);
```

## Server-Side Rendering (SSR) Support

### Basic Setup

```typescript
// Create a store factory for SSR
const createStore = (initialState = {}) => {
  return create(
    withOffline(
      (set) => ({
        items: initialState.items || [],
        addItem: (item) =>
          set((state) => ({
            items: [...state.items, item],
          })),
      }),
      {
        // Disable storage during SSR
        storage: typeof window === "undefined" ? null : "localStorage",

        // Handle SSR-specific options
        ssr: {
          serialize: (state) => JSON.stringify(state),
          deserialize: (state) => JSON.parse(state),
        },
      }
    )
  );
};

// Usage in Next.js getServerSideProps
export const getServerSideProps = async () => {
  const store = createStore();

  // Fetch initial data
  await store.getState().fetchItems();

  return {
    props: {
      initialState: store.getState(),
    },
  };
};
```

### Hydration Handling

```typescript
// Handle client-side hydration
const useStore = createStore();

const App = ({ initialState }) => {
  // Hydrate store with server state
  useEffect(() => {
    if (initialState) {
      useStore.setState(initialState);
    }
  }, [initialState]);

  return (
    // ... app implementation
  );
};
```

## Next.js Integration

### App Router Setup

```typescript
// app/providers.tsx
"use client";

import { create } from "zustand";
import { createHydration } from "lucent-flow/utils/hydration";

const useStore = create((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item],
    })),
}));

export const StoreProvider = ({ children, initialState }) => {
  const { hydrate } = createHydration(useStore, {
    storage: "localStorage",
    version: 1,
  });

  useEffect(() => {
    if (initialState) {
      hydrate(initialState);
    }
  }, [initialState]);

  return children;
};
```

### Page Router Setup

```typescript
// pages/_app.tsx
import { StoreProvider } from "../providers";

function MyApp({ Component, pageProps }) {
  return (
    <StoreProvider initialState={pageProps.initialState}>
      <Component {...pageProps} />
    </StoreProvider>
  );
}
```

### Data Fetching

```typescript
// pages/index.tsx
export const getServerSideProps = async () => {
  const store = createStore();

  // Fetch data on server
  await store.getState().fetchItems();

  return {
    props: {
      initialState: store.getState(),
    },
  };
};
```

## React Suspense Integration

### Basic Setup

```typescript
// Create a suspense-ready store
const useStore = create((set) => ({
  items: [],
  loading: false,
  error: null,
  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch("/api/items");
      const items = await response.json();
      set({ items, loading: false });
    } catch (error) {
      set({ error, loading: false });
    }
  },
}));

// Create a suspense boundary
const ItemsList = () => {
  const items = useStore((state) => state.items);
  const fetchItems = useStore((state) => state.fetchItems);

  // Trigger suspense
  if (!items.length) {
    throw fetchItems();
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
};

// Usage with Suspense
const App = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ItemsList />
    </Suspense>
  );
};
```

### Error Boundaries

```typescript
// Error boundary component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

// Usage with store
const App = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <ItemsList />
      </Suspense>
    </ErrorBoundary>
  );
};
```

### Concurrent Features

```typescript
// Use concurrent features with store
const useStore = create((set) => ({
  items: [],
  loading: false,
  fetchItems: async () => {
    // Use startTransition for non-urgent updates
    startTransition(() => {
      set({ loading: true });
    });

    try {
      const response = await fetch("/api/items");
      const items = await response.json();

      // Use startTransition for state updates
      startTransition(() => {
        set({ items, loading: false });
      });
    } catch (error) {
      startTransition(() => {
        set({ error, loading: false });
      });
    }
  },
}));
```

## Best Practices

1. **React Native**

   - Use AsyncStorage for persistence
   - Implement proper error handling
   - Optimize for mobile networks
   - Handle app state changes
   - Monitor storage usage

2. **SSR**

   - Disable storage during SSR
   - Handle hydration properly
   - Serialize/deserialize state
   - Manage initial state
   - Handle rehydration

3. **Next.js**

   - Use proper provider setup
   - Handle client/server state
   - Implement proper data fetching
   - Manage page transitions
   - Handle route changes

4. **Suspense**
   - Implement proper error boundaries
   - Handle loading states
   - Use concurrent features
   - Manage resource cleanup
   - Handle edge cases

## Troubleshooting

1. **React Native Issues**

   - Storage quota exceeded
   - Network connectivity
   - Background sync
   - App state management
   - Performance issues

2. **SSR Issues**

   - Hydration mismatches
   - State serialization
   - Initial state loading
   - Client/server differences
   - Memory leaks

3. **Next.js Issues**

   - Route transitions
   - State persistence
   - Data fetching
   - Provider setup
   - Performance optimization

4. **Suspense Issues**
   - Loading states
   - Error handling
   - Resource cleanup
   - Concurrent updates
   - Memory management
