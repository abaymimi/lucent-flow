import { StoreApi, createStore } from "../../core/createStore";

export interface HydrationState {
  _hasHydrated: boolean;
}

export interface NextConfig {
  persist?: boolean;
  storageKey?: string;
  ssr?: boolean;
  suspense?: boolean;
}

export function createNextStore<T extends object>(
  createState: (set: StoreApi<T>['setState'], get: StoreApi<T>['getState']) => T,
  config: NextConfig = {}
): StoreApi<T & HydrationState> {
  const { ssr = true, persist = false } = config;

  // Create the store
  const store = createStore<T & HydrationState>((set, get) => {
    const baseState = createState(
      (partial) => set((state) => ({ ...state, ...(typeof partial === 'function' ? partial(state) : partial) })),
      get
    );
    return { ...baseState, _hasHydrated: false };
  });

  // Add SSR support
  if (ssr) {
    const originalGetState = store.getState;
    store.getState = () => {
      const state = originalGetState();
      if (typeof window === "undefined") {
        return state;
      }
      return {
        ...state,
        _hasHydrated: true,
      };
    };
  }

  // Add persistence support
  if (persist) {
    const storedState =
      typeof window !== "undefined"
        ? localStorage.getItem(config.storageKey || "store")
        : null;

    if (storedState) {
      store.setState({
        ...JSON.parse(storedState),
        _hasHydrated: true,
      });
    }
  }

  return store;
} 