import { createStore, StoreApi } from './createStore';
import { applyMiddleware } from './middleware';
import { devtoolsMiddleware, loggerMiddleware, undoRedoMiddleware } from './middlewareAdapter';

interface ConfigureStoreOptions<T extends object> {
  initialState: T;
  middleware?: Array<(store: StoreApi<T>) => (next: StoreApi<T>['setState']) => StoreApi<T>['setState']>;
  devTools?: boolean;
  name?: string;
  maxHistory?: number;
}

export function configureStore<T extends object>({
  initialState,
  middleware = [],
  devTools: enableDevTools = true,
//   name = 'Lucent Store',
//   maxHistory = 100,
}: ConfigureStoreOptions<T>) {
  const store = createStore<T>((set, get) => ({
    ...initialState,
    setState: set,
    getState: get,
  }));

  const middlewares = [...middleware];
  
  if (enableDevTools) {
    middlewares.push(devtoolsMiddleware);
  }
  
  middlewares.push(loggerMiddleware);
  middlewares.push(undoRedoMiddleware);

  return applyMiddleware(store, middlewares);
} 