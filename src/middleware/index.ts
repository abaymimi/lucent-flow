import { StoreApi } from '../core/createStore';

export type Middleware = <T extends object>(
  fn: (set: StoreApi<T>['setState'], get: StoreApi<T>['getState']) => T
) => (set: StoreApi<T>['setState'], get: StoreApi<T>['getState']) => T;

export { devtools } from './devtools';
export { logger } from './logger';
export { undoRedo } from './undoRedo'; 