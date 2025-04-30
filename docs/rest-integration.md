# REST API Integration with Lucent

Lucent provides powerful tools for integrating REST APIs into your application. This guide will walk you through setting up and using REST API features in Lucent.

## Table of Contents

- [Setup](#setup)
- [Using LucentQuery](#using-lucentquery)
- [Basic Usage](#basic-usage)
- [CRUD Operations](#crud-operations)
- [Query Parameters](#query-parameters)
- [Request Configuration](#request-configuration)
- [Error Handling](#error-handling)
- [Advanced Usage](#advanced-usage)

## Setup

Configure your base API client:

```typescript
import { createFetchStore } from "lucent/core/createFetchStore";

const apiConfig = {
  baseUrl: "https://api.example.com",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
};
```

## Using LucentQuery

LucentQuery provides a more powerful and flexible way to handle REST API requests with built-in features like caching, retries, and request deduplication.

### Basic Usage

```typescript
import { lucentQuery } from "lucent/utils/lucentQuery";

const postQuery = lucentQuery({
  baseUrl: "https://api.example.com",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});

// Fetch posts
const posts = await postQuery({
  url: "/posts",
  method: "GET",
});

// Create post
const newPost = await postQuery({
  url: "/posts",
  method: "POST",
  body: { title: "New Post", body: "Content" },
});
```

### Advanced Configuration

```typescript
const advancedQuery = lucentQuery({
  baseUrl: "https://api.example.com",
  headers: {
    "Content-Type": "application/json",
  },
  // Enable request deduplication
  enableDeduplication: true,
  // Configure retry behavior
  retry: {
    count: 3,
    delay: 1000,
    condition: (error) => error.status >= 500,
  },
  // Configure caching
  cache: {
    ttl: 300000, // 5 minutes
    staleTime: 60000, // 1 minute
  },
});
```

### Using with Stores

```typescript
import { createFetchStore } from "lucent/core/createFetchStore";

const postStore = createFetchStore<Post[]>("posts", async () => {
  return postQuery({
    url: "/posts",
    method: "GET",
  });
});
```

### Request Interceptors

```typescript
const queryWithInterceptors = lucentQuery({
  baseUrl: "https://api.example.com",
  requestInterceptors: [
    async (args) => {
      // Add authentication token
      return {
        ...args,
        headers: {
          ...args.headers,
          Authorization: `Bearer ${getToken()}`,
        },
      };
    },
  ],
  responseInterceptors: [
    async (response) => {
      // Transform response data
      return {
        ...response,
        data: transformData(response.data),
      };
    },
  ],
});
```

### Error Handling

```typescript
const queryWithErrorHandling = lucentQuery({
  baseUrl: "https://api.example.com",
  errorInterceptors: [
    async (error) => {
      if (error.status === 401) {
        // Handle unauthorized
        await refreshToken();
        return true; // Retry the request
      }
      return false; // Don't retry
    },
  ],
});
```

### Query Builder Pattern

```typescript
const posts = await postQuery
  .get("/posts")
  .params({ userId: 1, limit: 10 })
  .headers({ "Custom-Header": "value" })
  .execute();

const createdPost = await postQuery
  .post("/posts")
  .body({ title: "New Post" })
  .execute();
```

### Best Practices for LucentQuery

1. **Use TypeScript Generics**: Always specify response types

   ```typescript
   const posts = await postQuery<Post[]>({ url: "/posts" });
   ```

2. **Configure Global Settings**: Set up common configurations once

   ```typescript
   const api = lucentQuery({
     baseUrl: "https://api.example.com",
     headers: { Authorization: `Bearer ${token}` },
   });
   ```

3. **Use Interceptors**: Handle common concerns like auth and error handling

   ```typescript
   const api = lucentQuery({
     requestInterceptors: [addAuthToken],
     responseInterceptors: [handleErrors],
   });
   ```

4. **Implement Caching**: Use built-in caching for better performance

   ```typescript
   const api = lucentQuery({
     cache: { ttl: 300000 },
   });
   ```

5. **Handle Loading States**: Use the loading state from the store

   ```typescript
   const { data, loading } = postStore();
   ```

6. **Use Query Builder**: For complex queries, use the builder pattern

   ```typescript
   const posts = await api
     .get("/posts")
     .params({ page: 1, limit: 10 })
     .execute();
   ```

7. **Implement Retry Logic**: Handle transient failures
   ```typescript
   const api = lucentQuery({
     retry: { count: 3, delay: 1000 },
   });
   ```

## Basic Usage

Create a store for your API resource:

```typescript
interface Post {
  id: number;
  title: string;
  body: string;
}

const postStore = createFetchStore<Post[]>("posts", async () => {
  const response = await fetch(`${apiConfig.baseUrl}/posts`);
  return response.json();
});
```

## CRUD Operations

### Create (POST)

```typescript
const createPost = async (post: Omit<Post, "id">) => {
  const response = await fetch(`${apiConfig.baseUrl}/posts`, {
    method: "POST",
    headers: apiConfig.headers,
    body: JSON.stringify(post),
  });
  return response.json();
};
```

### Read (GET)

```typescript
const getPost = async (id: number) => {
  const response = await fetch(`${apiConfig.baseUrl}/posts/${id}`, {
    headers: apiConfig.headers,
  });
  return response.json();
};
```

### Update (PUT/PATCH)

```typescript
const updatePost = async (id: number, post: Partial<Post>) => {
  const response = await fetch(`${apiConfig.baseUrl}/posts/${id}`, {
    method: "PATCH",
    headers: apiConfig.headers,
    body: JSON.stringify(post),
  });
  return response.json();
};
```

### Delete (DELETE)

```typescript
const deletePost = async (id: number) => {
  await fetch(`${apiConfig.baseUrl}/posts/${id}`, {
    method: "DELETE",
    headers: apiConfig.headers,
  });
};
```

## Query Parameters

Handle query parameters using URLSearchParams:

```typescript
const getPostsWithFilters = async (filters: {
  userId?: number;
  search?: string;
}) => {
  const params = new URLSearchParams();
  if (filters.userId) params.append("userId", filters.userId.toString());
  if (filters.search) params.append("search", filters.search);

  const response = await fetch(
    `${apiConfig.baseUrl}/posts?${params.toString()}`,
    {
      headers: apiConfig.headers,
    }
  );
  return response.json();
};
```

## Request Configuration

### Custom Headers

```typescript
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...apiConfig.headers,
      ...options.headers,
    },
  });
  return response.json();
};
```

### Request Interceptors

```typescript
const apiClient = {
  async request(url: string, options: RequestInit) {
    // Add timestamp to all requests
    const timestamp = Date.now();
    const headers = {
      ...options.headers,
      "X-Request-Timestamp": timestamp.toString(),
    };

    const response = await fetch(url, { ...options, headers });
    return response.json();
  },
};
```

## Error Handling

### Global Error Handler

```typescript
const handleApiError = (error: unknown) => {
  if (error instanceof Error) {
    console.error("API Error:", error.message);
    // Handle specific error types
    if (error.message.includes("401")) {
      // Handle unauthorized
    } else if (error.message.includes("404")) {
      // Handle not found
    }
  }
};
```

### Retry Logic

```typescript
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};
```

## Advanced Usage

### Pagination

```typescript
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

const getPaginatedPosts = async (page: number, limit: number) => {
  const response = await fetch(
    `${apiConfig.baseUrl}/posts?page=${page}&limit=${limit}`,
    { headers: apiConfig.headers }
  );
  return response.json() as Promise<PaginatedResponse<Post>>;
};
```

### Caching

```typescript
const createCachedStore = <T>(key: string, fetcher: () => Promise<T>) => {
  return createFetchStore<T>(key, async () => {
    const cached = localStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }
    const data = await fetcher();
    localStorage.setItem(key, JSON.stringify(data));
    return data;
  });
};
```

### Batch Requests

```typescript
const batchRequests = async (requests: Promise<any>[]) => {
  return Promise.all(requests);
};

// Usage
const fetchMultiplePosts = async (ids: number[]) => {
  const requests = ids.map((id) => getPost(id));
  return batchRequests(requests);
};
```

## Best Practices

1. **Error Handling**: Implement comprehensive error handling at all levels
2. **Type Safety**: Use TypeScript interfaces for API responses
3. **Request Interceptors**: Use interceptors for common request modifications
4. **Response Caching**: Implement appropriate caching strategies
5. **Rate Limiting**: Handle rate limits and implement backoff strategies
6. **Request Cancellation**: Support request cancellation for better UX
7. **Loading States**: Manage loading states effectively
8. **Data Transformation**: Transform API data to match your application needs

## Example Implementation

See the [AdvancedPostList](../src/components/AdvancedPostList.tsx) component for a complete example of REST API integration with Lucent.
