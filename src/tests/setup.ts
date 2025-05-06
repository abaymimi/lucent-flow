// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Redux DevTools
Object.defineProperty(window, '__REDUX_DEVTOOLS_EXTENSION__', {
  value: {
    connect: () => ({
      init: jest.fn(),
      subscribe: jest.fn(),
      send: jest.fn(),
      unsubscribe: jest.fn(),
    }),
  },
}); 