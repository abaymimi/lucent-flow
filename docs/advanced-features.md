# Lucent-Flow Advanced Features

## Time-Travel Debugging

### Overview

Time-travel debugging allows you to move backward and forward through state changes, inspect state at any point, and replay actions.

### Implementation

```typescript
import { create } from "lucent-flow";
import { timeTravel } from "lucent-flow/middleware";

const useStore = create<State>()(
  timeTravel(
    (set) => ({
      // ... state
    }),
    {
      maxHistory: 100, // Maximum number of states to keep
      enableDevTools: true, // Integrate with Redux DevTools
      recordActions: true, // Record action names for better debugging
    }
  )
);
```

### Usage

```typescript
const store = useStore.getState();

// Move backward in time
store.timeTravel.back();

// Move forward in time
store.timeTravel.forward();

// Jump to specific state
store.timeTravel.jumpTo(5);

// Get current state index
const currentIndex = store.timeTravel.getCurrentIndex();

// Get state history
const history = store.timeTravel.getHistory();

// Replay actions from a specific point
store.timeTravel.replayFrom(3);

// Clear history
store.timeTravel.clearHistory();
```

## State Synchronization

### Overview

State synchronization enables real-time state updates across multiple browser tabs/windows.

### Implementation

```typescript
import { create } from "lucent-flow";
import { syncState } from "lucent-flow/middleware";

const useStore = create<State>()(
  syncState(
    (set) => ({
      // ... state
    }),
    {
      channel: "my-app-state", // Unique channel name
      storage: "localStorage", // Storage backend
      debounce: 100, // Debounce updates (ms)
      blacklist: ["sensitiveData"], // Properties to exclude from sync
    }
  )
);
```

### Usage

```typescript
const store = useStore.getState();

// Manually trigger sync
store.syncState.sync();

// Get sync status
const isSyncing = store.syncState.isSyncing();

// Get last sync timestamp
const lastSync = store.syncState.getLastSync();

// Pause/resume sync
store.syncState.pause();
store.syncState.resume();

// Handle sync conflicts
store.syncState.onConflict((localState, remoteState) => {
  // Implement conflict resolution strategy
  return mergeStates(localState, remoteState);
});
```

## Offline Support

### Overview

Offline support ensures your application works without an internet connection, with automatic state persistence and sync when back online.

### Implementation

```typescript
import { create } from "lucent-flow";
import { offline } from "lucent-flow/middleware";

const useStore = create<State>()(
  offline(
    (set) => ({
      // ... state
    }),
    {
      storage: "indexedDB", // Storage backend
      syncInterval: 5000, // Sync interval (ms)
      retryStrategy: "exponential", // Retry strategy
      maxRetries: 3, // Maximum retry attempts
    }
  )
);
```

### Usage

```typescript
const store = useStore.getState();

// Check online status
const isOnline = store.offline.isOnline();

// Get offline queue
const queue = store.offline.getQueue();

// Process offline queue
store.offline.processQueue();

// Add to offline queue
store.offline.queueAction({
  type: "UPDATE_DATA",
  payload: {
    /* ... */
  },
});

// Handle offline errors
store.offline.onError((error) => {
  console.error("Offline error:", error);
});

// Configure retry strategy
store.offline.setRetryStrategy({
  maxRetries: 5,
  initialDelay: 1000,
  maxDelay: 10000,
});
```

## State Hydration

### Overview

State hydration utilities help manage the loading and saving of state, with support for partial hydration and state versioning.

### Implementation

```typescript
import { create } from "lucent-flow";
import { hydrate } from "lucent-flow/middleware";

const useStore = create<State>()(
  hydrate(
    (set) => ({
      // ... state
    }),
    {
      storage: "indexedDB",
      version: 1,
      migrations: [
        // Migration functions
        (state) => migrateV1toV2(state),
        (state) => migrateV2toV3(state),
      ],
      partialHydration: true,
    }
  )
);
```

### Usage

```typescript
const store = useStore.getState();

// Hydrate state
await store.hydrate.load();

// Save state
await store.hydrate.save();

// Partial hydration
await store.hydrate.loadPartial(["user", "settings"]);

// Get hydration status
const isHydrated = store.hydrate.isHydrated();

// Get state version
const version = store.hydrate.getVersion();

// Add migration
store.hydrate.addMigration((state) => {
  // Migration logic
  return migratedState;
});

// Handle hydration errors
store.hydrate.onError((error) => {
  console.error("Hydration error:", error);
});
```

## Advanced Configuration

### Combined Usage

```typescript
import { create } from "lucent-flow";
import {
  timeTravel,
  syncState,
  offline,
  hydrate,
} from "lucent-flow/middleware";

const useStore = create<State>()(
  timeTravel(
    syncState(
      offline(
        hydrate(
          (set) => ({
            // ... state
          }),
          {
            // Hydration config
            storage: "indexedDB",
            version: 1,
          }
        ),
        {
          // Offline config
          storage: "indexedDB",
          syncInterval: 5000,
        }
      ),
      {
        // Sync config
        channel: "my-app-state",
        debounce: 100,
      }
    ),
    {
      // Time-travel config
      maxHistory: 100,
      enableDevTools: true,
    }
  )
);
```

### Performance Considerations

1. **Time-Travel Debugging**

   - Limit history size to prevent memory issues
   - Use selective state recording for large states
   - Implement state compression for better performance

2. **State Synchronization**

   - Debounce sync operations
   - Use efficient diffing algorithms
   - Implement conflict resolution strategies

3. **Offline Support**

   - Optimize storage operations
   - Implement efficient queue processing
   - Use appropriate retry strategies

4. **State Hydration**
   - Use partial hydration for large states
   - Implement efficient migration strategies
   - Handle version conflicts gracefully

### Best Practices

1. **Time-Travel Debugging**

   - Record meaningful action names
   - Implement state snapshots for critical points
   - Use selective state recording for performance

2. **State Synchronization**

   - Handle conflicts appropriately
   - Implement proper error handling
   - Use appropriate sync intervals

3. **Offline Support**

   - Implement proper error recovery
   - Use efficient queue management
   - Handle network status changes

4. **State Hydration**
   - Version your state properly
   - Implement backward compatibility
   - Handle migration errors gracefully

### Troubleshooting

1. **Time-Travel Issues**

   - Check history size limits
   - Verify action recording
   - Monitor memory usage

2. **Sync Issues**

   - Check network connectivity
   - Verify channel configuration
   - Monitor sync conflicts

3. **Offline Issues**

   - Check storage availability
   - Verify queue processing
   - Monitor retry attempts

4. **Hydration Issues**
   - Check version compatibility
   - Verify migration functions
   - Monitor storage operations
