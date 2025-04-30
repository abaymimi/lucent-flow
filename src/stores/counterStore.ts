import { createStore } from '../core/createStore';
import { createPersistMiddleware } from '../middleware/persist';
import { nativeStorage } from '../utils/nativeStorage';
import { hydrate } from '../utils/hydrate';

const persist = createPersistMiddleware('lucent_counter', nativeStorage);

export const counterStore = createStore({ count: 0 }, [persist]);

// Auto-hydrate state
hydrate('lucent_counter', nativeStorage, counterStore.setState);
