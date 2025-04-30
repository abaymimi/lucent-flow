interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

export class RequestDeduplicator {
  private static instance: RequestDeduplicator;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): RequestDeduplicator {
    if (!RequestDeduplicator.instance) {
      RequestDeduplicator.instance = new RequestDeduplicator();
    }
    return RequestDeduplicator.instance;
  }

  private getRequestKey(args: any): string {
    return JSON.stringify(args);
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
    useCache: boolean = true
  ): Promise<T> {
    // Check cache first
    if (useCache) {
      const cached = this.cache.get(key);
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.data;
      }
    }

    // Check for pending request
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending.promise;
    }

    // Create new request
    const promise = requestFn().then((data) => {
      // Cache the result
      this.cache.set(key, { data, timestamp: Date.now() });
      // Remove from pending
      this.pendingRequests.delete(key);
      return data;
    });

    // Add to pending requests
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearPending(): void {
    this.pendingRequests.clear();
  }
} 