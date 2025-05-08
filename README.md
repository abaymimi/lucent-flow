# 🔮 Lucent-Flow

**Lucent-Flow** is a lightweight, blazing-fast state management and data-fetching library for React and TypeScript. Designed to be tiny, reactive, and composable — with middleware support like logging and persistence baked in.

---

![npm](https://img.shields.io/npm/v/lucent-flow)
![npm downloads](https://img.shields.io/npm/dm/lucent-flow)
![license](https://img.shields.io/github/license/abaymimi/lucent-flow)
![GitHub stars](https://img.shields.io/github/stars/abaymimi/lucent-flow?style=social)


## ✨ Features

- 🔄 Minimal global state management with React hooks
- ⚙️ Custom middleware support (logging, persistence, etc.)
- 🧠 Typesafe with full TypeScript support
- 💾 AsyncStorage/localStorage persistence
- 📦 Lightweight and tree-shakable
- 🔌 Ready for server-side or native apps

---

## 📦 Installation

```bash
npm install lucent-flow
```

## Quick Start

```typescript
// Import core functionality
import { createStore } from "lucent-flow";

// Import middleware
import { logger, devtools } from "lucent-flow";

// Create a store with middleware
const useStore = createStore(
  (set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }),
  [logger(), devtools()]
);

// Use in your components
function Counter() {
  const { count, increment } = useStore();
  return <button onClick={increment}>Count: {count}</button>;
}
```

## Core Features

- **State Management**: Create stores with type-safe state and actions
- **Middleware Support**: Built-in middleware for logging, devtools, and more
- **TypeScript First**: Full type safety out of the box

## Documentation

See our [documentation](docs/) for detailed guides on:

- [State Management](docs/state-management.md)
- [Middleware](docs/middleware.md)
- [API Reference](docs/api.md)

## 📡 LucentQuery - Data Fetching Made Simple

LucentQuery provides a powerful and flexible way to handle data fetching with built-in caching, retries, and optimistic updates.

### Basic Usage

```typescript
// Import LucentQuery
import { lucentQuery, QueryBuilder } from "lucent-flow";

// 1. Create a base query instance
const api = lucentQuery({
  baseUrl: "https://api.example.com",
  // Optional: Add default headers
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Use in your store
const usePostStore = createStore((set) => ({
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

### Advanced Usage with QueryBuilder

```typescript
// 1. Create a QueryBuilder instance
const queryBuilder = new QueryBuilder("https://api.example.com");

// 2. Build complex queries
const fetchPosts = async (filters) => {
  const query = queryBuilder
    .from("posts")
    .where("status", "published")
    .sort("createdAt", "desc")
    .paginate(1, 10)
    .include("author")
    .build();

  return await api(query);
};

// 3. Use in your component
function PostList() {
  const { posts, fetchPosts } = usePostStore();

  useEffect(() => {
    fetchPosts({ status: "published" });
  }, []);

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

### Features

- **Automatic Caching**: Built-in cache management with configurable TTL
- **Optimistic Updates**: Update UI before server response
- **Request Deduplication**: Prevent duplicate requests
- **Retry Logic**: Automatic retries for failed requests
- **Type Safety**: Full TypeScript support
- **Query Builder**: Chainable API for complex queries

### Configuration Options

```typescript
const api = lucentQuery({
  baseUrl: "https://api.example.com",
  // Cache configuration
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
  },
  // Retry configuration
  retry: {
    maxAttempts: 3,
    delay: 1000,
  },
  // Request interceptors
  requestInterceptors: [
    async (config) => {
      // Add auth token
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
  ],
  // Response interceptors
  responseInterceptors: [
    async (response) => {
      // Handle response
      return response;
    },
  ],
});
```

For more details, see our [API Documentation](docs/api.md) and [Query Guide](docs/query-guide.md).
