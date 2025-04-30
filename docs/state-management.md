# Advanced State Management

Lucent provides powerful state management capabilities with advanced features for complex applications.

## Table of Contents

- [Selectors](#selectors)
- [Action Creators](#action-creators)
- [Immer Integration](#immer-integration)
- [State Utilities](#state-utilities)
- [Examples](#examples)

## Selectors

Selectors are functions that compute derived state from your store. They help keep your components clean and efficient by moving complex state calculations outside of components.

```typescript
// Define selectors
const selectors = {
  isEven: (state: CounterState) => state.count % 2 === 0,
  historyLength: (state: CounterState) => state.history.length,
  lastValue: (state: CounterState) => state.history[state.history.length - 1],
};

// Use in store
const useStore = withSelectors(store, selectors);

// Use in component
const { isEven, historyLength } = useStore();
```

### Benefits

- Memoized computations
- Clean component code
- Reusable state logic
- Type-safe derived state

## Action Creators

Action creators provide a structured way to create state updates with type safety and payload handling.

```typescript
// Define action creators
const actions = {
  increment: () => (state: CounterState) => ({
    count: state.count + 1,
    history: [...state.history, state.count + 1],
  }),
  decrement: () => (state: CounterState) => ({
    count: state.count - 1,
    history: [...state.history, state.count - 1],
  }),
};

// Use in store
const useStore = withActions(store, actions);

// Use in component
const { increment, decrement } = useStore();
```

### Features

- Type-safe payloads
- Immutable updates
- Reusable actions
- Easy testing

## Immer Integration

Lucent uses Immer for immutable state updates, allowing you to write simpler, more intuitive state updates.

```typescript
// Create store with immer
const useStore = create<State>()(
  immer((set) => ({
    count: 0,
    increment: () =>
      set((state) => {
        state.count += 1; // Direct mutation is safe with Immer
      }),
  }))
);
```

### Benefits

- Write mutable code, get immutable updates
- Simpler state updates
- Better performance
- Automatic immutability

## State Utilities

### Combining Stores

Combine multiple stores into a single store for better organization.

```typescript
const combinedStore = combineStores(userStore, settingsStore);

// Use in component
const { user, settings } = combinedStore();
```

### Splitting Stores

Split large stores into smaller, more manageable pieces.

```typescript
const { userStore, settingsStore } = splitStore(mainStore, [
  "user",
  "settings",
]);

// Use individual stores
const user = userStore();
const settings = settingsStore();
```

## Examples

### Advanced Counter Store

```typescript
// Store definition
const useCounterStore = create<CounterState>()(
  immer((set) => ({
    count: 0,
    history: [0],
    increment: () =>
      set((state) => {
        state.count += 1;
        state.history.push(state.count);
      }),
  }))
);

// Enhanced with selectors and actions
const useEnhancedCounterStore = withSelectors(
  withActions(useCounterStore, actions),
  selectors
);
```

### Component Usage

```typescript
function Counter() {
  const { count, increment, isEven, historyLength } = useEnhancedCounterStore();

  return (
    <div>
      <p>Count: {count}</p>
      <p>Is Even: {isEven ? "Yes" : "No"}</p>
      <p>History Length: {historyLength}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

## Best Practices

1. **Selectors**

   - Keep selectors pure
   - Memoize expensive computations
   - Use TypeScript for type safety

2. **Action Creators**

   - Keep actions focused
   - Use payload types
   - Handle side effects properly

3. **State Structure**

   - Keep state normalized
   - Use appropriate splitting
   - Avoid deeply nested state

4. **Performance**
   - Use selectors for derived state
   - Split large stores
   - Memoize components when needed

## API Reference

### withSelectors

```typescript
withSelectors<T extends object>(
  store: StoreApi<T>,
  selectors: Record<string, Selector<T, any>>
): StoreApi<T>
```

### withActions

```typescript
withActions<T extends object>(
  store: StoreApi<T>,
  actions: Record<string, ActionCreator<T, any>>
): StoreApi<T>
```

### combineStores

```typescript
combineStores<T extends object, U extends object>(
  store1: StoreApi<T>,
  store2: StoreApi<U>
): StoreApi<T & U>
```

### splitStore

```typescript
splitStore<T extends object, K extends keyof T>(
  store: StoreApi<T>,
  keys: K[]
): Record<K, StoreApi<Pick<T, K>>>
```
