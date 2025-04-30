import { create } from 'zustand';

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

interface Filters {
  userId?: number;
  searchTerm?: string;
}

interface PostStore {
  posts: Post[];
  filters: Filters;
  isLoading: boolean;
  error: string | null;
  setFilters: (filters: Filters) => void;
  fetchPosts: () => Promise<void>;
  createPost: (post: Omit<Post, 'id'>) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
}

const usePostStore = create<PostStore>((set, get) => ({
  posts: [],
  filters: {},
  isLoading: false,
  error: null,
  
  setFilters: (filters: Filters) => set({ filters }),
  
  fetchPosts: async () => {
    set({ isLoading: true, error: null });
    try {
      const { userId, searchTerm } = get().filters;
      let url = 'https://jsonplaceholder.typicode.com/posts';
      if (userId) {
        url += `?userId=${userId}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      let posts = await response.json();
      if (searchTerm) {
        posts = posts.filter((post: Post) => 
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.body.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      set({ posts, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', isLoading: false });
    }
  },
  
  createPost: async (post: Omit<Post, 'id'>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(post),
      });
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      const newPost = await response.json();
      set((state) => ({ 
        posts: [...state.posts, newPost],
        isLoading: false 
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', isLoading: false });
    }
  },
  
  deletePost: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
      set((state) => ({ 
        posts: state.posts.filter((post) => post.id !== id),
        isLoading: false 
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', isLoading: false });
    }
  },
}));

export default usePostStore; 