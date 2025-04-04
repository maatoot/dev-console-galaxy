
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Base URLs for our services
const USER_SERVICE_URL = 'http://localhost:8000';
const GATEWAY_SERVICE_URL = 'http://localhost:8001';
const TESTING_ROBOT_URL = 'http://localhost:8002';

// Mock storage for APIs and subscriptions when running in Lovable environment
const isLovableEnvironment = window.location.href.includes('lovableproject.com');
let mockApis: any[] = [];
let mockSubscriptions: any[] = [];

// Create a reusable axios instance
const createClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add request interceptor for authentication
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return client;
};

// User service API client
const userServiceClient = createClient(USER_SERVICE_URL);
// Gateway service API client
const gatewayServiceClient = createClient(GATEWAY_SERVICE_URL);
// Testing robot service API client
const testingRobotClient = createClient(TESTING_ROBOT_URL);

// Mock API functions for Lovable environment
const createMockApi = (apiData: any) => {
  const userId = localStorage.getItem('userId') || `user-${Date.now()}`;
  
  const newApi = {
    ...apiData,
    id: `api-${Date.now()}`,
    provider_id: userId,
    created_at: new Date().toISOString(),
    // Initialize with empty endpoints array or with the first endpoint if provided
    endpoints: apiData.endpoints || (apiData.endpoint ? [{ path: apiData.endpoint, description: '' }] : [])
  };
  
  // Remove legacy endpoint field if it exists
  delete newApi.endpoint;
  
  mockApis.push(newApi);
  return Promise.resolve({ data: newApi });
};

const addMockEndpoint = (apiId: string, endpointData: any) => {
  const api = mockApis.find(api => api.id === apiId);
  if (api) {
    if (!api.endpoints) api.endpoints = [];
    api.endpoints.push(endpointData);
    return Promise.resolve({ data: api });
  }
  return Promise.reject(new Error('API not found'));
};

const listMockApis = () => {
  return Promise.resolve({ data: mockApis });
};

const getMockApi = (apiId: string) => {
  const api = mockApis.find(api => api.id === apiId);
  if (api) {
    return Promise.resolve({ data: api });
  }
  return Promise.reject(new Error('API not found'));
};

const createMockSubscription = (subscriptionData: any) => {
  const userId = localStorage.getItem('userId') || `user-${Date.now()}`;
  
  // Check if user already has a subscription for this API
  const existingSubscription = mockSubscriptions.find(
    sub => sub.api_id === subscriptionData.api_id && sub.user_id === userId
  );
  
  if (existingSubscription) {
    return Promise.resolve({ data: existingSubscription });
  }
  
  const newSubscription = {
    ...subscriptionData,
    id: `sub-${Date.now()}`,
    user_id: userId,
    created_at: new Date().toISOString(),
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    usage_limit: subscriptionData.plan === 'free' ? 1000 : 
                subscriptionData.plan === 'basic' ? 5000 : -1, // -1 means unlimited
    api_key: `api-key-${Math.random().toString(36).substring(2, 15)}`
  };
  
  mockSubscriptions.push(newSubscription);
  return Promise.resolve({ data: newSubscription });
};

const listMockSubscriptions = () => {
  const userId = localStorage.getItem('userId');
  const userSubscriptions = mockSubscriptions.filter(sub => sub.user_id === userId);
  return Promise.resolve({ data: userSubscriptions });
};

