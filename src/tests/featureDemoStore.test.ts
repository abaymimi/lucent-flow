import { createMockStore, TestHelper } from '../utils/testUtils';
// import { useFeatureDemoStore } from '../stores/featureDemoStore';

interface Item {
  id: number;
  name: string;
  price: number;
  category: string;
  lastUpdated: Date;
}

interface StoreState {
  items: Item[];
  filters: {
    minPrice: number;
    category: string;
    search: string;
  };
}

describe('FeatureDemoStore Tests', () => {
  // Create a mock store with initial state
  const mockStore = createMockStore<StoreState>({
    items: [],
    filters: {
      minPrice: 0,
      category: 'all',
      search: '',
    },
  });

  // Create a test helper
  const helper = new TestHelper(mockStore);

  beforeEach(() => {
    // Reset store to initial state
    mockStore.setState({
      items: [],
      filters: {
        minPrice: 0,
        category: 'all',
        search: '',
      },
    });
    // Clear state changes and snapshots before each test
    helper.clearStateChanges();
    helper.clearSnapshots();
  });

  describe('Item Management', () => {
    it('should add an item correctly', () => {
      // Start recording state changes
      helper.recordStateChanges();

      // Take initial snapshot
      helper.takeSnapshot();

      const testDate = new Date();
      // Add an item
      mockStore.setState((state: StoreState) => ({
        ...state,
        items: [
          ...state.items,
          {
            id: 1,
            name: 'Test Item',
            price: 100,
            category: 'electronics',
            lastUpdated: testDate,
          },
        ],
      }));

      // Take final snapshot
      helper.takeSnapshot();

      // Assert state
      const currentState = mockStore.getState();
      expect(currentState.items).toHaveLength(1);
      expect(currentState.items[0]).toEqual({
        id: 1,
        name: 'Test Item',
        price: 100,
        category: 'electronics',
        lastUpdated: testDate,
      });

      // Get and analyze state changes
      const changes = helper.getStateChanges();
      expect(changes).toHaveLength(1);

      // Get and analyze snapshots
      const snapshots = helper.getSnapshots();
      expect(snapshots).toHaveLength(2);
      expect((snapshots[1].state as StoreState).items).toHaveLength(1);
    });

    it('should update an item correctly', () => {
      const testDate = new Date();
      // Set up initial state
      mockStore.setState({
        items: [
          {
            id: 1,
            name: 'Test Item',
            price: 100,
            category: 'electronics',
            lastUpdated: testDate,
          },
        ],
      });

      // Start recording
      helper.recordStateChanges();
      helper.takeSnapshot();

      // Update the item
      mockStore.setState((state: StoreState) => ({
        ...state,
        items: state.items.map((item: Item) =>
          item.id === 1 ? { ...item, price: 150 } : item
        ),
      }));

      // Take final snapshot
      helper.takeSnapshot();

      // Assert state
      const currentState = mockStore.getState();
      expect(currentState.items).toHaveLength(1);
      expect(currentState.items[0]).toEqual({
        id: 1,
        name: 'Test Item',
        price: 150,
        category: 'electronics',
        lastUpdated: testDate,
      });

      // Compare snapshots
      const comparison = helper.compareSnapshots(0, 1);
      expect(comparison?.changes.items).toBeDefined();
    });

    it('should delete an item correctly', () => {
      const testDate = new Date();
      // Set up initial state
      mockStore.setState({
        items: [
          {
            id: 1,
            name: 'Test Item',
            price: 100,
            category: 'electronics',
            lastUpdated: testDate,
          },
        ],
      });

      // Start recording
      helper.recordStateChanges();
      helper.takeSnapshot();

      // Delete the item
      mockStore.setState((state: StoreState) => ({
        ...state,
        items: state.items.filter((item: Item) => item.id !== 1),
      }));

      // Take final snapshot
      helper.takeSnapshot();

      // Assert state
      const currentState = mockStore.getState();
      expect(currentState.items).toHaveLength(0);
    });
  });

  describe('Filter Management', () => {
    it('should update filters correctly', () => {
      // Start recording
      helper.recordStateChanges();
      helper.takeSnapshot();

      // Update filters
      mockStore.setState((state: StoreState) => ({
        ...state,
        filters: {
          ...state.filters,
          minPrice: 50,
        },
      }));

      // Take final snapshot
      helper.takeSnapshot();

      // Assert state
      const currentState = mockStore.getState();
      expect(currentState.filters).toEqual({
        minPrice: 50,
        category: 'all',
        search: '',
      });
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch item addition', () => {
      // Start recording
      helper.recordStateChanges();
      helper.takeSnapshot();

      const testDate = new Date();
      // Add multiple items
      mockStore.setState((state: StoreState) => ({
        ...state,
        items: [
          ...state.items,
          {
            id: 1,
            name: 'Item 1',
            price: 100,
            category: 'electronics',
            lastUpdated: testDate,
          },
          {
            id: 2,
            name: 'Item 2',
            price: 200,
            category: 'clothing',
            lastUpdated: testDate,
          },
        ],
      }));

      // Take final snapshot
      helper.takeSnapshot();

      // Assert state
      const currentState = mockStore.getState();
      expect(currentState.items).toHaveLength(2);
      expect(currentState.items).toEqual([
        {
          id: 1,
          name: 'Item 1',
          price: 100,
          category: 'electronics',
          lastUpdated: testDate,
        },
        {
          id: 2,
          name: 'Item 2',
          price: 200,
          category: 'clothing',
          lastUpdated: testDate,
        },
      ]);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track state change performance', () => {
      // Start recording
      helper.recordStateChanges();
      helper.takeSnapshot();

      const testDate = new Date();
      // Make a state change
      mockStore.setState((state: StoreState) => ({
        ...state,
        items: [
          ...state.items,
          {
            id: 1,
            name: 'Test Item',
            price: 100,
            category: 'electronics',
            lastUpdated: testDate,
          },
        ],
      }));

      // Take final snapshot
      helper.takeSnapshot();

      // Get state changes
      const changes = helper.getStateChanges();
      expect(changes).toHaveLength(1);
      expect((changes[0].state as StoreState).items).toHaveLength(1);
    });
  });
}); 