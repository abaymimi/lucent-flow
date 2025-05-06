# Middleware Documentation

## Time Travel Middleware

The Time Travel middleware provides state history tracking and time travel capabilities for your store. It allows you to move back and forth through state changes, replay actions, and inspect state history.

### Usage

```typescript
import { configureStore } from 'lucent-flow';
import { timeTravelMiddleware } from 'lucent-flow';

const store = configureStore({
  initialState: { count: 0 },
  middleware: [
    (store) => timeTravelMiddleware(store, {
      maxHistory: 50,        // Maximum number of states to keep in history
      enableDevTools: true,  // Enable Redux DevTools integration
      recordActions: true    // Record action types for replay
    })
  ]
});
```

### Features

- **State History**: Track past, present, and future states
- **Time Travel Operations**:
  - `back()`: Move to previous state
  - `forward()`: Move to next state
  - `jumpTo(index)`: Jump to specific state
  - `replayFrom(index)`: Replay actions from specific point
  - `clearHistory()`: Clear state history
- **Redux DevTools Integration**: View state changes in Redux DevTools
- **Configurable History Size**: Control memory usage

### Example

```typescript
// Access time travel methods
const { timeTravel } = store as any;

// Update state
store.setState({ count: 1 });
store.setState({ count: 2 });
store.setState({ count: 3 });

// Go back to previous state
timeTravel.back();
console.log(store.getState().count); // 2

// Go forward to next state
timeTravel.forward();
console.log(store.getState().count); // 3

// Jump to specific state
timeTravel.jumpTo(0);
console.log(store.getState().count); // 1

// Get history
const history = timeTravel.getHistory();
console.log(history.past);    // Previous states
console.log(history.present); // Current state
console.log(history.future);  // Future states
```

## Sync State Middleware

The Sync State middleware enables state synchronization across multiple browser tabs/windows. It uses the Storage API to broadcast state changes and handle conflicts.

### Usage

```typescript
import { configureStore } from 'lucent-flow';
import { syncStateMiddleware } from 'lucent-flow';

const store = configureStore({
  initialState: { count: 0 },
  middleware: [
    (store) => syncStateMiddleware(store, {
      channel: 'my-app-state',  // Unique channel name for your app
      storage: 'localStorage',  // Storage type: 'localStorage' or 'sessionStorage'
      debounce: 100,           // Debounce time in milliseconds
      blacklist: ['secret']    // Properties to exclude from sync
    })
  ]
});
```

### Features

- **Cross-Tab Synchronization**: Keep state in sync across multiple tabs
- **Configurable Storage**: Choose between localStorage and sessionStorage
- **Debounced Updates**: Prevent excessive syncing
- **Blacklist Support**: Exclude sensitive data from sync
- **Conflict Resolution**: Custom handlers for resolving state conflicts
- **Pause/Resume**: Control when syncing occurs

### Example

```typescript
// Access sync methods
const { syncState } = store as any;

// Update state (will be synced automatically)
store.setState({ count: 1 });

// Pause syncing
syncState.pause();
store.setState({ count: 2 }); // Won't be synced

// Resume syncing
syncState.resume();
store.setState({ count: 3 }); // Will be synced

// Set custom conflict handler
syncState.onConflict((localState, remoteState) => ({
  ...localState,
  count: Math.max(localState.count, remoteState.count)
}));

// Force sync
syncState.sync();

// Check sync status
console.log(syncState.isSyncing()); // true/false
console.log(syncState.getLastSync()); // timestamp
```

### Best Practices

1. **Time Travel Middleware**:
   - Set appropriate `maxHistory` to prevent memory issues
   - Use `recordActions` for better debugging
   - Consider enabling DevTools in development only

2. **Sync State Middleware**:
   - Use unique `channel` names for different apps
   - Blacklist sensitive data
   - Implement proper conflict resolution
   - Use appropriate debounce time
   - Consider using sessionStorage for temporary data

### Error Handling

Both middleware include error handling:

- Time Travel: Handles invalid state transitions gracefully
- Sync State: Catches and logs sync errors, maintains local state integrity

### Performance Considerations

- Time Travel: History size affects memory usage
- Sync State: Debounce time affects sync frequency
- Both: Consider impact on large state objects

## Offline Middleware

The Offline middleware provides offline support for your application by queuing actions while offline and processing them when the connection is restored.

### Usage

```typescript
import { configureStore } from 'lucent-flow';
import { offlineMiddleware } from 'lucent-flow';

const store = configureStore({
  initialState: { count: 0 },
  middleware: [
    (store) => offlineMiddleware(store, {
      storage: 'indexedDB',      // Storage type: 'localStorage' or 'indexedDB'
      syncInterval: 5000,        // Interval for checking online status
      retryStrategy: {           // Retry configuration for failed actions
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000
      }
    })
  ]
});
```

### Features

- **Offline Queue**: Queue actions while offline
- **Automatic Processing**: Process queued actions when back online
- **Retry Strategy**: Configurable retry mechanism for failed actions
- **Storage Options**: Choose between localStorage and IndexedDB
- **Error Handling**: Custom error handlers for failed actions

### Example

