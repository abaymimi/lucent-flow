export interface GraphQLQuery {
  query: string;
  variables?: Record<string, any>;
}

export interface GraphQLMutation {
  mutation: string;
  variables?: Record<string, any>;
}

export interface GraphQLSubscription {
  subscription: string;
  variables?: Record<string, any>;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: Record<string, any>;
  }>;
}

export interface GraphQLCacheConfig {
  ttl?: number;
  tags?: string[];
  version?: string;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  revalidateInterval?: number;
  cacheKey?: (query: string, variables?: Record<string, any>) => string;
}

export interface GraphQLCacheEntry<T = any> {
  data: T;
  timestamp: number;
  tags: string[];
  metadata: {
    stale: boolean;
    version?: string;
    headers?: Record<string, string>;
    status?: number;
    etag?: string;
  };
}

export interface GraphQLCache {
  get<T>(key: string): GraphQLCacheEntry<T> | null;
  set<T>(key: string, entry: GraphQLCacheEntry<T>): void;
  delete(key: string): void;
  clear(): void;
  invalidateByTags(tags: string[]): void;
  getKeysByTags(tags: string[]): string[];
  getTagsByKey(key: string): string[];
}

export interface GraphQLClientConfig {
  url: string;
  wsUrl?: string;
  headers?: Record<string, string>;
  cache?: GraphQLCacheConfig;
}

export interface GraphQLStoreConfig<T> {
  query: {
    query: string;
    variables?: Record<string, any>;
  };
  cacheConfig?: {
    ttl?: number;
    tags?: string[];
    revalidateOnFocus?: boolean;
  };
  endpoint: string;
  wsEndpoint?: string;
  updateQuery?: (currentData: T, newData: T) => T;
} 