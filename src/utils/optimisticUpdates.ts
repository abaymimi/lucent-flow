interface OptimisticUpdate<T> {
  id: string;
  data: T;
  rollback: () => void;
  timestamp: number;
}

export class OptimisticUpdates {
  private static instance: OptimisticUpdates;
  private updates: Map<string, OptimisticUpdate<any>> = new Map();
  private readonly UPDATE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): OptimisticUpdates {
    if (!OptimisticUpdates.instance) {
      OptimisticUpdates.instance = new OptimisticUpdates();
    }
    return OptimisticUpdates.instance;
  }

  addUpdate<T>(id: string, data: T, rollback: () => void): void {
    this.updates.set(id, {
      id,
      data,
      rollback,
      timestamp: Date.now(),
    });

    // Clean up old updates
    this.cleanup();
  }

  getUpdate<T>(id: string): T | undefined {
    const update = this.updates.get(id);
    if (update && this.isUpdateValid(update.timestamp)) {
      return update.data as T;
    }
    return undefined;
  }

  removeUpdate(id: string): void {
    this.updates.delete(id);
  }

  rollbackUpdate(id: string): void {
    const update = this.updates.get(id);
    if (update) {
      update.rollback();
      this.removeUpdate(id);
    }
  }

  private isUpdateValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.UPDATE_TTL;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, update] of this.updates.entries()) {
      if (!this.isUpdateValid(update.timestamp)) {
        this.updates.delete(id);
      }
    }
  }
} 