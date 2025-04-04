import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000'; // Replace with your actual API base URL

interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers?: any;
}

interface ApiErrorResponse {
  message: string;
  status: number;
  statusText: string;
}

// Mock data for local development and fallbacks
const MOCK_DATA = {
  apis: [
    {
      id: 'api-1',
      name: 'Weather API',
      description: 'A comprehensive weather data API',
      baseUrl: 'https://api.weather.example',
      endpoints: [
        { path: '/current', description: 'Get current weather' },
        { path: '/forecast', description: 'Get weather forecast' }
      ],
      visibility: 'public',
      provider_id: 'provider-1',
      authentication: { type: 'apiKey', apiKeyName: 'X-API-Key', apiKeyLocation: 'header' },
      defaultHeaders: { 'Content-Type': 'application/json' },
      logo: '/placeholder.svg'
    },
    {
      id: 'api-2',
      name: 'Currency Exchange API',
      description: 'Real-time currency exchange rates',
      baseUrl: 'https://api.currency.example',
      endpoints: [
        { path: '/convert', description: 'Convert between currencies' },
        { path: '/rates', description: 'Get latest exchange rates' }
      ],
      visibility: 'public',
      provider_id: 'provider-1',
      authentication: { type: 'none' },
      defaultHeaders: { 'Content-Type': 'application/json' }
    },
    {
      id: 'api-3',
      name: 'Instagram Data API',
      description: 'Retrieve data from Instagram content',
      baseUrl: 'http://45.84.197.155:80',
      endpoints: [
        { path: '/index', description: 'Get Instagram content data by URL' }
      ],
      visibility: 'public',
      provider_id: 'provider-2',
      authentication: { type: 'none' },
      defaultHeaders: { 'Content-Type': 'application/json' }
    }
  ],
  subscriptions: [
    {
      id: 'sub-1',
      api_id: 'api-1',
      plan: 'free',
      user_id: 'user-1',
      api_key: 'sk_test_weatherapi12345',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usage_limit: 1000
    }
  ]
};

// Generate a new API subscription
const generateSubscription = (apiId: string, plan: string = 'free', userId: string = 'user-1') => {
  return {
    id: `sub-${Date.now()}`,
    api_id: apiId,
    plan: plan,
    user_id: userId,
    api_key: `sk_${Math.random().toString(36).substring(2, 15)}`,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    usage_limit: plan === 'free' ? 1000 : plan === 'basic' ? 5000 : -1
  };
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Adjust as needed
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to handle API requests and response parsing with fallback
async function handleRequest<T>(request: Promise<any>, fallbackData?: T): Promise<ApiResponse<T>> {
  try {
    const response = await request;
    return {
      data: response.data as T,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    };
  } catch (error: any) {
    console.error('API request failed:', error);
    
    // If fallback data was provided, use it instead of throwing an error
    if (fallbackData !== undefined) {
      console.log('Using fallback data:', fallbackData);
      return {
        data: fallbackData as T,
        status: 200,
        statusText: 'OK (Fallback)',
      };
    }
    
    // Axios specific error handling
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      const status = error.response?.status || 500;
      const statusText = error.response?.statusText || 'Internal Server Error';

      throw {
        message: message,
        status: status,
        statusText: statusText,
      } as ApiErrorResponse;
    } else {
      // Generic error handling
      throw {
        message: 'An unexpected error occurred',
        status: 500,
        statusText: 'Internal Server Error',
      } as ApiErrorResponse;
    }
  }
}

// Local storage management for mock data persistence
const getLocalAPIs = () => {
  try {
    const stored = localStorage.getItem('api_hub_apis');
    return stored ? JSON.parse(stored) : [...MOCK_DATA.apis];
  } catch (e) {
    console.error('Failed to parse stored APIs:', e);
    return [...MOCK_DATA.apis];
  }
};

const setLocalAPIs = (apis: any[]) => {
  localStorage.setItem('api_hub_apis', JSON.stringify(apis));
  return apis;
};

const getLocalSubscriptions = () => {
  try {
    const stored = localStorage.getItem('api_hub_subscriptions');
    return stored ? JSON.parse(stored) : [...MOCK_DATA.subscriptions];
  } catch (e) {
    console.error('Failed to parse stored subscriptions:', e);
    return [...MOCK_DATA.subscriptions];
  }
};

