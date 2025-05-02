import {
  LucentQueryFn,
  LucentQueryArgs,
  LucentQueryResult,
  LucentQueryConfig,
} from '../types/baseQuery';

const defaultValidateStatus = (status: number) => status >= 200 && status < 300;

export const fetchBaseQuery = ({
  baseUrl = '',
  prepareHeaders = (headers: Headers) => headers,
  fetchFn = fetch,
  timeout = 30000,
}: LucentQueryConfig = {}): LucentQueryFn => {
  return async (args: LucentQueryArgs): Promise<LucentQueryResult> => {
    const {
      url,
      method = 'GET',
      body,
      params,
      headers = {},
      responseHandler = 'json',
      validateStatus = defaultValidateStatus,
    } = args;

    // Construct the full URL with baseUrl and query params
    const queryString = params
      ? `?${new URLSearchParams(
          Object.entries(params).map(([key, value]) => [key, String(value)])
        ).toString()}`
      : '';
    const fullUrl = `${baseUrl}${url}${queryString}`;

    // Create headers
    const requestHeaders = new Headers({
      'Content-Type': 'application/json',
      ...headers,
    });

    // Prepare headers with custom logic
    const preparedHeaders = prepareHeaders(requestHeaders, {
      getState: () => null, // This can be enhanced with actual state if needed
    });

    // Create request config
    const requestConfig: RequestInit = {
      method,
      headers: preparedHeaders,
      ...(body ? { body: JSON.stringify(body) } : {}),
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    requestConfig.signal = controller.signal;

    try {
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
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Request failed: ${error.message}`);
      }
      throw error;
    }
  };
}; 