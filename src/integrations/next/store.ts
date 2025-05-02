import { create, StateCreator, StoreApi } from "zustand";

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
  createState: StateCreator<T, [], []>,
  config: NextConfig = {}
): StoreApi<T> {
  const { ssr = true, persist = false } = config;

  // Create the store
  const useStore = create<T & HydrationState>((set, get, store) => ({
    ...createState(set, get, store),
    _hasHydrated: false,
  }));

  // Add SSR support
  if (ssr) {
    const originalGetState = useStore.getState;
    useStore.getState = () => {
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
      useStore.setState({
        ...JSON.parse(storedState),
        _hasHydrated: true,
      });
    }
  }

  return useStore;
} 