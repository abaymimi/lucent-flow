import { create } from 'zustand';
import { GraphQLClient } from '../utils/graphqlClient';
import { GraphQLStoreConfig, GraphQLResponse } from '../types/graphql';

interface GraphQLStoreState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  fetchData: () => Promise<void>;
  mutate: (mutation: any) => Promise<void>;
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
        set({ loading: true, error: null });
        const response = await client.query<T>(config.query.query, config.query.variables) as GraphQLResponse<T>;
        
        if (response.errors) {
          throw new Error(response.errors[0].message);
        }

        set({
          data: response.data,
          loading: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error : new Error('Unknown error occurred'),
          loading: false,
        });
      }
    },

    mutate: async (mutation) => {
      try {
        set({ loading: true, error: null });
        const response = await client.mutate<T>(mutation) as GraphQLResponse<T>;
        
        if (response.errors) {
          throw new Error(response.errors[0].message);
        }

        if (config.updateQuery && response.data) {
          const currentData = get().data;
          if (currentData) {
            set({
              data: config.updateQuery(currentData, response.data),
              loading: false,
            });
          }
        } else {
          set({
            data: response.data,
            loading: false,
          });
        }
      } catch (error) {
        set({
          error: error instanceof Error ? error : new Error('Unknown error occurred'),
          loading: false,
        });
      }
    },

    subscribe: (callback) => {
      return client.subscribe<T>(config.query.query, callback, config.query.variables);
    },
  }));
}; 