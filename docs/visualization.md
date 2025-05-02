# State Visualization with Lucent-Flow

Lucent-Flow provides powerful tools for visualizing and debugging your application state. This guide will show you how to use these features effectively.

## Features

- **State Dependency Graph**: Visual representation of state nodes and their relationships
- **Performance Impact Visualization**: Real-time performance metrics and memory usage
- **State Change Timeline**: Visual timeline of state changes with replay functionality
- **Memory Usage Tracking**: Real-time memory monitoring and analysis

## Installation

```bash
npm install lucent-flow
```

## Basic Usage

### Using the Visualizer Component

```tsx
import { StateVisualizerComponent } from "lucent/visualization";

function MyComponent() {
  return (
    <StateVisualizerComponent
      store={yourStore}
      config={{
        maxHistory: 50,
        trackMemory: true,
        trackPerformance: true,
      }}
    />
  );
}
```

### Creating a Visualization Store

```tsx
import { createVisualizationStore } from "lucent/visualization";

const useStore = createVisualizationStore(yourStore, {
  maxHistory: 100,
  trackMemory: true,
  trackPerformance: true,
});
```

## Configuration Options

| Option           | Type    | Default | Description                              |
| ---------------- | ------- | ------- | ---------------------------------------- |
| maxHistory       | number  | 100     | Maximum number of state changes to track |
| trackMemory      | boolean | true    | Enable memory usage tracking             |
| trackPerformance | boolean | true    | Enable performance metrics tracking      |

## API Reference

### StateVisualizerComponent

A React component that visualizes your store's state.

```tsx
<StateVisualizerComponent
  store={StoreApi<any>}
  config?: VisualizerConfig
/>
```

### createVisualizationStore

Creates a store with visualization capabilities.

```tsx
const useStore = createVisualizationStore<T>(
  store: StoreApi<T>,
  config?: VisualizerConfig
): StoreApi<T & { visualize: VisualizationAPI }>
```

### Visualization API

The visualization store provides the following methods:

- `getGraph()`: Returns the current state graph
- `getTimeline()`: Returns the state change timeline
- `getPerformance()`: Returns current performance metrics
- `replay(startTime?, endTime?)`: Replays state changes within a time range

## Example

```tsx
import { create } from "zustand";
import { StateVisualizerComponent } from "lucent/visualization";

// Create a store
const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

// Use the visualizer
function Counter() {
  return (
    <div>
      <StateVisualizerComponent
        store={useCounterStore}
        config={{
          maxHistory: 50,
          trackMemory: true,
          trackPerformance: true,
        }}
      />
    </div>
  );
}
```

## Best Practices

1. **Enable in Development Only**:

   ```tsx
   <StateVisualizerComponent
     store={store}
     config={{
       trackMemory: process.env.NODE_ENV === "development",
       trackPerformance: process.env.NODE_ENV === "development",
     }}
   />
   ```

2. **Limit History Size**: Adjust `maxHistory` based on your application's needs to prevent memory issues.

3. **Use with Debugging**: Combine with Lucent's debugging tools for comprehensive state management debugging.

4. **Performance Monitoring**: Use the performance metrics to identify bottlenecks in your state updates.

## Troubleshooting

### Memory Usage is High

- Reduce `maxHistory` value
- Disable memory tracking if not needed
- Clear visualization data periodically

### Performance Impact

- Disable performance tracking in production
- Use selective visualization for specific stores
- Optimize state updates

### Visualization Not Updating

- Ensure store changes are properly tracked
- Check configuration options
- Verify store subscription is active
