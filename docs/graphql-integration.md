# GraphQL Integration with Lucent

Lucent provides seamless integration with GraphQL through its built-in GraphQL client and store. This guide will walk you through setting up and using GraphQL in your Lucent application.

## Table of Contents

- [Setup](#setup)
- [Basic Usage](#basic-usage)
- [Queries](#queries)
- [Mutations](#mutations)
- [Subscriptions](#subscriptions)
- [Caching](#caching)
- [Error Handling](#error-handling)
- [Advanced Usage](#advanced-usage)

## Setup

First, configure your GraphQL client:

```typescript
import { GraphQLClient } from "lucent/utils/graphqlClient";

const client = new GraphQLClient(
  "YOUR_GRAPHQL_ENDPOINT",
  "YOUR_WS_ENDPOINT", // Optional, for subscriptions
  {
    ttl: 300000, // Cache TTL in milliseconds
    revalidateOnFocus: true,
    revalidateInterval: 60000,
  }
);
```

## Basic Usage

Create a GraphQL store using `createGraphQLStore`:

```typescript
import { createGraphQLStore } from "lucent/stores/graphqlStore";

const GET_POSTS_QUERY = `
  query GetPosts {
    posts {
      id
      title
    }
  }
`;

const postStore = createGraphQLStore<Post[]>({
  query: {
    query: GET_POSTS_QUERY,
    variables: {},
  },
});
```

## Queries

Use the store in your components:

```typescript
const MyComponent = () => {
  const { data, loading, error, fetchData } = postStore();

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.map((item) => (
        <div key={item.id}>{item.title}</div>
      ))}
    </div>
  );
};
```

## Mutations

Perform mutations using the `mutate` function:

```typescript
const CREATE_POST_MUTATION = `
  mutation CreatePost($title: String!) {
    createPost(title: $title) {
      id
      title
    }
  }
`;

const handleCreatePost = async () => {
  try {
    await mutate({
      query: CREATE_POST_MUTATION,
      variables: { title: "New Post" },
    });
    fetchData(); // Refresh the list
  } catch (err) {
    console.error("Mutation failed:", err);
  }
};
```

## Subscriptions

Set up real-time updates with subscriptions:

```typescript
const POST_SUBSCRIPTION = `
  subscription OnPostCreated {
    postCreated {
      id
      title
    }
  }
`;

const { subscribe } = postStore();

useEffect(() => {
  const unsubscribe = subscribe(POST_SUBSCRIPTION, (data) => {
    // Handle new post data
  });

  return () => unsubscribe();
}, []);
```

## Caching

Lucent provides built-in caching for GraphQL queries:

```typescript
const postStore = createGraphQLStore<Post[]>({
  query: {
    query: GET_POSTS_QUERY,
    variables: {},
  },
  cacheConfig: {
    ttl: 300000, // 5 minutes
    tags: ["posts"],
    revalidateOnFocus: true,
  },
});
```

## Error Handling

Handle errors at both the store and component level:

```typescript
// Store level
const postStore = createGraphQLStore<Post[]>({
  query: {
    query: GET_POSTS_QUERY,
    variables: {},
  },
  onError: (error) => {
    // Handle store-level errors
    console.error("Store error:", error);
  },
});

// Component level
const { error } = postStore();
if (error) {
  return <div>Error: {error.message}</div>;
}
```

## Advanced Usage

### Optimistic Updates

```typescript
const postStore = createGraphQLStore<Post[]>({
  query: {
    query: GET_POSTS_QUERY,
    variables: {},
  },
  optimisticResponse: (variables) => ({
    id: Date.now(),
    title: variables.title,
    // ... other fields
  }),
});
```

### Custom Headers

```typescript
const client = new GraphQLClient("YOUR_GRAPHQL_ENDPOINT", "YOUR_WS_ENDPOINT", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Custom-Header": "value",
  },
});
```

### Query Variables

```typescript
const postStore = createGraphQLStore<Post[]>({
  query: {
    query: GET_POSTS_QUERY,
    variables: {
      userId: 1,
      limit: 10,
    },
  },
});
```

## Best Practices

1. **Type Safety**: Always define interfaces for your GraphQL responses
2. **Error Boundaries**: Implement error boundaries for graceful error handling
3. **Loading States**: Show appropriate loading states during data fetching
4. **Cache Management**: Use appropriate cache TTLs and invalidation strategies
5. **Subscription Cleanup**: Always clean up subscriptions in useEffect cleanup
6. **Query Optimization**: Use fragments and variables for efficient queries

## Example Implementation

See the [GraphQLPostList](../src/components/GraphQLPostList.tsx) component for a complete example of GraphQL integration with Lucent.
