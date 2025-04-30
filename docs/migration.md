# Migration Guide

## From Redux

### 1. Store Structure

Redux:

```typescript
// Redux store
const initialState = {
  count: 0,
  todos: [],
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case "INCREMENT":
      return { ...state, count: state.count + 1 };
    case "ADD_TODO":
      return { ...state, todos: [...state.todos, action.payload] };
    default:
      return state;
  }
};
```

Lucent-Flow:

```typescript
// Lucent-Flow store
const useStore = create<State>((set) => ({
  count: 0,
  todos: [],
  increment: () => set((state) => ({ count: state.count + 1 })),
  addTodo: (todo: Todo) => set((state) => ({ todos: [...state.todos, todo] })),
}));
```

### 2. Actions

Redux:

```typescript
// Redux actions
const increment = () => ({ type: "INCREMENT" });
const addTodo = (todo) => ({ type: "ADD_TODO", payload: todo });
```

Lucent-Flow:

```typescript
// Lucent-Flow actions (built into store)
const { increment, addTodo } = useStore.getState();
```

### 3. Middleware

Redux:

```typescript
// Redux middleware
const logger = (store) => (next) => (action) => {
  console.log("dispatching", action);
  return next(action);
};
```

Lucent-Flow:

```typescript
// Lucent-Flow middleware
const useStore = create<State>()(
  logger(
    (set) => ({
      // ... state
    }),
    { enabled: true }
  )
);
```

## From MobX

### 1. State Management

MobX:

```typescript
// MobX store
class Store {
  @observable count = 0;
  @observable todos: Todo[] = [];

  @action
  increment() {
    this.count++;
  }

  @action
  addTodo(todo: Todo) {
    this.todos.push(todo);
  }
}
```

Lucent-Flow:

```typescript
// Lucent-Flow store
const useStore = create<State>((set) => ({
  count: 0,
  todos: [],
  increment: () => set((state) => ({ count: state.count + 1 })),
  addTodo: (todo: Todo) => set((state) => ({ todos: [...state.todos, todo] })),
}));
```

### 2. Computed Values

MobX:

```typescript
// MobX computed
class Store {
  @computed
  get completedTodos() {
    return this.todos.filter((todo) => todo.completed);
  }
}
```

Lucent-Flow:

```typescript
// Lucent-Flow selectors
const useStore = create<State>((set, get) => ({
  todos: [],
  getCompletedTodos: () => get().todos.filter((todo) => todo.completed),
}));
```

## From Context API

### 1. State Provider

Context API:

```typescript
// Context provider
const StateContext = createContext();

const StateProvider = ({ children }) => {
  const [state, setState] = useState(initialState);
  return (
    <StateContext.Provider value={{ state, setState }}>
      {children}
    </StateContext.Provider>
  );
};
```

Lucent-Flow:

```typescript
// Lucent-Flow store
const useStore = create<State>((set) => ({
  // ... state
}));

// Usage in components
const Component = () => {
  const state = useStore();
  return <div>{state.count}</div>;
};
```

### 2. State Updates

Context API:

```typescript
// Context updates
const updateState = (newState) => {
  setState((prev) => ({ ...prev, ...newState }));
};
```

Lucent-Flow:

```typescript
// Lucent-Flow updates
const useStore = create<State>((set) => ({
  updateState: (newState) => set(newState),
}));
```

## From Apollo Client

### 1. Data Fetching

Apollo:

```typescript
// Apollo query
const { data, loading, error } = useQuery(GET_TODOS);
```

Lucent-Flow:

```typescript
// Lucent-Flow query
const useStore = create<State>((set) => ({
  todos: [],
  loading: false,
  error: null,
  fetchTodos: async () => {
    set({ loading: true });
    try {
      const { data } = await queryBuilder
        .setEndpoint("todos")
        .setMethod("GET")
        .execute();
      set({ todos: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));
```

### 2. Caching

Apollo:

```typescript
// Apollo cache
const cache = new InMemoryCache();
```

Lucent-Flow:

```typescript
// Lucent-Flow persistence
const useStore = create<State>()(
  persist(
    (set) => ({
      // ... state
    }),
    {
      name: "todos-store",
      storage: "localStorage",
    }
  )
);
```

## Common Migration Patterns

### 1. State Migration

```typescript
// Before migration
const oldState = {
  user: {
    name: "John",
    preferences: {
      theme: "dark",
      notifications: true,
    },
  },
};

// After migration
const newState = {
  user: {
    name: "John",
    preferences: {
      theme: "dark",
      notifications: true,
    },
  },
  // Add new features
  version: 1,
  lastUpdated: new Date(),
};
```

### 2. Action Migration

```typescript
// Before migration
const oldActions = {
  setUser: (user) => dispatch({ type: "SET_USER", payload: user }),
  updatePreferences: (prefs) =>
    dispatch({ type: "UPDATE_PREFS", payload: prefs }),
};

// After migration
const newActions = {
  setUser: (user) => set({ user }),
  updatePreferences: (prefs) =>
    set((state) => ({
      user: {
        ...state.user,
        preferences: prefs,
      },
    })),
};
```

### 3. Middleware Migration

```typescript
// Before migration
const middleware = [logger, thunk, devTools];

// After migration
const useStore = create<State>()(
  logger(
    devtools(
      (set) => ({
        // ... state
      }),
      { name: "MyStore" }
    ),
    { enabled: true }
  )
);
```

## Migration Checklist

1. **Preparation**

   - [ ] Analyze current state structure
   - [ ] Identify dependencies
   - [ ] Plan migration strategy
   - [ ] Set up testing environment

2. **Implementation**

   - [ ] Create new store structure
   - [ ] Migrate actions
   - [ ] Set up middleware
   - [ ] Implement persistence

3. **Testing**

   - [ ] Unit tests
   - [ ] Integration tests
   - [ ] Performance tests
   - [ ] Edge cases

4. **Deployment**
   - [ ] Gradual rollout
   - [ ] Monitor performance
   - [ ] Gather feedback
   - [ ] Optimize as needed
