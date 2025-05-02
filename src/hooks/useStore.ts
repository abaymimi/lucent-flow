import { useEffect } from 'react';

interface StoreState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export function useStore<T>(store: {
  useFetch: () => { data: T | null; isLoading: boolean; error: Error | null };
  fetchData: (force?: boolean) => Promise<void>;
}): StoreState<T> {
  const { data, isLoading, error } = store.useFetch();

  useEffect(() => {
    store.fetchData();
  }, [store]);

  return { data, isLoading, error };
}
