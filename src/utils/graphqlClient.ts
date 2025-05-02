import {  GraphQLCacheEntry } from '../types/graphql';
import { GraphQLCacheImpl } from './graphqlCache';

// Define type for GraphQL variables
export type GraphQLVariables = Record<string, unknown>;

export class GraphQLClient {
  private endpoint: string;
  private wsEndpoint: string;
  private cache: GraphQLCacheImpl;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(
    endpoint: string,
    wsEndpoint: string,
    cacheTtl: number = 0
  ) {
    this.endpoint = endpoint;
    this.wsEndpoint = wsEndpoint;
    this.cache = new GraphQLCacheImpl(cacheTtl);
    this.setupWebSocket();
    this.setupCacheRevalidation();
  }

  private setupWebSocket(): void {
    this.ws = new WebSocket(this.wsEndpoint);
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
    };
    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.setupWebSocket();
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    };
  }

  private setupCacheRevalidation(): void {
    // Revalidate cache on focus
    window.addEventListener('focus', () => {
      this.cache.invalidate();
    });

    // Revalidate cache on reconnect
    if (this.ws) {
      this.ws.onopen = () => {
        this.cache.invalidate();
      };
    }
  }

  async query<T>(query: string, variables?: GraphQLVariables): Promise<T> {
    const cacheKey = this.generateCacheKey(query, variables);
    const cached = this.cache.get<T>(cacheKey);

    if (cached) {
      return cached.data;
    }

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL query failed: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    const entry: GraphQLCacheEntry<T> = {
      data: result.data,
      timestamp: Date.now(),
      tags: [],
      metadata: {
        stale: false,
        version: this.cache.getVersion().toString(),
        headers: {},
        status: response.status,
      }
    };

    this.cache.set(cacheKey, entry);
    return result.data;
  }

  async mutate<T>(mutation: string, variables?: GraphQLVariables): Promise<T> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL mutation failed: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    // Invalidate cache after mutation
    this.cache.invalidate();
    return result.data;
  }

  subscribe<T>(subscription: string, callback: (data: T) => void, variables?: GraphQLVariables): () => void {
    if (!this.ws) {
      throw new Error('WebSocket connection not established');
    }

    const id = Math.random().toString(36).substring(7);
    const message = {
      id,
      type: 'start',
      payload: {
        query: subscription,
        variables,
      },
    };

    this.ws.send(JSON.stringify(message));

    const messageHandler = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.id === id && data.type === 'data') {
        callback(data.payload.data);
      }
    };

    this.ws.addEventListener('message', messageHandler);

    return () => {
      this.ws?.removeEventListener('message', messageHandler);
      this.ws?.send(JSON.stringify({
        id,
        type: 'stop',
      }));
    };
  }

  private generateCacheKey(query: string, variables?: GraphQLVariables): string {
    return JSON.stringify({ query, variables });
  }
} 