const setLocalSubscriptions = (subscriptions: any[]) => {
  localStorage.setItem('api_hub_subscriptions', JSON.stringify(subscriptions));
  return subscriptions;
};

// Enhanced API service with fallbacks
const apis = {
  list: async (): Promise<ApiResponse<any[]>> => {
    return handleRequest<any[]>(api.get('/apis'), getLocalAPIs());
  },
  get: async (id: string): Promise<ApiResponse<any>> => {
    const localApis = getLocalAPIs();
    const foundApi = localApis.find((api: any) => api.id === id);
    return handleRequest<any>(api.get(`/apis/${id}`), foundApi);
  },
  create: async (data: any): Promise<ApiResponse<any>> => {
    try {
      return await handleRequest<any>(api.post('/apis', data));
    } catch (error) {
      // Fallback for create: create locally
      const newApi = {
        ...data,
        id: `api-${Date.now()}`,
        provider_id: localStorage.getItem('userId') || 'user-1',
        endpoints: data.endpoints || []
      };
      
      const localApis = getLocalAPIs();
      localApis.push(newApi);
      setLocalAPIs(localApis);
      
      return {
        data: newApi,
        status: 201,
        statusText: 'Created (Local)',
      };
    }
  },
  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    try {
      return await handleRequest<any>(api.put(`/apis/${id}`, data));
    } catch (error) {
      // Fallback for update: update locally
      const localApis = getLocalAPIs();
      const index = localApis.findIndex((api: any) => api.id === id);
      
      if (index !== -1) {
        localApis[index] = { ...localApis[index], ...data };
        setLocalAPIs(localApis);
        
        return {
          data: localApis[index],
          status: 200,
          statusText: 'Updated (Local)',
        };
      }
      
      throw error; // Re-throw if API not found locally
    }
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    try {
      return await handleRequest<void>(api.delete(`/apis/${id}`));
    } catch (error) {
      // Fallback for delete: delete locally
      const localApis = getLocalAPIs();
      const filtered = localApis.filter((api: any) => api.id !== id);
      
      if (filtered.length < localApis.length) {
        setLocalAPIs(filtered);
        
        return {
          data: undefined,
          status: 200,
          statusText: 'Deleted (Local)',
        };
      }
      
      throw error; // Re-throw if API not found locally
    }
  },
  addEndpoint: async (apiId: string, endpoint: { path: string; description: string }): Promise<ApiResponse<any>> => {
    try {
      return await handleRequest<any>(api.post(`/apis/${apiId}/endpoints`, endpoint));
    } catch (error) {
      // Fallback for addEndpoint: add locally
      const localApis = getLocalAPIs();
      const index = localApis.findIndex((api: any) => api.id === apiId);
      
      if (index !== -1) {
        if (!localApis[index].endpoints) {
          localApis[index].endpoints = [];
        }
        
        localApis[index].endpoints.push(endpoint);
        setLocalAPIs(localApis);
        
        return {
          data: localApis[index],
          status: 200,
          statusText: 'Endpoint Added (Local)',
        };
      }
      
      throw error; // Re-throw if API not found locally
    }
  },
};

