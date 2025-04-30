export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

export interface FetchState<T> {
  data: T | null;
  status: FetchStatus;
  error: Error | null;
  lastUpdated: number | null;
}

export interface FetchOptions {
  cacheTime?: number; // Time in milliseconds to cache the data
  staleTime?: number; // Time in milliseconds before data is considered stale
  retry?: number; // Number of retry attempts
  retryDelay?: number; // Delay between retries in milliseconds
}

export type FetchFunction<T> = () => Promise<T>;

export interface FetchResult<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} 