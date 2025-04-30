# Data Fetching with Lucent

Lucent provides a powerful data fetching layer with features like caching, automatic retries, and interceptors.

## Core Features

### `lucentQuery`

A flexible query builder that wraps the native fetch API with additional features:

```typescript
const query = lucentQuery({
  baseUrl: "https://api.example.com",
  prepareHeaders: (headers) => {
    headers.set("Authorization", "Bearer token");
    return headers;
  },
  timeout: 30000,
  requestInterceptors: [],
  responseInterceptors: [],
  errorInterceptors: [],
});
```

### Configuration Options

- `baseUrl`: Base URL for all requests
- `prepareHeaders`: Function to modify headers before each request
- `fetchFn`: Custom fetch implementation
- `timeout`: Request timeout in milliseconds
- `requestInterceptors`: Array of request interceptors
- `responseInterceptors`: Array of response interceptors
- `errorInterceptors`: Array of error interceptors

### Interceptors

Interceptors allow you to modify requests and responses:

```typescript
// Request interceptor
const requestInterceptor = async (args) => {
  // Add auth token
  return {
    ...args,
    headers: {
      ...args.headers,
      Authorization: `Bearer ${token}`,
    },
  };
};

// Response interceptor
const responseInterceptor = async (result) => {
  // Add timestamp
  return {
    ...result,
    meta: {
      ...result.meta,
      timestamp: Date.now(),
    },
  };
};

// Error interceptor
const errorInterceptor = async (error) => {
  // Handle specific errors
  if (error.message.includes("401")) {
    window.location.href = "/login";
  }
  return error;
};
```

### Making Requests

```typescript
const result = await query({
  url: "/endpoint",
  method: "POST",
  body: { data: "value" },
  params: { page: 1 },
  headers: { "Custom-Header": "value" },
  responseHandler: "json",
  validateStatus: (status) => status >= 200 && status < 300,
});
```

### Response Handling

The response includes:

- `data`: The parsed response data
- `meta`: Request and response metadata

## Example Stores

### User Store with Authentication

```typescript
const authQuery = lucentQuery({
  baseUrl: "https://api.example.com",
  requestInterceptors: [
    async (args) => ({
      ...args,
      headers: {
        ...args.headers,
        Authorization: `Bearer ${token}`,
      },
    }),
  ],
});

const fetchUsers = async () => {
  const result = await authQuery({
    url: "/users",
    method: "GET",
  });
  return result.data;
};
```

### Post Store with Pagination

```typescript
const postQuery = lucentQuery({
  baseUrl: "https://api.example.com",
  responseInterceptors: [
    async (result) => ({
      ...result,
      meta: {
        ...result.meta,
        timestamp: Date.now(),
      },
    }),
  ],
});

const fetchPosts = async ({ page = 1, limit = 10 }) => {
  const result = await postQuery({
    url: "/posts",
    method: "GET",
    params: { _page: page, _limit: limit },
  });
  return result.data;
};
```

## Best Practices

1. **Error Handling**

   - Use error interceptors for global error handling
   - Implement retry logic for transient errors
   - Provide meaningful error messages

2. **Caching**

   - Configure appropriate stale and cache times
   - Use cache invalidation when data changes
   - Consider using persistent storage for important data

3. **Performance**

   - Use request deduplication
   - Implement proper loading states
   - Consider implementing optimistic updates

4. **Security**
   - Always use HTTPS
   - Implement proper authentication
   - Sanitize user input
   - Handle sensitive data appropriately