// API functions
export const apiService = {
  // Auth endpoints
  auth: {
    login: (username: string, password: string) => 
      userServiceClient.post('/login', { username, password }),
    register: (username: string, password: string) => 
      userServiceClient.post('/register', { username, password }),
  },
  
  // APIs endpoints
  apis: {
    list: () => isLovableEnvironment ? listMockApis() : userServiceClient.get('/apis'),
    create: (apiData: any) => isLovableEnvironment ? createMockApi(apiData) : userServiceClient.post('/apis', apiData),
    get: (apiId: string) => isLovableEnvironment 
      ? getMockApi(apiId)
      : userServiceClient.get(`/apis/${apiId}`),
    addEndpoint: (apiId: string, endpointData: any) => isLovableEnvironment
      ? addMockEndpoint(apiId, endpointData)
      : userServiceClient.post(`/apis/${apiId}/endpoints`, endpointData),
    updateDetails: (apiId: string, apiData: any) => isLovableEnvironment
      ? Promise.resolve(() => {
          const apiIndex = mockApis.findIndex(api => api.id === apiId);
          if (apiIndex !== -1) {
            mockApis[apiIndex] = { ...mockApis[apiIndex], ...apiData };
            return { data: mockApis[apiIndex] };
          }
          return Promise.reject(new Error('API not found'));
        })
      : userServiceClient.put(`/apis/${apiId}`, apiData),
  },
  
  // Subscriptions endpoints
  subscriptions: {
    list: () => isLovableEnvironment ? listMockSubscriptions() : userServiceClient.get('/subscriptions'),
    create: (subscriptionData: any) => isLovableEnvironment 
      ? createMockSubscription(subscriptionData) 
      : userServiceClient.post('/subscriptions', subscriptionData),
    get: (subscriptionId: string) => isLovableEnvironment
      ? Promise.resolve({ data: mockSubscriptions.find(sub => sub.id === subscriptionId) })
      : userServiceClient.get(`/subscriptions/${subscriptionId}`),
    getByApiId: (apiId: string) => {
      if (isLovableEnvironment) {
        const userId = localStorage.getItem('userId');
        const subscription = mockSubscriptions.find(sub => sub.api_id === apiId && sub.user_id === userId);
        return Promise.resolve({ data: subscription || null });
      }
      return userServiceClient.get(`/subscriptions/api/${apiId}`);
    }
  },
  
  // Gateway endpoints
  gateway: {
    proxy: (apiKey: string, path: string, options: AxiosRequestConfig = {}) =>
      gatewayServiceClient.request({
        url: `/${apiKey}/${path}`,
        ...options,
      }),
  },
  
  // Testing robot endpoints
  testResults: {
    list: () => testingRobotClient.get('/test-results'),
  },
};

// Add some mock data to start with
if (isLovableEnvironment && mockApis.length === 0) {
  mockApis = [
    {
      id: 'api-1',
      name: 'Weather API',
      description: 'Real-time weather data from around the world',
      baseUrl: 'https://api.weather.example',
      endpoints: [
        { path: '/current', description: 'Get current weather conditions' },
        { path: '/forecast', description: 'Get weather forecast for 5 days' }
      ],
      visibility: 'public',
      provider_id: 'mock-provider',
      authentication: { type: 'apiKey', apiKeyName: 'X-API-Key', apiKeyLocation: 'header' },
      created_at: new Date().toISOString()
    },
    {
      id: 'api-2',
      name: 'Currency Exchange API',
      description: 'Up-to-date currency exchange rates',
      baseUrl: 'https://api.currency.example',
      endpoints: [
        { path: '/rates', description: 'Get current exchange rates' },
        { path: '/convert', description: 'Convert between currencies' }
      ],
      visibility: 'public',
      provider_id: 'mock-provider-2',
      authentication: { type: 'bearer' },
      created_at: new Date().toISOString()
    },
    {
      id: 'api-3',
      name: 'What Is My IP',
      description: 'Returns your current IP address and information about it',
      baseUrl: 'https://api.ipify.org',
      endpoints: [
        { path: '/', description: 'Get IP address as plain text' },
        { path: '?format=json', description: 'Get IP address as JSON' },
        { path: '?format=jsonp', description: 'Get IP address as JSONP' }
      ],
      visibility: 'public',
      provider_id: 'mock-provider',
      authentication: { type: 'none' },
      created_at: new Date().toISOString()
    }
  ];
}

export default apiService;
