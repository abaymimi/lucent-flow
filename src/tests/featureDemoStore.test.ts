import { createMockStore, TestHelper } from '../utils/testUtils';
import { useFeatureDemoStore } from '../stores/featureDemoStore';

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

      // Add an item
      mockStore.setState((state) => ({
        ...state,
        items: [
          ...state.items,
          {
            id: 1,
            name: 'Test Item',
            price: 100,
            category: 'electronics',
            lastUpdated: new Date(),
          },
        ],
      }));

      // Take final snapshot
      helper.takeSnapshot();

      // Assert state
      helper.assertState({
        items: [
          {
            id: 1,
            name: 'Test Item',
            price: 100,
            category: 'electronics',
            lastUpdated: expect.any(Date),
          },
        ],
      });

      // Assert action was called
      helper.assertActionCalled('addItem');

      // Get and analyze state changes
      const changes = helper.getStateChanges();
      expect(changes).toHaveLength(1);
      expect(changes[0].action).toBe('addItem');

      // Get and analyze snapshots
      const snapshots = helper.getSnapshots();
      expect(snapshots).toHaveLength(2);
      expect(snapshots[1].state.items).toHaveLength(1);
    });

    it('should update an item correctly', () => {
      // Set up initial state
      mockStore.setState({
        items: [
          {
            id: 1,
            name: 'Test Item',
            price: 100,
            category: 'electronics',
            lastUpdated: new Date(),
          },
        ],
      });

      // Start recording
      helper.recordStateChanges();
      helper.takeSnapshot();

      // Update the item
      mockStore.setState((state) => ({
        ...state,
        items: state.items.map((item) =>
          item.id === 1 ? { ...item, price: 150 } : item
        ),
      }));

      // Take final snapshot
      helper.takeSnapshot();

      // Assert state
      helper.assertState({
        items: [
          {
            id: 1,
            name: 'Test Item',
            price: 150,
            category: 'electronics',
            lastUpdated: expect.any(Date),
          },
        ],
      });

      // Assert action was called
      helper.assertActionCalled('updateItem');

      // Compare snapshots
      const comparison = helper.compareSnapshots(0, 1);
      expect(comparison?.changes.items).toBeDefined();
    });

    it('should delete an item correctly', () => {
      // Set up initial state
      mockStore.setState({
        items: [
          {
            id: 1,
            name: 'Test Item',
            price: 100,
            category: 'electronics',
            lastUpdated: new Date(),
          },
        ],
      });

      // Start recording
      helper.recordStateChanges();
      helper.takeSnapshot();

      // Delete the item
      mockStore.setState((state) => ({
        ...state,
        items: state.items.filter((item) => item.id !== 1),
      }));

      // Take final snapshot
      helper.takeSnapshot();

      // Assert state
      helper.assertState({
        items: [],
      });

      // Assert action was called
      helper.assertActionCalled('deleteItem');
    });
  });

  describe('Filter Management', () => {
    it('should update filters correctly', () => {
      // Start recording
      helper.recordStateChanges();
      helper.takeSnapshot();

      // Update filters
      mockStore.setState((state) => ({
        ...state,
        filters: {
          ...state.filters,
          minPrice: 50,
        },
      }));

      // Take final snapshot
      helper.takeSnapshot();

      // Assert state
      helper.assertState({
        filters: {
          minPrice: 50,
          category: 'electronics',
          search: '',
        },
      });

      // Assert action was called
      helper.assertActionCalled('setFilters');
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch item addition', () => {
      // Start recording
      helper.recordStateChanges();
      helper.takeSnapshot();

      // Add multiple items
      mockStore.setState((state) => ({
        ...state,
        items: [
          ...state.items,
          {
            id: 1,
            name: 'Item 1',
            price: 100,
            category: 'electronics',
            lastUpdated: new Date(),
          },
          {
            id: 2,
            name: 'Item 2',
            price: 200,
            category: 'clothing',
            lastUpdated: new Date(),
          },
        ],
      }));

      // Take final snapshot
      helper.takeSnapshot();

      // Assert state
      helper.assertState({
        items: [
          {
            id: 1,
            name: 'Item 1',
            price: 100,
            category: 'electronics',
            lastUpdated: expect.any(Date),
          },
          {
            id: 2,
            name: 'Item 2',
            price: 200,
            category: 'clothing',
            lastUpdated: expect.any(Date),
          },
        ],
      });

      // Assert action was called
      helper.assertActionCalled('batchAddItems');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track state change performance', () => {
      // Start recording
      helper.recordStateChanges();
      helper.takeSnapshot();

      // Perform multiple operations
      mockStore.setState((state) => ({
        ...state,
        items: [
          ...state.items,
          {
            id: 1,
            name: 'Test Item',
            price: 100,
            category: 'electronics',
            lastUpdated: new Date(),
          },
        ],
      }));

      mockStore.setState((state) => ({
        ...state,
        filters: {
          ...state.filters,
          minPrice: 50,
        },
      }));

      // Take final snapshot
      helper.takeSnapshot();

      // Get performance metrics
      const snapshots = helper.getSnapshots();
      const timeDiff = snapshots[1].timestamp - snapshots[0].timestamp;
      
      // Assert reasonable performance
      expect(timeDiff).toBeLessThan(100); // Should complete within 100ms
    });
  });
}); 