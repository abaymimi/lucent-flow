# Lucent-Flow Quick Reference

## Core API

### Store Creation

```typescript
import { create } from "lucent-flow";

const useStore = create<State>((set) => ({
  // state and actions
}));
```

### Store Usage

```typescript
const state = useStore(); // get entire state
const { property } = useStore(); // get specific property
const action = useStore((state) => state.action); // get specific action
```

## Middleware

### Persistence

```typescript
import { persist } from "lucent-flow/middleware";

const useStore = create<State>()(
  persist(
    (set) => ({
      // state
    }),
    {
      name: "store-name",
      storage: "localStorage" | "indexedDB",
      version: 1,
    }
  )
);
```

### Undo/Redo

```typescript
import { undoRedo } from "lucent-flow/middleware";

const useStore = create<State>()(
  undoRedo(
    (set) => ({
      // state
    }),
    { maxHistory: 50 }
  )
);
```

### Logger

```typescript
import { logger } from "lucent-flow/middleware";

const useStore = create<State>()(
  logger(
    (set) => ({
      // state
    }),
    { enabled: true }
  )
);
```

## State Updates

### Basic Update

```typescript
set((state) => ({ count: state.count + 1 }));
```

### Nested Update

```typescript
set((state) => ({
  user: {
    ...state.user,
    name: "New Name",
  },
}));
```

### Multiple Updates

```typescript
set((state) => ({
  count: state.count + 1,
  total: state.total + 1,
}));
```

## Testing

### Store Testing

```typescript
import { createTestStore, TestHelper } from "lucent-flow/test";

const store = createTestStore<State>(initialState);
const helper = new TestHelper(store);

// Record state changes
helper.recordStateChanges();
store.setState(newState);
helper.assertState(expectedState);

// Snapshot testing
helper.takeSnapshot();
store.setState(newState);
helper.takeSnapshot();
const comparison = helper.compareSnapshots(0, 1);
```

## Best Practices

### 1. State Structure

- Keep state normalized
- Use proper TypeScript types
- Separate concerns into different stores

### 2. Actions

- Make actions pure functions
- Use descriptive names
- Handle errors appropriately

### 3. Performance

- Use selective updates
- Implement memoization
- Batch related updates

### 4. Testing

- Test state changes
- Use snapshots for complex state
- Mock external dependencies

## Common Patterns

### 1. Async Actions

```typescript
const useStore = create<State>((set) => ({
  loading: false,
  error: null,
  data: null,
  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.fetch();
      set({ data, loading: false });
    } catch (error) {
      set({ error, loading: false });
    }
  },
}));
```

### 2. Computed Values

```typescript
const useStore = create<State>((set, get) => ({
  items: [],
  getFilteredItems: () => {
    const { items, filters } = get();
    return items.filter((item) => item.name.includes(filters.search));
  },
}));
```

### 3. Form Handling

```typescript
const useStore = create<State>((set) => ({
  form: {
    email: "",
    password: "",
  },
  setField: (field: string, value: string) =>
    set((state) => ({
      form: {
        ...state.form,
        [field]: value,
      },
    })),
}));
```

## Error Handling

### 1. Basic Error Handling

```typescript
const useStore = create<State>((set) => ({
  error: null,
  action: () => {
    try {
      // action logic
    } catch (error) {
      set({ error: error.message });
    }
  },
}));
```

### 2. Error Recovery

```typescript
const useStore = create<State>((set) => ({
  error: null,
  retryAction: () => {
    set({ error: null });
    // retry logic
  },
}));
```

## Performance Tips

### 1. Selective Updates

```typescript
// Good
const Component = () => {
  const value = useStore((state) => state.specificValue);
  // ...
};

// Bad
const Component = () => {
  const state = useStore();
  const value = state.specificValue;
  // ...
};
```

### 2. Memoization

```typescript
const useStore = create<State>((set, get) => ({
  items: [],
  getMemoizedValue: () => {
    const { items } = get();
    return useMemo(() => items.filter((item) => item.active), [items]);
  },
}));
```

### 3. Batch Updates

```typescript
const useStore = create<State>((set) => ({
  updateMultiple: () => {
    set((state) => ({
      ...state,
      value1: newValue1,
      value2: newValue2,
    }));
  },
}));
```
