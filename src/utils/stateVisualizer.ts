import { StoreApi } from 'zustand';
import { create } from 'zustand';

export interface StateNode {
  id: string;
  name: string;
  value: any;
  dependencies: string[];
  size: number;
  lastUpdated: number;
}

export interface StateGraph {
  nodes: StateNode[];
  edges: { from: string; to: string }[];
}

export interface PerformanceMetrics {
  updateTime: number;
  memoryUsage: number;
  renderCount: number;
}

export interface StateTimeline {
  timestamp: number;
  state: any;
  action: string;
  performance: PerformanceMetrics;
}

export interface VisualizerConfig {
  maxHistory?: number;
  trackMemory?: boolean;
  trackPerformance?: boolean;
}

export class StateVisualizer {
  private store: StoreApi<any>;
  private history: StateTimeline[] = [];
  private graph: StateGraph = { nodes: [], edges: [] };
  private config: VisualizerConfig;
  private performanceObserver: PerformanceObserver | null = null;

  constructor(store: StoreApi<any>, config: VisualizerConfig = {}) {
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
    this.store.subscribe((state, prevState) => {
      this.updateGraph(state, prevState);
      this.addToTimeline(state, prevState);
    });
  }

  private updateGraph(state: any, prevState: any) {
    const nodes: StateNode[] = [];
    const edges: { from: string; to: string }[] = [];

    // Analyze state structure
    const analyzeState = (obj: any, path: string = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key;
        const node: StateNode = {
          id: currentPath,
          name: key,
          value,
          dependencies: [],
          size: this.calculateSize(value),
          lastUpdated: Date.now(),
        };

        nodes.push(node);

        if (typeof value === 'object' && value !== null) {
          analyzeState(value, currentPath);
        }
      });
    };

    analyzeState(state);
    this.graph = { nodes, edges };
  }

  private addToTimeline(state: any, prevState: any) {
    const timelineEntry: StateTimeline = {
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
      const memory = (performance as any).memory;
      if (memory) {
        console.log('Memory usage:', {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        });
      }
    }
  }

  private calculateSize(obj: any): number {
    return new Blob([JSON.stringify(obj)]).size;
  }

  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const memory = (performance as any).memory;
      return memory ? memory.usedJSHeapSize : 0;
    }
    return 0;
  }

  private getActionName(state: any, prevState: any): string {
    // Implement logic to determine the action name
    return 'state_update';
  }

  // Public API
  public getGraph(): StateGraph {
    return this.graph;
  }

  public getTimeline(): StateTimeline[] {
    return this.history;
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    return {
      updateTime: performance.now(),
      memoryUsage: this.getMemoryUsage(),
      renderCount: this.history.length,
    };
  }

  public replayTimeline(startTime?: number, endTime?: number) {
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
  const visualizer = new StateVisualizer(store, config);

  return create<T>((set, get) => ({
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