# Practical Examples

## 1. Todo List with Filtering and Search

```typescript
// Types
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

interface TodoState {
  todos: Todo[];
  filter: "all" | "active" | "completed";
  searchQuery: string;
}

// Selectors
const todoSelectors = {
  filteredTodos: (state: TodoState) => {
    const filtered = state.todos.filter((todo) => {
      const matchesFilter =
        state.filter === "all" ||
        (state.filter === "active" && !todo.completed) ||
        (state.filter === "completed" && todo.completed);

      const matchesSearch = todo.text
        .toLowerCase()
        .includes(state.searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
    return filtered;
  },
  activeCount: (state: TodoState) =>
    state.todos.filter((todo) => !todo.completed).length,
  completedCount: (state: TodoState) =>
    state.todos.filter((todo) => todo.completed).length,
};

// Action Creators
const todoActions = {
  addTodo: (text: string) => (state: TodoState) => ({
    todos: [
      ...state.todos,
      {
        id: Date.now().toString(),
        text,
        completed: false,
        createdAt: new Date(),
      },
    ],
  }),
  toggleTodo: (id: string) => (state: TodoState) => ({
    todos: state.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ),
  }),
  setFilter: (filter: TodoState["filter"]) => () => ({ filter }),
  setSearchQuery: (query: string) => () => ({ searchQuery: query }),
};

// Create store
const useTodoStore = create<TodoState>()(
  immer((set) => ({
    todos: [],
    filter: "all",
    searchQuery: "",
    ...withActions(set, todoActions),
  }))
);

// Enhanced store
const useEnhancedTodoStore = withSelectors(useTodoStore, todoSelectors);
```

## 2. Shopping Cart with Price Calculations

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: Product[];
  discount: number;
}

// Selectors
const cartSelectors = {
  subtotal: (state: CartState) =>
    state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  total: (state: CartState) =>
    cartSelectors.subtotal(state) * (1 - state.discount),
  itemCount: (state: CartState) =>
    state.items.reduce((count, item) => count + item.quantity, 0),
};

// Action Creators
const cartActions = {
  addItem: (product: Omit<Product, "quantity">) => (state: CartState) => {
    const existingItem = state.items.find((item) => item.id === product.id);
    if (existingItem) {
      return {
        items: state.items.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      };
    }
    return {
      items: [...state.items, { ...product, quantity: 1 }],
    };
  },
  removeItem: (id: string) => (state: CartState) => ({
    items: state.items.filter((item) => item.id !== id),
  }),
  updateQuantity: (id: string, quantity: number) => (state: CartState) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, quantity } : item
    ),
  }),
  applyDiscount: (discount: number) => () => ({ discount }),
};

// Create store
const useCartStore = create<CartState>()(
  immer((set) => ({
    items: [],
    discount: 0,
    ...withActions(set, cartActions),
  }))
);

// Enhanced store
const useEnhancedCartStore = withSelectors(useCartStore, cartSelectors);
```

## 3. User Authentication with Profile Management

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Selectors
const authSelectors = {
  isAuthenticated: (state: AuthState) => !!state.user,
  isAdmin: (state: AuthState) => state.user?.role === "admin",
  authHeader: (state: AuthState) =>
    state.token ? `Bearer ${state.token}` : null,
};

// Action Creators
const authActions = {
  login:
    (credentials: { email: string; password: string }) =>
    async (state: AuthState) => {
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          body: JSON.stringify(credentials),
        });
        const data = await response.json();
        return {
          user: data.user,
          token: data.token,
          error: null,
        };
      } catch (error) {
        return {
          error: "Login failed",
          user: null,
          token: null,
        };
      }
    },
  logout: () => () => ({
    user: null,
    token: null,
    error: null,
  }),
  updateProfile: (updates: Partial<User>) => (state: AuthState) => ({
    user: state.user ? { ...state.user, ...updates } : null,
  }),
};

// Create store
const useAuthStore = create<AuthState>()(
  immer((set) => ({
    user: null,
    token: null,
    loading: false,
    error: null,
    ...withActions(set, authActions),
  }))
);

// Enhanced store
const useEnhancedAuthStore = withSelectors(useAuthStore, authSelectors);
```

## 4. Theme Management with Persistence

```typescript
interface ThemeState {
  mode: "light" | "dark";
  primaryColor: string;
  fontSize: number;
  customTheme: Record<string, string>;
}

// Selectors
const themeSelectors = {
  themeObject: (state: ThemeState) => ({
    mode: state.mode,
    colors: {
      primary: state.primaryColor,
      ...state.customTheme,
    },
    typography: {
      fontSize: state.fontSize,
    },
  }),
  isDarkMode: (state: ThemeState) => state.mode === "dark",
};

// Action Creators
const themeActions = {
  toggleMode: () => (state: ThemeState) => ({
    mode: state.mode === "light" ? "dark" : "light",
  }),
  setPrimaryColor: (color: string) => () => ({ primaryColor: color }),
  updateCustomTheme:
    (theme: Record<string, string>) => (state: ThemeState) => ({
      customTheme: { ...state.customTheme, ...theme },
    }),
  setFontSize: (size: number) => () => ({ fontSize: size }),
};

// Create store with persistence
const useThemeStore = create<ThemeState>()(
  persist(
    immer((set) => ({
      mode: "light",
      primaryColor: "#007bff",
      fontSize: 16,
      customTheme: {},
      ...withActions(set, themeActions),
    })),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Enhanced store
const useEnhancedThemeStore = withSelectors(useThemeStore, themeSelectors);
```

## Usage in Components

### Todo List Component

```typescript
function TodoList() {
  const {
    filteredTodos,
    addTodo,
    toggleTodo,
    setFilter,
    setSearchQuery,
    activeCount,
  } = useEnhancedTodoStore();

  return (
    <div>
      <input
        type="text"
        placeholder="Search todos..."
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <select onChange={(e) => setFilter(e.target.value as any)}>
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
      </select>
      <ul>
        {filteredTodos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            {todo.text}
          </li>
        ))}
      </ul>
      <p>Active todos: {activeCount}</p>
    </div>
  );
}
```

### Shopping Cart Component

```typescript
function ShoppingCart() {
  const {
    items,
    subtotal,
    total,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
  } = useEnhancedCartStore();

  return (
    <div>
      <h2>Shopping Cart ({itemCount} items)</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.name} - ${item.price}
            <input
              type="number"
              value={item.quantity}
              onChange={(e) =>
                updateQuantity(item.id, parseInt(e.target.value))
              }
            />
            <button onClick={() => removeItem(item.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <p>Subtotal: ${subtotal}</p>
      <p>Total: ${total}</p>
    </div>
  );
}
```

These examples demonstrate:

1. Complex state management with selectors
2. Type-safe action creators
3. Immer for immutable updates
4. Store splitting and combining
5. Practical use cases in components
