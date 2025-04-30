import {
  LucentQueryFn,
  LucentQueryArgs,
  LucentQueryResult,
  LucentQueryConfig,
} from '../types/baseQuery';
import { RequestDeduplicator } from './requestDeduplicator';
import { OptimisticUpdates } from './optimisticUpdates';
import { QueryBuilder } from './queryBuilder';

const defaultValidateStatus = (status: number) => status >= 200 && status < 300;

export const lucentQuery = ({
  baseUrl = '',
  prepareHeaders = (headers) => headers,
  fetchFn = fetch,
  timeout = 30000,
  requestInterceptors = [],
  responseInterceptors = [],
  errorInterceptors = [],
  enableDeduplication = true,
  enableOptimisticUpdates = false,
}: LucentQueryConfig = {}): LucentQueryFn => {
  const deduplicator = RequestDeduplicator.getInstance();
  const optimisticUpdates = OptimisticUpdates.getInstance();
  const queryBuilder = new QueryBuilder(baseUrl);

  return async (args: LucentQueryArgs): Promise<LucentQueryResult> => {
    try {
      // Apply request interceptors
      let modifiedArgs = args;
      for (const interceptor of requestInterceptors) {
        modifiedArgs = await interceptor(modifiedArgs);
      }

      const {
        url,
        method = 'GET',
        body,
        params,
        headers = {},
        responseHandler = 'json',
        validateStatus = defaultValidateStatus,
        optimisticUpdateId,
      } = modifiedArgs;

      // Handle optimistic updates
      if (enableOptimisticUpdates && optimisticUpdateId) {
        const optimisticData = optimisticUpdates.getUpdate(optimisticUpdateId);
        if (optimisticData) {
          return {
            data: optimisticData,
            meta: {
              request: new Request(url, { method }),
              response: new Response(),
            },
          };
        }
      }

      // Create the actual request function
      const makeRequest = async () => {
        const queryString = params
          ? `?${new URLSearchParams(
              Object.entries(params).map(([key, value]) => [key, String(value)])
            ).toString()}`
          : '';
        const fullUrl = `${baseUrl}${url}${queryString}`;

        const requestHeaders = new Headers({
          'Content-Type': 'application/json',
          ...headers,
        });

        const preparedHeaders = prepareHeaders(requestHeaders, {
          getState: () => null,
        });

        const requestConfig: RequestInit = {
          method,
          headers: preparedHeaders,
          ...(body && { body: JSON.stringify(body) }),
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        requestConfig.signal = controller.signal;

        const response = await fetchFn(fullUrl, requestConfig);
        clearTimeout(timeoutId);

        if (!validateStatus(response.status)) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        let data;
        switch (responseHandler) {
          case 'json':
            data = await response.json();
            break;
          case 'text':
            data = await response.text();
            break;
          case 'blob':
            data = await response.blob();
            break;
          case 'arrayBuffer':
            data = await response.arrayBuffer();
            break;
          default:
            data = await response.json();
        }

        return {
          data,
          meta: {
            request: new Request(fullUrl, requestConfig),
            response,
          },
        };
      };

      // Use deduplication if enabled
      const result = enableDeduplication
        ? await deduplicator.deduplicate(
            JSON.stringify(modifiedArgs),
            makeRequest
          )
        : await makeRequest();

      // Apply response interceptors
      let modifiedResult = result;
      for (const interceptor of responseInterceptors) {
        modifiedResult = await interceptor(modifiedResult);
      }

      return modifiedResult;
    } catch (error) {
      if (error instanceof Error) {
        // Apply error interceptors
        let modifiedError = error;
        for (const interceptor of errorInterceptors) {
          modifiedError = await interceptor(error);
        }
        throw new Error(`Request failed: ${modifiedError.message}`);
      }
      throw error;
    }
  };
}; 