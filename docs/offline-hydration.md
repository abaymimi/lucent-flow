# Offline Support & State Hydration

## Quick Reference Guide

### Offline Support

```typescript
// Basic setup
const useStore = create(withOffline((set) => ({ ... })));

// Configuration
const useStore = create(withOffline((set) => ({ ... }), {
  storage: 'indexedDB',
  retryStrategy: { maxRetries: 3, backoffFactor: 2 },
}));

// Queue management
store.offline.queueAction({ type: 'ACTION', payload: data });
store.offline.processQueue();
store.offline.getQueue();
```

### State Hydration

```typescript
// Basic setup
const { hydrate } = createHydration(store, {
  storage: 'indexedDB',
  version: 1,
});

// Version migration
const { hydrate } = createHydration(store, {
  version: 2,
  migrate: (oldState) => ({ ... }),
});

// State management
store.hydration.saveState(state);
store.hydration.loadState();
store.hydration.clearState();
```

## Advanced Examples

### 1. Complex Offline Queue Management

```typescript
// Custom queue processor
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
      onQueue: (action) => {
        // Show notification to user
        showNotification(`Action queued: ${action.type}`);
      },
      onProcess: (action) => {
        // Update UI to show processing
        updateProcessingStatus(action.type);
      },
      onError: (error) => {
        // Handle specific error types
        if (error instanceof NetworkError) {
          retryWithBackoff();
        } else {
          showError(error.message);
        }
      },
    }
  )
);

// Custom retry strategy with exponential backoff
const customRetryStrategy = {
  maxRetries: 5,
  backoffFactor: 2,
  initialDelay: 1000,
  shouldRetry: (error: Error) => {
    if (error instanceof NetworkError) return true;
    if (error instanceof ValidationError) return false;
    return error.message !== "Fatal error";
  },
  onRetry: (attempt: number, delay: number) => {
    console.log(`Retry attempt ${attempt} in ${delay}ms`);
  },
};
```

### 2. Advanced State Hydration

```typescript
// Complex state migration
const { hydrate } = createHydration(store, {
  version: 3,
  migrate: (oldState) => {
    // Handle multiple version migrations
    let migratedState = oldState;

    // Version 1 to 2
    if (oldState.version === 1) {
      migratedState = {
        ...migratedState,
        items: migratedState.items.map((item) => ({
          ...item,
          createdAt: new Date().toISOString(),
        })),
        version: 2,
      };
    }

    // Version 2 to 3
    if (migratedState.version === 2) {
      migratedState = {
        ...migratedState,
        items: migratedState.items.map((item) => ({
          ...item,
          metadata: {
            lastModified: item.createdAt,
            createdBy: "system",
          },
        })),
        version: 3,
      };
    }

    return migratedState;
  },
});

// Selective state persistence
const { hydrate } = createHydration(store, {
  whitelist: ["items", "settings"],
  blacklist: ["temporaryData", "sensitiveInfo"],
  transform: (state) => ({
    ...state,
    items: state.items.map((item) => ({
      ...item,
      // Remove sensitive data
      password: undefined,
      // Add metadata
      lastAccessed: new Date().toISOString(),
    })),
  }),
});
```

## Performance Optimization

### 1. Storage Optimization

```typescript
// Compress large states
const { hydrate } = createHydration(store, {
  compress: true,
  compressionOptions: {
    level: 6, // Balance between speed and compression ratio
  },
});

// Debounce frequent saves
const { hydrate } = createHydration(store, {
  debounce: 1000, // Save at most once per second
});

// Selective updates
const { hydrate } = createHydration(store, {
  shouldSave: (state, prevState) => {
    // Only save if items have changed
    return state.items !== prevState.items;
  },
});
```

### 2. Queue Optimization

```typescript
// Batch similar actions
const useStore = create(
  withOffline(
    (set) => ({
      items: [],
      batchAddItems: (items) => set((state) => ({
        items: [...state.items, ...items],
      })),
    }),
    {
      batchActions: true,
      batchTimeout: 500, // Wait 500ms for more actions
      shouldBatch: (action1, action2) => {
        return action1.type === action2.type;
      },
    }
  )
);

// Prioritize important actions
const useStore = create(
  withOffline(
    (set) => ({ ... }),
    {
      priority: (action) => {
        switch (action.type) {
          case 'CRITICAL_UPDATE':
            return 1;
          case 'NORMAL_UPDATE':
            return 2;
          default:
            return 3;
        }
      },
    }
  )
);
```

## Additional Troubleshooting Scenarios

### 1. Storage Issues

```typescript
// Handle storage quota exceeded
const { hydrate } = createHydration(store, {
  onStorageError: (error) => {
    if (error.name === "QuotaExceededError") {
      // Clear old data
      store.hydration.clearState();
      // Retry with compression
      return { compress: true };
    }
    throw error;
  },
});

// Handle corrupted data
const { hydrate } = createHydration(store, {
  validateState: (state) => {
    if (!isValidState(state)) {
      // Recover from backup or reset to default
      return getDefaultState();
    }
    return state;
  },
});
```

### 2. Network Issues

```typescript
// Handle intermittent connectivity
const useStore = create(
  withOffline(
    (set) => ({ ... }),
    {
      checkConnection: async () => {
        try {
          const response = await fetch('/health-check');
          return response.ok;
        } catch {
          return false;
        }
      },
      retryOnReconnect: true,
      maxReconnectAttempts: 3,
    }
  )
);

// Handle partial updates
const useStore = create(
  withOffline(
    (set) => ({ ... }),
    {
      partialUpdate: true,
      mergeStrategy: (local, remote) => ({
        ...local,
        ...remote,
        // Custom merge logic
        items: [...local.items, ...remote.items],
      }),
    }
  )
);
```

### 3. State Recovery

```typescript
// Implement state recovery
const { hydrate } = createHydration(store, {
  backupInterval: 3600000, // Backup every hour
  maxBackups: 24, // Keep 24 backups
  onRecovery: (backup) => {
    // Validate backup
    if (isValidBackup(backup)) {
      return backup;
    }
    // Try older backup
    return getOlderBackup();
  },
});

// Handle version conflicts
const { hydrate } = createHydration(store, {
  version: 2,
  onVersionConflict: (localVersion, remoteVersion) => {
    if (remoteVersion > localVersion) {
      // Accept remote version
      return { acceptRemote: true };
    } else {
      // Keep local version
      return { keepLocal: true };
    }
  },
});
```

## Best Practices

1. **Storage Management**

   - Implement data cleanup strategies
   - Use compression for large states
   - Implement backup and recovery
   - Monitor storage usage

2. **Network Handling**

   - Implement proper retry strategies
   - Handle partial updates gracefully
   - Provide user feedback
   - Implement offline indicators

3. **State Management**

   - Version your state schema
   - Implement proper migration paths
   - Validate state integrity
   - Handle conflicts appropriately

4. **Performance**

   - Use selective updates
   - Implement debouncing
   - Use compression when needed
   - Monitor memory usage

5. **Error Handling**
   - Implement proper error recovery
   - Provide user feedback
   - Log errors appropriately
   - Handle edge cases
