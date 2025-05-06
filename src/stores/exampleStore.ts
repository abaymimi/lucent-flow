import { createStore as create } from '../core/createStore';
// import { devtools } from '../middleware/devtools';

interface ExampleState {
  count: number;
  text: string;
  increment: () => void;
  decrement: () => void;
  setText: (text: string) => void;
  undo: () => void;
  redo: () => void;
}

export const useExampleStore = create<ExampleState>((set, get) => ({
  count: 0,
  text: '',
  increment: () => {
    console.group('State Update');
    console.log('Action: increment');
    console.log('Previous State:', get());
    set((state) => {
      const newState = { ...state, count: state.count + 1 };
      console.log('Next State:', newState);
      console.groupEnd();
      return newState;
    });
  },
  decrement: () => {
    console.group('State Update');
    console.log('Action: decrement');
    console.log('Previous State:', get());
    set((state) => {
      const newState = { ...state, count: state.count - 1 };
      console.log('Next State:', newState);
      console.groupEnd();
      return newState;
    });
  },
  setText: (text: string) => {
    console.group('State Update');
    console.log('Action: setText');
    console.log('Previous State:', get());
    set((state) => {
      const newState = { ...state, text };
      console.log('Next State:', newState);
      console.groupEnd();
      return newState;
    });
  },
  undo: () => {
    console.group('State Update');
    console.log('Action: undo');
    console.groupEnd();
    // Implementation would go here
  },
  redo: () => {
    console.group('State Update');
    console.log('Action: redo');
    console.groupEnd();
    // Implementation would go here
  },
}));