# Lucent-Flow Features

Lucent-Flow is packed with powerful features to make state management and data fetching a breeze. This guide covers all the major features and how to use them.

## Installation

```bash
npm install lucent-flow
```

## Core Features

### 1. Advanced State Management

- Built on Zustand for efficient state management
- Type-safe state and actions
- Middleware support
- DevTools integration
- State persistence options
- Built-in Immer integration for immutable updates
  ```typescript
  // Immer is automatically used when passing a function to set
  set((state) => ({
    posts: state.posts.map((post) => (post.id === id ? updatedPost : post)),
  }));
  ```

### 2. Powerful Query System

- Built-in query builder for complex requests
- Support for REST and GraphQL APIs
- Automatic request deduplication
- Configurable retry logic
- Request/response interceptors

### 3. Advanced Caching

- Configurable TTL (Time To Live)
- Tag-based cache invalidation
- Stale-while-revalidate support
- Automatic cache revalidation
- Persistent storage options

### 4. Optimistic Updates

- Automatic optimistic UI updates
- Configurable rollback strategies
- Support for complex update scenarios
- Error recovery mechanisms
- Transaction-like behavior

## Advanced Features

### 1. Pagination Support

```typescript
import { create } from "lucent-flow";

const store = create<AdvancedPostStore>((set, get) => ({
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  },
  fetchPosts: async (filters) => {
    const query = queryBuilder
      .limit(filters.limit)
      .offset((filters.page - 1) * filters.limit);
    // ... fetch and update pagination
  },
}));
```

### 2. Advanced Filtering

```typescript
const query = queryBuilder
  .where({ userId: 1 })
  .search("search term")
  .orderBy("createdAt", "desc")
  .limit(10)
  .offset(0);
```

### 3. Request Deduplication

```typescript
const api = lucentQuery({
  enableDeduplication: true,
  deduplicationTime: 1000, // 1 second
});
```

### 4. Retry Logic

```typescript
const api = lucentQuery({
  retry: {
    count: 3,
    delay: 1000,
    condition: (error) => error.status >= 500,
  },
});
```

### 5. Error Handling

```typescript
const api = lucentQuery({
  errorInterceptors: [
    async (error) => {
      if (error.status === 401) {
        await refreshToken();
        return true; // Retry request
      }
      return false;
    },
  ],
});
```

### 6. Optimistic Updates

```typescript
const createPost = async (post) => {
  const optimisticId = Date.now();
  set((state) => ({
    posts: [{ ...post, id: optimisticId }, ...state.posts],
  }));

  try {
    const result = await api.post("/posts", post);
    set((state) => ({
      posts: state.posts.map((p) => (p.id === optimisticId ? result.data : p)),
    }));
  } catch (error) {
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== optimisticId),
    }));
  }
};
```

### 7. Cache Management

```typescript
const api = lucentQuery({
  cache: {
    ttl: 300000, // 5 minutes
    staleTime: 60000, // 1 minute
    tags: ["posts"],
  },
});
```

## Best Practices

### 1. State Management

- Use TypeScript for type safety
- Implement proper error handling
- Use middleware for cross-cutting concerns
- Implement proper loading states
- Use selectors for derived state

### 2. API Integration

- Use the query builder for complex requests
- Implement proper error handling
- Use interceptors for common concerns
- Implement caching where appropriate
- Use optimistic updates for better UX

### 3. Performance

- Use request deduplication
- Implement proper caching
- Use optimistic updates
- Implement proper loading states
- Use proper error handling

### 4. Testing

- Test state changes
- Test API integration
- Test error handling
- Test optimistic updates
- Test cache behavior

## Example Implementation

See the [AdvancedPostStore](../src/stores/advancedPostStore.ts) for a complete example of advanced features in action.

## Roadmap

### Planned Features

1. Enhanced GraphQL support
2. Advanced caching strategies
3. Improved error handling
4. Better TypeScript integration
5. More middleware options

### Current Limitations

1. GraphQL support is basic
2. Cache invalidation could be improved
3. Error handling could be more robust
4. TypeScript integration could be enhanced

## Getting Started

1. Install Lucent:

```bash
npm install lucent-flow
```

2. Create a store:

```typescript
import { create } from "lucent-flow";

const store = create<YourStore>((set, get) => ({
  // Your store implementation
}));
```

3. Use in your components:

```typescript
const YourComponent = () => {
  const { data, loading, error } = useStore(store);
  // Your component implementation
};
```

## Contributing

We welcome contributions! Please see our [contributing guide](../CONTRIBUTING.md) for more information.
