import { createStore as create } from '../core/createStore';
// import { devtools } from '../middleware/devtools';

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

export const useFeatureDemoStore = create<Store>((set, get) => {
  return {
    items: [],
    filters: {
      minPrice: 0,
      category: 'all',
      search: '',
    },
    addItem: (item: Omit<Item, 'id'>) => set((state) => ({
      ...state,
      items: [...state.items, { ...item, id: Date.now(), lastUpdated: new Date() }]
    })),
    updateItem: (id: number, updates: Partial<Item>) => set((state) => ({
      ...state,
      items: state.items.map((i) => 
        i.id === id ? { ...i, ...updates, lastUpdated: new Date() } : i
      )
    })),
    deleteItem: (id: number) => set((state) => ({
      ...state,
      items: state.items.filter((i) => i.id !== id)
    })),
    setFilters: (filters: Partial<Store['filters']>) => set((state) => ({
      ...state,
      filters: { ...state.filters, ...filters }
    })),
    batchAddItems: (items: Omit<Item, 'id'>[]) => set((state) => ({
      ...state,
      items: [
        ...state.items,
        ...items.map((item) => ({ ...item, id: Date.now(), lastUpdated: new Date() }))
      ]
    })),
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
  };
}); 