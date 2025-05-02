# Query Guide for Lucent-Flow

Lucent-Flow provides a powerful and flexible query system for handling data fetching, caching, and state management. This guide will walk you through all the features and best practices.

## Installation

```bash
npm install lucent-flow
```

## Basic Query Usage

### Creating a Query Instance

```typescript
import { lucentQuery } from "lucent-flow";

const api = lucentQuery({
  baseUrl: "https://api.example.com",
  headers: {
    "Content-Type": "application/json",
  },
});
```

### Making Requests

```typescript
// GET request
const result = await api({
  url: "/posts",
  method: "GET",
});

// POST request
const result = await api({
  url: "/posts",
  method: "POST",
  body: { title: "New Post", content: "Hello World" },
});
```

## Advanced Query Features

### 1. Request Deduplication

Prevent duplicate requests with built-in deduplication:

```typescript
const api = lucentQuery({
  enableDeduplication: true,
  deduplicationTime: 1000, // Cache requests for 1 second
});

// Multiple calls to the same endpoint within 1 second will reuse the same response
const result1 = await api({ url: "/posts" });
const result2 = await api({ url: "/posts" }); // Uses cached response
```

### 2. Optimistic Updates

Update UI before server response:

```typescript
const createPost = async (post) => {
  const optimisticId = Date.now();
  
  // Optimistically update UI
  set((state) => ({
    posts: [{ ...post, id: optimisticId }, ...state.posts],
  }));

  try {
    const result = await api({
      url: "/posts",
      method: "POST",
      body: post,
      optimisticUpdateId: optimisticId.toString(),
    });
    
    // Replace optimistic post with real data
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === optimisticId ? result.data : p
      ),
    }));
  } catch (error) {
    // Rollback on error
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== optimisticId),
    }));
  }
};
```

### 3. Retry Logic

Handle failed requests with automatic retries:

```typescript
const api = lucentQuery({
  retry: {
    count: 3,
    delay: 1000,
    condition: (error) => error.status >= 500,
  },
});
```

### 4. Interceptors

Add custom logic to requests and responses:

```typescript
const api = lucentQuery({
  requestInterceptors: [
    async (config) => {
      // Add auth token
      const token = localStorage.getItem("token");
      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        },
      };
    },
  ],
  responseInterceptors: [
    async (response) => {
      // Log successful responses
      console.log("Request successful:", response.meta?.request.url);
      return response;
    },
  ],
  errorInterceptors: [
    async (error) => {
      // Handle 401 errors
      if (error.message.includes("401")) {
        window.location.href = "/login";
      }
      return error;
    },
  ],
});
```

### 5. Caching

Configure caching behavior:

```typescript
const api = lucentQuery({
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 100,
    tags: ["posts"],
  },
});
```

## Using with Stores

### Basic Store Integration

```typescript
import { create } from "lucent-flow";

const usePostStore = create((set) => ({
  posts: [],
  loading: false,
  error: null,

  fetchPosts: async () => {
    set({ loading: true });
    try {
      const result = await api({
        url: "/posts",
        method: "GET",
      });
      set({ posts: result.data, loading: false });
    } catch (error) {
      set({ error, loading: false });
    }
  },
}));
```

### Advanced Store Integration

```typescript
const useAdvancedPostStore = create((set, get) => ({
  posts: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  },
  filters: {
    page: 1,
    limit: 10,
    sortBy: "id",
    sortDirection: "desc",
  },
  loading: false,
  error: null,

  fetchPosts: async (filters = get().filters) => {
    try {
      set({ loading: true, error: null });

      const result = await api({
        url: "/posts",
        method: "GET",
        params: {
          _page: filters.page,
          _limit: filters.limit,
          _sort: filters.sortBy,
          _order: filters.sortDirection,
        },
      });

      set({
        posts: result.data,
        pagination: {
          currentPage: filters.page,
          totalPages: Math.ceil(result.meta.total / filters.limit),
          totalItems: result.meta.total,
          itemsPerPage: filters.limit,
        },
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch posts",
        loading: false,
      });
    }
  },
}));
```

## Best Practices

### 1. Error Handling

```typescript
const handleError = (error) => {
  if (error.status === 401) {
    // Handle unauthorized
  } else if (error.status === 404) {
    // Handle not found
  } else {
    // Handle other errors
  }
};
```

### 2. Loading States

```typescript
const useStore = create((set) => ({
  data: null,
  loading: false,
  error: null,

  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const result = await api({ url: "/data" });
      set({ data: result.data, loading: false });
    } catch (error) {
      set({ error, loading: false });
    }
  },
}));
```

### 3. Caching Strategy

```typescript
const api = lucentQuery({
  cache: {
    ttl: 300000, // 5 minutes
    staleTime: 60000, // 1 minute
    tags: ["posts"],
  },
});
```

### 4. Request Deduplication

```typescript
const api = lucentQuery({
  enableDeduplication: true,
  deduplicationTime: 1000, // 1 second
});
```

## Common Patterns

### 1. Pagination

```typescript
const fetchPage = async (page) => {
  const result = await api({
    url: "/posts",
    method: "GET",
    params: {
      _page: page,
      _limit: 10,
    },
  });
  return result.data;
};
```

### 2. Search

```typescript
const searchPosts = async (query) => {
  const result = await api({
    url: "/posts",
    method: "GET",
    params: {
      q: query,
    },
  });
  return result.data;
};
```

### 3. Filtering

```typescript
const filterPosts = async (filters) => {
  const result = await api({
    url: "/posts",
    method: "GET",
    params: filters,
  });
  return result.data;
};
```

## Troubleshooting

### 1. Request Not Sending

- Check if the URL is correct
- Verify the method is specified
- Ensure the baseUrl is set correctly

### 2. Caching Issues

- Verify TTL settings
- Check cache tags
- Ensure proper cache invalidation

### 3. Error Handling

- Check error interceptors
- Verify error status codes
- Ensure proper error messages

### 4. Performance Issues

- Enable request deduplication
- Implement proper caching
- Use optimistic updates

## Next Steps

1. Explore the [API Documentation](./api.md)
2. Check out the [Examples](./examples.md)
3. Learn about [Advanced Features](./advanced.md)

Need help? Check out our [GitHub repository](https://github.com/your-org/lucent) or join our [Discord community](https://discord.gg/your-community). 