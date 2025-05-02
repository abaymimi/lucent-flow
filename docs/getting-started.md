# Getting Started with Lucent-Flow

Lucent-Flow is a powerful state management library built on top of Zustand. This guide will walk you through the basic setup and usage of Lucent-Flow in your React application.

## Installation

```bash
npm install lucent-flow
# or
yarn add lucent-flow
```

## Basic Setup

### 1. Create Your Store

First, create a store using Lucent-Flow's `create` function:

```typescript
// stores/counterStore.ts
import { create } from "lucent-flow";

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
```

### 2. Use the Store in Components

You can use the store directly in your components without any provider:

```tsx
// components/Counter.tsx
import { useCounterStore } from "../stores/counterStore";

export function Counter() {
  const { count, increment, decrement } = useCounterStore();

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
    </div>
  );
}
```

## Advanced Features

### 1. Using Middleware

Lucent-Flow comes with built-in middleware for common use cases:

```typescript
import { create, devtools, persist } from "lucent-flow";

const useStore = create(
  devtools(
    persist(
      (set) => ({
        // your store implementation
      }),
      {
        name: "store-name",
      }
    )
  )
);
```

### 2. State Persistence

To persist your store's state:

```typescript
import { create, persist } from "lucent-flow";

const useStore = create(
  persist(
    (set) => ({
      // your store implementation
    }),
    {
      name: "store-name",
      storage: "localStorage", // or 'sessionStorage'
    }
  )
);
```

### 3. DevTools Integration

For debugging with Redux DevTools:

```typescript
import { create, devtools } from "lucent-flow";

const useStore = create(
  devtools(
    (set) => ({
      // your store implementation
    }),
    {
      name: "store-name",
    }
  )
);
```

## Best Practices

1. **Store Organization**

   - Keep stores in a dedicated `stores` directory
   - Use TypeScript interfaces for type safety
   - Split large stores into smaller, focused ones

2. **Component Usage**

   - Use selectors to prevent unnecessary re-renders
   - Keep store logic separate from component logic
   - Use middleware for side effects

3. **Performance**
   - Use shallow equality checks for complex objects
   - Implement proper memoization
   - Monitor store size and complexity

## Common Patterns

### 1. Async Actions

```typescript
const useStore = create((set) => ({
  data: null,
  loading: false,
  error: null,
  fetchData: async () => {
    set({ loading: true });
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

### 2. Computed Values

```typescript
const useStore = create((set, get) => ({
  items: [],
  getTotal: () => {
    const state = get();
    return state.items.reduce((sum, item) => sum + item.price, 0);
  },
}));
```

### 3. Multiple Stores

```typescript
// stores/userStore.ts
const useUserStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

// stores/cartStore.ts
const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
}));
```

## Troubleshooting

1. **Store Not Updating**

   - Check if you're using the correct store instance
   - Verify middleware configuration
   - Ensure state updates are immutable

2. **Performance Issues**

   - Use selectors to prevent unnecessary re-renders
   - Check for unnecessary state updates
   - Monitor store size and complexity

3. **TypeScript Errors**
   - Verify interface definitions
   - Check middleware type compatibility
   - Ensure proper type inference

## Next Steps

1. Explore the [API Documentation](./api.md)
2. Check out the [Examples](./examples.md)
3. Learn about [Advanced Features](./advanced.md)

Need help? Check out our [GitHub repository](https://github.com/your-org/lucent) or join our [Discord community](https://discord.gg/your-community).
