# Lucent-Flow Quick Start Guide

This guide will help you get started with Lucent-Flow's features quickly.

## Installation

```bash
npm install lucent-flow
# or
yarn add lucent-flow
```

## Basic Store Setup

```typescript
import { create } from "zustand";
import { withSelectors, withActions, withStorage } from "lucent-flow";

// Define your store type
interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
}

// Create your store
const useCounterStore = create<CounterStore>()(
  withSelectors(
    withActions((set, get) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      decrement: () => set((state) => ({ count: state.count - 1 })),
    }))
  )
);

// Use in your component
function Counter() {
  const { count, increment, decrement } = useCounterStore();
  return (
    <div>
      <button onClick={decrement}>-</button>
      <span>{count}</span>
      <button onClick={increment}>+</button>
    </div>
  );
}
```

## Using Middleware

### Logger Middleware

```typescript
import { logger } from "lucent-flow";

const useStore = create(
  logger((set) => ({
    // Your store implementation
  }))
);
```

### DevTools Middleware

```typescript
import { devtools } from "lucent-flow";

const useStore = create(
  devtools(
    (set) => ({
      // Your store implementation
    }),
    { name: "MyStore" }
  )
);
```

### Undo/Redo Middleware

```typescript
import { undoRedo } from "lucent-flow";

const useStore = create(
  undoRedo((set) => ({
    // Your store implementation
  }))
);

// Use in your component
function MyComponent() {
  const { undo, redo } = useStore();
  return (
    <div>
      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
    </div>
  );
}
```

## State Persistence

### Basic Storage

```typescript
import { withStorage } from "lucent-flow";

const useStore = create(
  withStorage(
    (set) => ({
      // Your store implementation
    }),
    {
      backend: "localStorage",
      version: "1.0.0",
    }
  )
);
```

### Encrypted Storage

```typescript
const useSecureStore = create(
  withStorage(
    (set) => ({
      // Sensitive data
    }),
    {
      backend: "localStorage",
      version: "1.0.0",
      encryptionKey: "your-secret-key",
    }
  )
);
```

## Advanced Features

### Selectors

```typescript
import { withSelectors } from "lucent-flow";

const useStore = create(
  withSelectors((set, get) => ({
    items: [],
    getItemById: (id) => get().items.find((item) => item.id === id),
    getFilteredItems: (filter) => get().items.filter(filter),
  }))
);

// Use in your component
function MyComponent() {
  const getItemById = useStore((state) => state.getItemById);
  const item = getItemById(1);
}
```

### Action Creators

```typescript
import { withActions } from "lucent-flow";

const useStore = create(
  withActions((set) => ({
    items: [],
    addItem: (item) =>
      set((state) => ({
        items: [...state.items, item],
      })),
    updateItem: (id, updates) =>
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      })),
  }))
);
```

### State Splitting

```typescript
import { splitStore } from "lucent-flow";

const useStore = create((set) => ({
  user: { name: "", email: "" },
  settings: { theme: "light", notifications: true },
}));

const { userStore, settingsStore } = splitStore(useStore, ["user", "settings"]);
```

## Best Practices

1. **Organize Your Stores**

```typescript
// stores/counterStore.ts
export const useCounterStore = create(/* ... */);

// stores/userStore.ts
export const useUserStore = create(/* ... */);

// stores/settingsStore.ts
export const useSettingsStore = create(/* ... */);
```

2. **Use TypeScript**

```typescript
interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

const useUserStore = create<UserState>()(/* ... */);
```

3. **Middleware Order**

```typescript
// Recommended order
const useStore = create(
  logger(
    devtools(
      withStorage(
        withSelectors(
          withActions((set) => ({
            // Your store implementation
          }))
        )
      )
    )
  )
);
```

4. **Error Handling**

```typescript
const useStore = create((set) => ({
  data: null,
  error: null,
  loading: false,
  fetchData: async () => {
    try {
      set({ loading: true, error: null });
      const data = await fetchData();
      set({ data, loading: false });
    } catch (error) {
      set({ error, loading: false });
    }
  },
}));
```

## Common Patterns

### Async Actions

```typescript
const useStore = create((set) => ({
  data: null,
  loading: false,
  error: null,
  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch("/api/data");
      const data = await response.json();
      set({ data, loading: false });
    } catch (error) {
      set({ error, loading: false });
    }
  },
}));
```

### Computed State

```typescript
const useStore = create((set, get) => ({
  items: [],
  filter: "",
  get filteredItems() {
    return get().items.filter((item) => item.name.includes(get().filter));
  },
}));
```

### State Reset

```typescript
const useStore = create((set) => ({
  // ... other state
  reset: () =>
    set({
      // Initial state
    }),
}));
```

## Troubleshooting

1. **State Not Updating**

```typescript
// Check middleware order
const useStore = create(
  logger(
    // Should be first
    devtools(
      withStorage((set) => ({
        // Your store implementation
      }))
    )
  )
);
```

2. **Storage Issues**

```typescript
// Enable error logging
const useStore = create(
  withStorage(
    (set) => ({
      // Your store implementation
    }),
    {
      backend: "localStorage",
      version: "1.0.0",
      onError: (error) => console.error("Storage error:", error),
    }
  )
);
```

3. **Type Errors**

```typescript
// Ensure proper typing
interface StoreState {
  // ... state properties
}

const useStore = create<StoreState>()();
// ... middleware
```

4. **Performance Issues**

```typescript
// Use selectors for expensive computations
const useStore = create((set, get) => ({
  items: [],
  get expensiveComputation() {
    // This will only recompute when items change
    return expensiveOperation(get().items);
  },
}));
```
