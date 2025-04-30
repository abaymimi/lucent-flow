import { StoreApi, StateCreator } from 'zustand';
import { create } from 'zustand';

/**
 * Testing middleware that records all state changes
 */
export const testMiddleware = <T extends object>(
  store: StoreApi<T>,
  options?: {
    onStateChange?: (state: T, action: string) => void;
    recordHistory?: boolean;
  }
) => {
  const { onStateChange, recordHistory = true } = options || {};
  const history: { state: T; action: string; timestamp: number }[] = [];

  return (set: StoreApi<T>['setState']) => {
    return (partial: T | Partial<T> | ((state: T) => T | Partial<T>), action?: string | boolean) => {
      const nextState = typeof partial === 'function' 
        ? (partial as (state: T) => T | Partial<T>)(store.getState())
        : partial;

      if (recordHistory) {
        history.push({
          state: nextState as T,
          action: typeof action === 'string' ? action : 'unknown',
          timestamp: Date.now(),
        });
      }

      if (onStateChange) {
        onStateChange(nextState as T, typeof action === 'string' ? action : 'unknown');
      }

      set(nextState, false);
    };
  };
};

/**
 * Creates a mock store for testing
 */
export const createMockStore = <T extends object>(
  initialState: T,
  options?: {
    middleware?: (store: StoreApi<T>) => (set: StoreApi<T>['setState']) => StoreApi<T>['setState'];
  }
) => {
  const store = create<T>()((set, get) => ({
    ...initialState,
  }));

  if (options?.middleware) {
    const middleware = options.middleware(store);
    const originalSet = store.setState;
    store.setState = middleware(originalSet);
  }

  return store;
};

/**
 * Store snapshot utilities
 */
export class StoreSnapshot<T extends object> {
  private snapshots: { state: T; timestamp: number }[] = [];
  private maxSnapshots: number;

  constructor(private store: StoreApi<T>, maxSnapshots = 10) {
    this.maxSnapshots = maxSnapshots;
  }

  takeSnapshot() {
    const state = this.store.getState();
    this.snapshots.push({ state, timestamp: Date.now() });
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  getSnapshots() {
    return this.snapshots;
  }

  getLatestSnapshot() {
    return this.snapshots[this.snapshots.length - 1];
  }

  clearSnapshots() {
    this.snapshots = [];
  }

  compareSnapshots(index1: number, index2: number) {
    const snapshot1 = this.snapshots[index1];
    const snapshot2 = this.snapshots[index2];
    if (!snapshot1 || !snapshot2) return null;

    const changes: { [K in keyof T]?: { from: T[K]; to: T[K] } } = {};
    Object.keys(snapshot1.state).forEach((key) => {
      const k = key as keyof T;
      if (snapshot1.state[k] !== snapshot2.state[k]) {
        changes[k] = {
          from: snapshot1.state[k],
          to: snapshot2.state[k],
        };
      }
    });

    return {
      changes,
      timeDiff: snapshot2.timestamp - snapshot1.timestamp,
    };
  }
}

/**
 * Integration testing helpers
 */
export class TestHelper<T extends object> {
  private store: StoreApi<T>;
  private snapshot: StoreSnapshot<T>;
  private stateChanges: { state: T; action: string }[] = [];

  constructor(store: StoreApi<T>) {
    this.store = store;
    this.snapshot = new StoreSnapshot(store);
  }

  /**
   * Records state changes during a test
   */
  recordStateChanges() {
    const originalSet = this.store.setState;
    this.store.setState = (partial, action) => {
      const nextState = typeof partial === 'function'
        ? (partial as (state: T) => T | Partial<T>)(this.store.getState())
        : partial;

      this.stateChanges.push({
        state: nextState as T,
        action: typeof action === 'string' ? action : 'unknown',
      });

      originalSet(partial, false);
    };
  }

  /**
   * Gets recorded state changes
   */
  getStateChanges() {
    return this.stateChanges;
  }

  /**
   * Clears recorded state changes
   */
  clearStateChanges() {
    this.stateChanges = [];
  }

  /**
   * Clears snapshots
   */
  clearSnapshots() {
    this.snapshot.clearSnapshots();
  }

  /**
   * Takes a snapshot of current state
   */
  takeSnapshot() {
    this.snapshot.takeSnapshot();
  }

  /**
   * Gets all snapshots
   */
  getSnapshots() {
    return this.snapshot.getSnapshots();
  }

  /**
   * Asserts that state matches expected value
   */
  assertState(expected: Partial<T>) {
    const currentState = this.store.getState();
    const mismatches: { key: keyof T; expected: any; actual: any }[] = [];

    Object.entries(expected).forEach(([key, value]) => {
      const k = key as keyof T;
      if (currentState[k] !== value) {
        mismatches.push({
          key: k,
          expected: value,
          actual: currentState[k],
        });
      }
    });

    if (mismatches.length > 0) {
      throw new Error(
        `State assertion failed:\n${mismatches
          .map((m) => `${String(m.key)}: expected ${m.expected}, got ${m.actual}`)
          .join('\n')}`
      );
    }
  }

  /**
   * Asserts that an action was called
   */
  assertActionCalled(actionName: string) {
    const actionCalled = this.stateChanges.some(
      (change) => change.action === actionName
    );
    if (!actionCalled) {
      throw new Error(`Expected action "${actionName}" to be called`);
    }
  }

  /**
   * Asserts that state changed in a specific way
   */
  assertStateChange(
    predicate: (state: T) => boolean,
    message = 'State change assertion failed'
  ) {
    const stateChanged = this.stateChanges.some((change) =>
      predicate(change.state)
    );
    if (!stateChanged) {
      throw new Error(message);
    }
  }

  /**
   * Compares two snapshots by their indices
   */
  compareSnapshots(index1: number, index2: number) {
    return this.snapshot.compareSnapshots(index1, index2);
  }
}

/**
 * Example usage:
 * 
 * ```typescript
 * // Create a test helper
 * const helper = new TestHelper(useStore);
 * 
 * // Record state changes
 * helper.recordStateChanges();
 * 
 * // Take a snapshot before changes
 * helper.takeSnapshot();
 * 
 * // Perform actions
 * store.getState().increment();
 * 
 * // Take a snapshot after changes
 * helper.takeSnapshot();
 * 
 * // Assert state
 * helper.assertState({ count: 1 });
 * 
 * // Assert action was called
 * helper.assertActionCalled('increment');
 * 
 * // Get state changes
 * const changes = helper.getStateChanges();
 * 
 * // Get snapshots
 * const snapshots = helper.getSnapshots();
 * ```
 */ 