```typescript
// Access offline methods
const { offline } = store as any;

// Queue an action while offline
offline.queueAction({
  type: 'INCREMENT',
  payload: { count: 1 }
});

// Process the queue manually
offline.processQueue();

// Set retry strategy
offline.setRetryStrategy({
  maxRetries: 5,
  initialDelay: 2000,
  maxDelay: 20000
});

// Set error handler
offline.onError((error) => {
  console.error('Action failed:', error);
});

// Check online status
console.log(offline.isOnline()); // true/false

// Get queued actions
console.log(offline.getQueue());
```

## Persist Middleware

The Persist middleware automatically saves your state to storage and loads it on initialization.

### Usage

```typescript
import { configureStore } from 'lucent-flow';
import { persistMiddleware } from 'lucent-flow';

const store = configureStore({
  initialState: { count: 0 },
  middleware: [
    (store) => persistMiddleware(store, {
      key: 'my-app-state',      // Storage key
      storage: localStorage,    // Storage engine
      blacklist: ['secret']     // Properties to exclude from persistence
    })
  ]
});
```

### Features

- **Automatic Persistence**: Save state changes to storage
- **Initial State Loading**: Load saved state on initialization
- **Configurable Storage**: Use any storage engine implementing the StorageEngine interface
- **Blacklist Support**: Exclude sensitive data from persistence
- **Error Handling**: Graceful handling of storage errors

### Example

```typescript
// Define a custom storage engine
const customStorage: StorageEngine = {
  getItem: async (key) => {
    // Custom get implementation
  },
  setItem: async (key, value) => {
    // Custom set implementation
  }
};

// Use custom storage
const store = configureStore({
  initialState: { count: 0 },
  middleware: [
    (store) => persistMiddleware(store, {
      key: 'my-app-state',
      storage: customStorage
    })
  ]
});
```

## DevTools Middleware

The DevTools middleware provides integration with Redux DevTools for debugging and state inspection.

### Usage

```typescript
import { configureStore } from 'lucent-flow';
import { devtoolsMiddleware } from 'lucent-flow';

const store = configureStore({
  initialState: { count: 0 },
  middleware: [
    (store) => devtoolsMiddleware(store, {
      name: 'My App',           // Store name in DevTools
      enabled: true,            // Enable/disable DevTools
      trace: true              // Enable action tracing
    })
  ]
});
```

### Features

- **Redux DevTools Integration**: Full compatibility with Redux DevTools
- **Action Tracking**: Track all state changes
- **Time Travel**: Use DevTools time travel features
- **State Inspection**: Inspect state at any point
- **Action Replay**: Replay actions for debugging

## Logger Middleware

The Logger middleware provides detailed logging of state changes for debugging purposes.

### Usage

```typescript
import { configureStore } from 'lucent-flow';
import { loggerMiddleware } from 'lucent-flow';

const store = configureStore({
  initialState: { count: 0 },
  middleware: [
    (store) => loggerMiddleware(store, {
      collapsed: true,          // Collapse log groups
      diff: true,              // Show state diffs
      filter: (action) => true // Filter which actions to log
    })
  ]
});
```

### Features

- **Action Logging**: Log all state changes
- **State Diffs**: Show what changed in each update
- **Collapsible Groups**: Organize logs by action
- **Custom Filtering**: Filter which actions to log
- **Development Only**: Automatically disable in production

### Example

```typescript
// Custom logger configuration
const store = configureStore({
  initialState: { count: 0 },
  middleware: [
    (store) => loggerMiddleware(store, {
      collapsed: false,
      diff: true,
      filter: (action) => action.type !== 'SILENT_ACTION'
    })
  ]
});
```

### Best Practices

1. **Offline Middleware**:
   - Choose appropriate storage based on data size
   - Implement proper retry strategies
   - Handle errors gracefully
   - Consider user experience during offline periods

2. **Persist Middleware**:
   - Use appropriate storage engine
   - Blacklist sensitive data
   - Handle storage errors
   - Consider data size limits

3. **DevTools Middleware**:
   - Enable only in development
   - Use meaningful store names
   - Enable tracing for complex actions
   - Consider performance impact

4. **Logger Middleware**:
   - Use in development only
   - Configure appropriate log levels
   - Filter sensitive data
   - Consider performance impact

### Error Handling

All middleware include error handling:

- Offline: Handles network errors and retries
- Persist: Handles storage errors gracefully
- DevTools: Handles DevTools connection issues
- Logger: Handles logging errors silently

### Performance Considerations

- Offline: Queue size affects memory usage
- Persist: Storage operations affect performance
- DevTools: Tracing affects performance
- Logger: Logging frequency affects performance

### Combining Middleware

You can combine multiple middleware for enhanced functionality:

```typescript
const store = configureStore({
  initialState: { count: 0 },
  middleware: [
    (store) => persistMiddleware(store, { key: 'app-state' }),
    (store) => offlineMiddleware(store),
    (store) => devtoolsMiddleware(store),
    (store) => loggerMiddleware(store)
  ]
});
```

Note: The order of middleware matters. Generally, you should apply them in this order:
1. Persist (to load initial state)
2. Offline (to handle offline actions)
3. DevTools (to track all changes)
4. Logger (to log the final result) 