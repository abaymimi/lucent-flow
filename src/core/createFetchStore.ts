import { createStore } from './createStore';
import { FetchState, FetchOptions, FetchFunction, FetchResult } from '../types/fetch';

const DEFAULT_OPTIONS: FetchOptions = {
  cacheTime: 5 * 60 * 1000, // 5 minutes
  staleTime: 0,
  retry: 3,
  retryDelay: 1000,
};

export const createFetchStore = <T>(
  key: string,
  fetchFn: FetchFunction<T>,
  options: FetchOptions = {}
) => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const initialState: FetchState<T> = {
    data: null,
    status: 'idle',
    error: null,
    lastUpdated: null,
  };

  const store = createStore(initialState);

  const fetchData = async (force = false) => {
    const currentState = store.getState();
    const now = Date.now();

    // Check if we should use cached data
    if (
      !force &&
      currentState.data &&
      currentState.lastUpdated &&
      now - currentState.lastUpdated < mergedOptions.staleTime!
    ) {
      return;
    }

    // Set loading state
    store.setState({ ...currentState, status: 'loading' });

    let retries = 0;
    while (retries <= mergedOptions.retry!) {
      try {
        const data = await fetchFn();
        store.setState({
          data,
          status: 'success',
          error: null,
          lastUpdated: now,
        });
        return;
      } catch (error) {
        if (retries === mergedOptions.retry) {
          store.setState({
            ...currentState,
            status: 'error',
            error: error as Error,
          });
          throw error;
        }
        retries++;
        await new Promise((resolve) =>
          setTimeout(resolve, mergedOptions.retryDelay)
        );
      }
    }
  };

  const useFetch = (): FetchResult<T> => {
    const { state, setState } = store.useStore();

    const refetch = async () => {
      await fetchData(true);
    };

    return {
      data: state.data,
      isLoading: state.status === 'loading',
      isError: state.status === 'error',
      error: state.error,
      refetch,
    };
  };

  return {
    useFetch,
    fetchData,
    getState: store.getState,
  };
}; 