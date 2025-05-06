import { createContext } from 'react';
import { StoreApi } from './createStore';

export const StoreContext = createContext<StoreApi<unknown> | null>(null);

export type { StoreApi }; 