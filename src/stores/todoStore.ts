import { createFetchStore } from '../core/createFetchStore';
import { fetchBaseQuery } from '../utils/fetchBaseQuery';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

const baseQuery = fetchBaseQuery({
  baseUrl: 'https://jsonplaceholder.typicode.com',
  prepareHeaders: (headers) => {
    // You can add authentication tokens or other headers here
    headers.set('Accept', 'application/json');
    return headers;
  },
});

const fetchTodos = async (): Promise<Todo[]> => {
  const result = await baseQuery({
    url: '/todos',
    method: 'GET',
    params: {
      _limit: 10, // Example of using query params
    },
  });
  return result.data;
};

export const todoStore = createFetchStore<Todo[]>('todos', fetchTodos, {
  staleTime: 1000 * 60, // 1 minute
  cacheTime: 1000 * 60 * 5, // 5 minutes
}); 