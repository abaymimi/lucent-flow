import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware/devtools';

interface Item {
  id: number;
  name: string;
  price: number;
  category: string;
  lastUpdated: Date;
}

interface Store {
  items: Item[];
  filters: {
    minPrice: number;
    category: string;
    search: string;
  };
  addItem: (item: Omit<Item, 'id'>) => void;
  updateItem: (id: number, updates: Partial<Item>) => void;
  deleteItem: (id: number) => void;
  setFilters: (filters: Partial<Store['filters']>) => void;
  batchAddItems: (items: Omit<Item, 'id'>[]) => void;
  getFilteredItems: () => Item[];
  getTotalValue: () => number;
}

export const useFeatureDemoStore = create<Store>()(
  devtools(
    immer((set, get) => ({
      items: [],
      filters: {
        minPrice: 0,
        category: 'all',
        search: '',
      },
      addItem: (item) => set((state) => {
        state.items.push({
          ...item,
          id: Date.now(),
          lastUpdated: new Date(),
        });
      }),
      updateItem: (id, updates) => set((state) => {
        const item = state.items.find((i) => i.id === id);
        if (item) {
          Object.assign(item, { ...updates, lastUpdated: new Date() });
        }
      }),
      deleteItem: (id) => set((state) => {
        state.items = state.items.filter((i) => i.id !== id);
      }),
      setFilters: (filters) => set((state) => {
        state.filters = { ...state.filters, ...filters };
      }),
      batchAddItems: (items) => set((state) => {
        items.forEach((item) => {
          state.items.push({
            ...item,
            id: Date.now(),
            lastUpdated: new Date(),
          });
        });
      }),
      getFilteredItems: () => {
        const { items, filters } = get();
        return items.filter((item) => {
          const matchesPrice = item.price >= filters.minPrice;
          const matchesCategory = filters.category === 'all' || item.category === filters.category;
          const matchesSearch = item.name.toLowerCase().includes(filters.search.toLowerCase());
          return matchesPrice && matchesCategory && matchesSearch;
        });
      },
      getTotalValue: () => {
        return get().items.reduce((total, item) => total + item.price, 0);
      },
    }))
  )
); 