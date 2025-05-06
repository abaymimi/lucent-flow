import { createContextStore } from '../core/createStore';
// import { createPersistMiddleware } from '../middleware/persist';
import { nativeStorage } from '../utils/nativeStorage';
import { hydrate } from '../utils/hydrate';

interface CounterState {
  count: number;
}

// const persist = createPersistMiddleware('lucent_counter', nativeStorage);

const { StoreProvider, useStore, StoreContext } = createContextStore<CounterState>(() => ({
  count: 0,
}));

// Auto-hydrate state
hydrate('lucent_counter', nativeStorage, (state) => {
  const store = useStore((s) => s);
  store.count = (state as CounterState).count;
});

export { StoreProvider, useStore, StoreContext };
