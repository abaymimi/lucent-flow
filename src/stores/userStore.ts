import { createFetchStore } from '../core/createFetchStore';
import { lucentQuery } from '../utils/lucentQuery';

interface User {
  id: number;
  name: string;
  email: string;
}

// Example of using interceptors for authentication
const authQuery = lucentQuery({
  baseUrl: 'https://jsonplaceholder.typicode.com',
  requestInterceptors: [
    async (args) => {
      // Add auth token to all requests
      const token = localStorage.getItem('auth_token');
      return {
        ...args,
        headers: {
          ...args.headers,
          Authorization: `Bearer ${token}`,
        },
      };
    },
  ],
  responseInterceptors: [
    async (result) => {
      // Log successful responses
      console.log('Request successful:', result.meta?.request.url);
      return result;
    },
  ],
  errorInterceptors: [
    async (error) => {
      // Handle 401 errors by redirecting to login
      if (error.message.includes('401')) {
        window.location.href = '/login';
      }
      return error;
    },
  ],
});

const fetchUsers = async (): Promise<User[]> => {
  const result = await authQuery({
    url: '/users',
    method: 'GET',
  });
  return result.data;
};

export const userStore = createFetchStore<User[]>('users', fetchUsers, {
  staleTime: 1000 * 60, // 1 minute
  cacheTime: 1000 * 60 * 5, // 5 minutes
}); 