import { createStore as create } from '../core/createStore';
import { GraphQLClient } from '../utils/graphqlClient';
import { GraphQLStoreConfig, GraphQLResponse } from '../types/graphql';

interface GraphQLStoreState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  fetchData: () => Promise<void>;
  mutate: (mutation: string, variables?: Record<string, unknown>) => Promise<void>;
  subscribe: (callback: (data: T) => void) => () => void;
}

export const createGraphQLStore = <T>(config: GraphQLStoreConfig<T>) => {
  const client = new GraphQLClient(
    config.endpoint,
    config.wsEndpoint || '',
    config.cacheConfig?.ttl
  );

  return create<GraphQLStoreState<T>>((set, get) => ({
    data: null,
    loading: false,
    error: null,

    fetchData: async () => {
      try {
        set((state) => ({ ...state, loading: true, error: null }));
        const response = await client.query<T>(config.query.query, config.query.variables) as GraphQLResponse<T>;
        
        if (response.errors) {
          throw new Error(response.errors[0].message);
        }

        set((state) => ({
          ...state,
          data: response.data ?? null,
          loading: false,
        }));
      } catch (error) {
        set((state) => ({
          ...state,
          error: error instanceof Error ? error : new Error('Unknown error occurred'),
          loading: false,
        }));
      }
    },

    mutate: async (mutation, variables) => {
      try {
        set((state) => ({ ...state, loading: true, error: null }));
        const response = await client.mutate<T>(mutation, variables) as GraphQLResponse<T>;
        
        if (response.errors) {
          throw new Error(response.errors[0].message);
        }

        if (config.updateQuery && response.data) {
          const currentData = get().data;
          if (currentData) {
            set((state) => ({
              ...state,
              data: config.updateQuery!(currentData, response.data!),
              loading: false,
            }));
          }
        } else {
          set((state) => ({
            ...state,
            data: response.data ?? null,
            loading: false,
          }));
        }
      } catch (error) {
        set((state) => ({
          ...state,
          error: error instanceof Error ? error : new Error('Unknown error occurred'),
          loading: false,
        }));
      }
    },

    subscribe: (callback) => {
      return client.subscribe<T>(config.query.query, callback, config.query.variables);
    },
  }));
}; 