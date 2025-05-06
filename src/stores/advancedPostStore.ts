import { createStore } from '../core/createStore';
import { lucentQuery } from '../utils/lucentQuery';
// import { QueryBuilder } from '../utils/queryBuilder';
import { Post, PostFilters } from '../types/post';

// Initialize LucentQuery with advanced configuration
const postQuery = lucentQuery({
  baseUrl: 'https://jsonplaceholder.typicode.com',
  enableDeduplication: true,
  enableOptimisticUpdates: true,
  requestInterceptors: [
    async (args) => ({
      ...args,
      headers: {
        ...args.headers,
        'Cache-Control': 'no-cache',
      },
    }),
  ],
  responseInterceptors: [
    async (result) => ({
      ...result,
      meta: {
        ...result.meta,
        timestamp: Date.now(),
      },
    }),
  ],
  errorInterceptors: [
    async (error) => {
      console.error('API Error:', error);
      return error;
    },
  ],
});

// Initialize QueryBuilder
// const queryBuilder = new QueryBuilder('https://jsonplaceholder.typicode.com');

interface AdvancedPostStore {
  posts: Post[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  filters: PostFilters;
  loading: boolean;
  error: string | null;
  // Actions
  setFilters: (filters: Partial<PostFilters>) => void;
  fetchPosts: (filters?: PostFilters) => Promise<void>;
  createPost: (post: Omit<Post, 'id'>) => Promise<void>;
  updatePost: (id: number, post: Partial<Post>) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
  reset: () => void;
}

export const useAdvancedPostStore = createStore<AdvancedPostStore>((set, get) => ({
  posts: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  },
  filters: {
    page: 1,
    limit: 10,
    sortBy: 'id',
    sortDirection: 'desc',
  },
  loading: false,
  error: null,

  setFilters: (newFilters: Partial<PostFilters>) => {
    set((state) => ({
      ...state,
      filters: { ...state.filters, ...newFilters },
    }));
  },

  fetchPosts: async (filters = get().filters) => {
    try {
      set((state) => ({ ...state, loading: true, error: null }));

      const result = await postQuery({
        url: '/posts',
        method: 'GET',
        params: {
          _page: filters.page || 1,
          _limit: filters.limit || 10,
          _sort: filters.sortBy || 'id',
          _order: filters.sortDirection || 'desc',
          ...(filters.userId && { userId: filters.userId }),
          ...(filters.search && { q: filters.search }),
          ...(filters.dateRange && {
            createdAt_gte: filters.dateRange.start,
            createdAt_lte: filters.dateRange.end,
          }),
          ...(filters.status && { status: filters.status }),
        },
      });
      
      // Update pagination state
      const totalItems = 100; // This would come from your API
      const totalPages = Math.ceil(totalItems / (filters.limit || 10));
      
      set((state) => ({
        ...state,
        posts: result.data as Post[],
        pagination: {
          currentPage: filters.page || 1,
          totalPages,
          totalItems,
          itemsPerPage: filters.limit || 10,
        },
        loading: false,
      }));
    } catch (error) {
      set((state) => ({
        ...state,
        error: error instanceof Error ? error.message : 'Failed to fetch posts',
        loading: false,
      }));
    }
  },

  createPost: async (post: Omit<Post, 'id'>) => {
    const optimisticId = Date.now();
    try {
      set((state) => ({ ...state, loading: true, error: null }));

      const optimisticPost: Post = {
        ...post,
        id: optimisticId,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        ...state,
        posts: [optimisticPost, ...state.posts],
      }));

      const result = await postQuery({
        url: '/posts',
        method: 'POST',
        body: post,
        optimisticUpdateId: optimisticId.toString(),
      });

      set((state) => ({
        ...state,
        posts: state.posts.map((p) =>
          p.id === optimisticId ? result.data as Post : p
        ),
        loading: false,
      }));
    } catch (error) {
      set((state) => ({
        ...state,
        posts: state.posts.filter((p) => p.id !== optimisticId),
        error: error instanceof Error ? error.message : 'Failed to create post',
        loading: false,
      }));
    }
  },

  updatePost: async (id: number, post: Partial<Post>) => {
    try {
      set((state) => ({ ...state, loading: true, error: null }));

      set((state) => ({
        ...state,
        posts: state.posts.map((p) =>
          p.id === id ? { ...p, ...post } : p
        ),
      }));

      const result = await postQuery({
        url: `/posts/${id}`,
        method: 'PATCH',
        body: post,
      });

      set((state) => ({
        ...state,
        posts: state.posts.map((p) =>
          p.id === id ? result.data as Post : p
        ),
        loading: false,
      }));
    } catch (error) {
      set((state) => ({
        ...state,
        error: error instanceof Error ? error.message : 'Failed to update post',
        loading: false,
      }));
    }
  },

  deletePost: async (id: number) => {
    try {
      set((state) => ({ ...state, loading: true, error: null }));

      set((state) => ({
        ...state,
        posts: state.posts.filter((p) => p.id !== id),
      }));

      await postQuery({
        url: `/posts/${id}`,
        method: 'DELETE',
      });

      set((state) => ({ ...state, loading: false }));
    } catch (error) {
      set((state) => ({
        ...state,
        error: error instanceof Error ? error.message : 'Failed to delete post',
        loading: false,
      }));
    }
  },

  reset: () => {
    set((state) => ({
      ...state,
      posts: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
      },
      filters: {
        page: 1,
        limit: 10,
        sortBy: 'id',
        sortDirection: 'desc',
      },
      loading: false,
      error: null,
    }));
  },
})); 