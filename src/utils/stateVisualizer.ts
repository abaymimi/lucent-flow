import { StoreApi, createStore as create } from "../core/createStore";

;

export interface StateNode<T = unknown> {
  id: string;
  name: string;
  value: T;
  dependencies: string[];
  size: number;
  lastUpdated: number;
}

export interface StateGraph<T = unknown> {
  nodes: StateNode<T>[];
  edges: { from: string; to: string }[];
}

export interface PerformanceMetrics {
  updateTime: number;
  memoryUsage: number;
  renderCount: number;
}

export interface StateTimeline<T = unknown> {
  timestamp: number;
  state: T;
  action: string;
  performance: PerformanceMetrics;
}

export interface VisualizerConfig {
  maxHistory?: number;
  trackMemory?: boolean;
  trackPerformance?: boolean;
}

export class StateVisualizer<T extends object> {
  private store: StoreApi<T>;
  private history: StateTimeline<T>[] = [];
  private graph: StateGraph<T> = { nodes: [], edges: [] };
  private config: VisualizerConfig;
  private performanceObserver: PerformanceObserver | null = null;

  constructor(store: StoreApi<T>, config: VisualizerConfig = {}) {
    this.store = store;
    this.config = {
      maxHistory: 100,
      trackMemory: true,
      trackPerformance: true,
      ...config,
    };

    this.initialize();
  }

  private initialize() {
    // Initialize performance tracking
    if (this.config.trackPerformance && typeof window !== 'undefined') {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.trackPerformance(entry);
        });
      });
      this.performanceObserver.observe({ entryTypes: ['measure'] });
    }

    // Initialize memory tracking
    if (this.config.trackMemory && typeof window !== 'undefined') {
      setInterval(() => this.trackMemory(), 1000);
    }

    // Subscribe to store changes
    let prevState = this.store.getState();
    this.store.subscribe(() => {
      const state = this.store.getState();
      this.updateGraph(state);
      this.addToTimeline(state, prevState);
      prevState = state;
    });
  }

  private updateGraph(state: T) {
    const nodes: StateNode<T>[] = [];
    const edges: { from: string; to: string }[] = [];

    // Analyze state structure
    const analyzeState = (obj: Record<string, unknown>, path: string = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key;
        const node: StateNode<T> = {
          id: currentPath,
          name: key,
          value: value as T,
          dependencies: [],
          size: this.calculateSize(value as T),
          lastUpdated: Date.now(),
        };

        nodes.push(node);

        if (typeof value === 'object' && value !== null) {
          analyzeState(value as Record<string, unknown>, currentPath);
        }
      });
    };

    analyzeState(state as Record<string, unknown>);
    this.graph = { nodes, edges };
  }

  private addToTimeline(state: T, prevState: T) {
    const timelineEntry: StateTimeline<T> = {
      timestamp: Date.now(),
      state,
      action: this.getActionName(state, prevState),
      performance: {
        updateTime: performance.now(),
        memoryUsage: this.getMemoryUsage(),
        renderCount: this.history.length + 1,
      },
    };

    this.history.push(timelineEntry);
    if (this.history.length > (this.config.maxHistory || 100)) {
      this.history.shift();
    }
  }

  private trackPerformance(entry: PerformanceEntry) {
    // Track performance metrics
    console.log('Performance entry:', entry);
  }

  private trackMemory() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const memory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      if (memory) {
        console.log('Memory usage:', {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        });
      }
    }
  }

  private calculateSize(obj: unknown): number {
    return new Blob([JSON.stringify(obj)]).size;
  }

  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const memory = (performance as { memory?: { usedJSHeapSize: number } }).memory;
      return memory ? memory.usedJSHeapSize : 0;
    }
    return 0;
  }

  private getActionName(state: T, prevState: T): string {
    // Compare state changes to determine action name
    const stateChanges = Object.keys(state).filter(key => 
      JSON.stringify(state[key as keyof T]) !== JSON.stringify(prevState[key as keyof T])
    );
    return stateChanges.length > 0 ? `update_${stateChanges.join('_')}` : 'state_update';
  }

  // Public API
  public getGraph(): StateGraph<T> {
    return this.graph;
  }

  public getTimeline(): StateTimeline<T>[] {
    return this.history;
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    return {
      updateTime: performance.now(),
      memoryUsage: this.getMemoryUsage(),
      renderCount: this.history.length,
    };
  }

  public replayTimeline(startTime?: number, endTime?: number): StateTimeline<T>[] {
    const filteredHistory = this.history.filter(entry => {
      if (startTime && entry.timestamp < startTime) return false;
      if (endTime && entry.timestamp > endTime) return false;
      return true;
    });

    return filteredHistory;
  }

  public cleanup() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// Create a visualization store
export const createVisualizationStore = <T extends object>(
  store: StoreApi<T>,
  config?: VisualizerConfig
) => {
  const visualizer = new StateVisualizer<T>(store, config);

  return create<T>(() => ({
    ...store.getState(),
    visualize: {
      getGraph: () => visualizer.getGraph(),
      getTimeline: () => visualizer.getTimeline(),
      getPerformance: () => visualizer.getPerformanceMetrics(),
      replay: (startTime?: number, endTime?: number) => 
        visualizer.replayTimeline(startTime, endTime),
    },
  }));
}; 