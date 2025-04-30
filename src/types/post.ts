export interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PostFilters {
  search?: string;
  userId?: number;
  page?: number;
  limit?: number;
  sortBy?: keyof Post;
  sortDirection?: 'asc' | 'desc';
  dateRange?: {
    start?: string;
    end?: string;
  };
  status?: 'published' | 'draft';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
} 