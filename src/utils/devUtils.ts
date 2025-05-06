import { StoreApi } from '../core/createStore';

/**
 * Type validation utilities for development mode
 * Provides runtime type checking and validation
 */
export const validateType = <T>(value: unknown, type: string): T => {
  if (process.env.NODE_ENV === 'development') {
    if (value === undefined || value === null) {
      throw new Error(`Invalid ${type}: value is ${value}`);
    }
    // Add more type validation logic here
  }
  return value as T;
};

/**
 * Development mode configuration interface
 * Configures various development features and warnings
 */
export interface DevConfig {
  warnOnLargeState?: boolean;
  warnOnSlowUpdates?: boolean;
  warnOnUnusedSelectors?: boolean;
  enableTimeTravel?: boolean;
  enableStateSnapshots?: boolean;
  enableActionReplay?: boolean;
  enablePerformanceMonitoring?: boolean;
  validateTypes?: boolean;
  maxHistorySize?: number;
  performanceThreshold?: number;
  stateSizeThreshold?: number;
}

/**
 * Debugging utilities interface
 * Provides methods for debugging and monitoring state
 */
export interface DebugUtils<T> {
  logState: () => void;
  logActions: () => void;
  logPerformance: () => void;
  logTypeErrors: () => void;
  takeSnapshot: () => T;
  replayAction: (action: string) => void;
  getStateHistory: () => Array<{ type: string; state: T; timestamp: number }>;
  clearHistory: () => void;
  getPerformanceMetrics: () => {
    averageUpdateTime: number;
    totalUpdates: number;
    slowUpdates: number;
  };
}

/**
 * Enhanced error interface with additional context
 */
export interface EnhancedError extends Error {
  context?: Record<string, unknown>;
  timestamp?: number;
  stack?: string;
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  averageUpdateTime: number;
  totalUpdates: number;
  slowUpdates: number;
  lastUpdateTime: number;
  stateSize: number;
}

/**
 * Creates enhanced error with context and timestamp
 */
const createEnhancedError = (message: string, context?: Record<string, unknown>): EnhancedError => {
  const error = new Error(message) as EnhancedError;
  error.context = context;
  error.timestamp = Date.now();
  return error;
};

/**
 * Development middleware factory
 * Creates a middleware with enhanced debugging and monitoring capabilities
 */
export const createDevMiddleware = <T extends object>(
  config: DevConfig = {}
) => {
  return (store: StoreApi<T>) => {
    const { getState, setState } = store;
    let lastUpdateTime = Date.now();
    let actionHistory: Array<{ type: string; state: T; timestamp: number }> = [];
    const  performanceMetrics: PerformanceMetrics = {
      averageUpdateTime: 0,
      totalUpdates: 0,
      slowUpdates: 0,
      lastUpdateTime: 0,
      stateSize: 0,
    };

    // Performance monitoring
    const monitorPerformance = () => {
      if (config.warnOnSlowUpdates) {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateTime;
        const threshold = config.performanceThreshold || 16; // 60fps threshold

        if (timeSinceLastUpdate > threshold) {
          performanceMetrics.slowUpdates++;
          console.warn(
            `Slow state update detected: ${timeSinceLastUpdate}ms since last update`
          );
        }

        performanceMetrics.totalUpdates++;
        performanceMetrics.averageUpdateTime =
          (performanceMetrics.averageUpdateTime * (performanceMetrics.totalUpdates - 1) +
            timeSinceLastUpdate) /
          performanceMetrics.totalUpdates;
        performanceMetrics.lastUpdateTime = now;
        lastUpdateTime = now;
      }
    };

    // State size monitoring
    const monitorStateSize = () => {
      if (config.warnOnLargeState) {
        const stateSize = JSON.stringify(getState()).length;
        const threshold = config.stateSizeThreshold || 100000; // 100KB threshold

        if (stateSize > threshold) {
          console.warn(
            `Large state detected: ${stateSize} bytes. Consider splitting your state.`
          );
        }

        performanceMetrics.stateSize = stateSize;
      }
    };

    // Type validation
    const validateState = (state: T) => {
      if (config.validateTypes && process.env.NODE_ENV === 'development') {
        try {
          validateType<T>(state, 'state');
        } catch (error) {
          throw createEnhancedError('State validation failed', {
            error,
            state,
          });
        }
      }
    };

    // Debug utilities
    const debugUtils: DebugUtils<T> = {
      logState: () => {
        console.log('Current State:', getState());
      },
      logActions: () => {
        console.log('Action History:', actionHistory);
      },
      logPerformance: () => {
        console.log('Performance Metrics:', performanceMetrics);
      },
      logTypeErrors: () => {
        try {
          validateState(getState());
        } catch (error) {
          console.error('Type Errors:', error);
        }
      },
      takeSnapshot: () => {
        return { ...getState() };
      },
      replayAction: (action: string) => {
        const actionRecord = actionHistory.find((a) => a.type === action);
        if (actionRecord) {
          setState(actionRecord.state);
        }
      },
      getStateHistory: () => actionHistory,
      clearHistory: () => {
        actionHistory = [];
      },
      getPerformanceMetrics: () => ({
        averageUpdateTime: performanceMetrics.averageUpdateTime,
        totalUpdates: performanceMetrics.totalUpdates,
        slowUpdates: performanceMetrics.slowUpdates,
      }),
    };

    // Enhanced setState
    const enhancedSetState = (
      partial: T | Partial<T> | ((state: T) => T | Partial<T>),
      replace?: boolean
    ) => {
      try {
        monitorPerformance();
        monitorStateSize();

        // Record action
        if (config.enableActionReplay) {
          const maxHistory = config.maxHistorySize || 50;
          actionHistory.push({
            type: typeof partial === 'function' ? 'function' : 'object',
            state: getState(),
            timestamp: Date.now(),
          });
          if (actionHistory.length > maxHistory) {
            actionHistory.shift();
          }
        }

        // Apply update
        if (replace) {
          setState(partial as T);
        } else {
          setState((state) => ({ ...state, ...partial }));
        }

        // Validate state after update
        validateState(getState());
      } catch (error) {
        if (error instanceof Error) {
          throw createEnhancedError(error.message, {
            partial,
            currentState: getState(),
            error,
          });
        }
        throw error;
      }
    };

    return {
      ...store,
      setState: enhancedSetState,
      debug: debugUtils,
    };
  };
};

/**
 * Development mode warning utility
 * Provides enhanced warning messages with context
 */
export const warn = (message: string, context?: Record<string, unknown>) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[Lucent Dev Warning] ${message}${
        context ? `\nContext: ${JSON.stringify(context, null, 2)}` : ''
      }`
    );
  }
};

/**
 * Type checking utility
 * Provides runtime type checking with enhanced error messages
 */
export const isType = <T>(value: unknown, type: string): value is T => {
  if (process.env.NODE_ENV === 'development') {
    try {
      validateType<T>(value, type);
      return true;
    } catch (error) {
      console.error(`Type check failed for ${type}:`, error);
      return false;
    }
  }
  return true;
}; 