# State Visualization Example

This example demonstrates how to use Lucent's state visualization features with a simple Todo application. The example shows:

1. Basic state management with Zustand
2. Real-time state visualization
3. Performance monitoring
4. Memory usage tracking

## Features

- **Todo Management**

  - Add new todos
  - Toggle todo completion status
  - Delete todos
  - View todo list

- **State Visualization**
  - Real-time state updates
  - Performance metrics
  - Memory usage tracking
  - State history

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the example:

```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

## Code Structure

- `VisualizationExample.tsx` - Main component with Todo app and visualization
- `VisualizationExample.css` - Styling for the example
- `todoStore.ts` - Zustand store implementation

## Usage

The example demonstrates how to:

1. Create a Zustand store with TypeScript
2. Integrate state visualization
3. Monitor performance and memory usage
4. Handle state updates and side effects

## Configuration

The visualization can be configured through the `visualizerConfig` prop:

```typescript
const visualizerConfig = {
  trackMemory: true,
  trackPerformance: true,
  maxHistory: 50,
};
```

## Best Practices

1. **State Management**

   - Use TypeScript interfaces for type safety
   - Keep state updates immutable
   - Use middleware for side effects

2. **Performance**

   - Monitor memory usage
   - Track performance metrics
   - Limit history size

3. **Visualization**
   - Use appropriate update frequency
   - Configure memory tracking
   - Set reasonable history limits

## Troubleshooting

If you encounter issues:

1. Check browser console for errors
2. Verify state updates are working
3. Ensure visualization configuration is correct
4. Monitor memory usage for leaks

## Contributing

Feel free to submit issues and enhancement requests!