const subscriptions = {
  list: async (): Promise<ApiResponse<any[]>> => {
    try {
      return await handleRequest<any[]>(api.get('/subscriptions'));
    } catch (error) {
      // Return local subscriptions for the current user
      const userId = localStorage.getItem('userId');
      const localSubscriptions = getLocalSubscriptions();
      
      const filtered = userId 
        ? localSubscriptions.filter((sub: any) => sub.user_id === userId)
        : localSubscriptions;
      
      return {
        data: filtered,
        status: 200,
        statusText: 'OK (Local)',
      };
    }
  },
  get: async (id: string): Promise<ApiResponse<any>> => {
    try {
      return await handleRequest<any>(api.get(`/subscriptions/${id}`));
    } catch (error) {
      // Find local subscription
      const localSubscriptions = getLocalSubscriptions();
      const found = localSubscriptions.find((sub: any) => sub.id === id);
      
      if (found) {
        return {
          data: found,
          status: 200,
          statusText: 'OK (Local)',
        };
      }
      
      throw error; // Re-throw if subscription not found locally
    }
  },
  create: async (data: any): Promise<ApiResponse<any>> => {
    try {
      return await handleRequest<any>(api.post('/subscriptions', data));
    } catch (error) {
      // Create local subscription
      const userId = localStorage.getItem('userId') || 'user-1';
      const subscription = generateSubscription(data.api_id, data.plan, userId);
      
      const localSubscriptions = getLocalSubscriptions();
      localSubscriptions.push(subscription);
      setLocalSubscriptions(localSubscriptions);
      
      return {
        data: subscription,
        status: 201,
        statusText: 'Created (Local)',
      };
    }
  },
  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    try {
      return await handleRequest<any>(api.put(`/subscriptions/${id}`, data));
    } catch (error) {
      // Update local subscription
      const localSubscriptions = getLocalSubscriptions();
      const index = localSubscriptions.findIndex((sub: any) => sub.id === id);
      
      if (index !== -1) {
        localSubscriptions[index] = { ...localSubscriptions[index], ...data };
        setLocalSubscriptions(localSubscriptions);
        
        return {
          data: localSubscriptions[index],
          status: 200,
          statusText: 'Updated (Local)',
        };
      }
      
      throw error; // Re-throw if subscription not found locally
    }
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    try {
      return await handleRequest<void>(api.delete(`/subscriptions/${id}`));
    } catch (error) {
      // Delete local subscription
      const localSubscriptions = getLocalSubscriptions();
      const filtered = localSubscriptions.filter((sub: any) => sub.id !== id);
      
      if (filtered.length < localSubscriptions.length) {
        setLocalSubscriptions(filtered);
        
        return {
          data: undefined,
          status: 200,
          statusText: 'Deleted (Local)',
        };
      }
      
      throw error; // Re-throw if subscription not found locally
    }
  },
};

// Add the gateway service for API testing
const gateway = {
  proxy: async (apiKey: string, path: string, options: {
    method: string;
    headers?: Record<string, string>;
    data?: any;
  }): Promise<ApiResponse<any>> => {
    // Create a new axios instance for the proxy request to avoid interceptor conflicts
    const proxyApi = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        ...options.headers
      },
    });
    
    try {
      let response;
      
      switch (options.method.toUpperCase()) {
        case 'GET':
          response = await proxyApi.get(`/gateway/${path}`);
          break;
        case 'POST':
          response = await proxyApi.post(`/gateway/${path}`, options.data);
          break;
        case 'PUT':
          response = await proxyApi.put(`/gateway/${path}`, options.data);
          break;
        case 'DELETE':
          response = await proxyApi.delete(`/gateway/${path}`);
          break;
        case 'PATCH':
          response = await proxyApi.patch(`/gateway/${path}`, options.data);
          break;
        default:
          throw new Error(`Unsupported method: ${options.method}`);
      }
      
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error) {
      // Check if we're trying to access the Instagram API
      if (path.includes('instagram') || path.includes('45.84.197.155')) {
        try {
          // Try direct fetch to the Instagram API
          const instagramUrl = 'http://45.84.197.155:80/index';
          const directResponse = await axios({
            method: options.method,
            url: instagramUrl,
            params: { url: path.split('?url=')[1] },
            headers: options.headers,
            data: options.data
          });
          
          return {
            data: directResponse.data,
            status: directResponse.status,
            statusText: directResponse.statusText,
            headers: directResponse.headers,
          };
        } catch (directError) {
          console.error('Direct Instagram API call failed:', directError);
        }
      }
      
      // Mock API gateway response for local development
      const mockResponse = {
        success: true,
        message: "This is a mock API response",
        request: {
          path,
          method: options.method,
          headers: options.headers,
          data: options.data
        },
        data: {
          id: "mock-data-123",
          timestamp: new Date().toISOString(),
          info: "This is a simulated response since there's no real backend connected"
        }
      };
      
      if (axios.isAxiosError(error)) {
        // Return the mock response to simulate the API
        console.log('Using mock gateway response for API testing');
        return {
          data: mockResponse,
          status: 200,
          statusText: 'OK (Mock)',
          headers: {},
        };
      }
      throw error;
    }
  }
};

const apiClient = {
  apis,
  subscriptions,
  gateway,
};

export default apiClient;
