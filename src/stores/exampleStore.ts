import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ExampleState {
  count: number;
  text: string;
  increment: () => void;
  decrement: () => void;
  setText: (text: string) => void;
  undo: () => void;
  redo: () => void;
}

export const useExampleStore = create<ExampleState>()(
  devtools(
    (set) => ({
      count: 0,
      text: '',
      increment: () => {
        console.group('State Update');
        console.log('Action: increment');
        console.log('Previous State:', useExampleStore.getState());
        set((state) => {
          const newState = { count: state.count + 1 };
          console.log('Next State:', { ...state, ...newState });
          console.groupEnd();
          return newState;
        });
      },
      decrement: () => {
        console.group('State Update');
        console.log('Action: decrement');
        console.log('Previous State:', useExampleStore.getState());
        set((state) => {
          const newState = { count: state.count - 1 };
          console.log('Next State:', { ...state, ...newState });
          console.groupEnd();
          return newState;
        });
      },
      setText: (text) => {
        console.group('State Update');
        console.log('Action: setText');
        console.log('Previous State:', useExampleStore.getState());
        console.log('Next State:', { ...useExampleStore.getState(), text });
        console.groupEnd();
        set({ text });
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
    }),
    { name: 'Example Store', trace: true }
  )
);