import { GraphQLCacheEntry } from '../types/graphql';

export class GraphQLCacheImpl {
  private cache: Map<string, GraphQLCacheEntry<any>>;
  private ttl: number;
  private version: number;

  constructor(ttl: number = 0) {
    this.cache = new Map();
    this.ttl = ttl;
    this.version = 1;
  }

  get<T>(key: string): GraphQLCacheEntry<T> | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry as GraphQLCacheEntry<T>;
  }

  set<T>(key: string, entry: GraphQLCacheEntry<T>): void {
    this.cache.set(key, entry);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getAll(): IterableIterator<[string, GraphQLCacheEntry<any>]> {
    return this.cache.entries();
  }

  invalidate(tags?: string[]): void {
    if (!tags) {
      this.clear();
      return;
    }

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
      }
    }
  }

  getVersion(): number {
    return this.version;
  }

  incrementVersion(): void {
    this.version++;
  }
} 