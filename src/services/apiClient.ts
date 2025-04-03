
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Base URLs for our services
const USER_SERVICE_URL = 'http://localhost:8000';
const GATEWAY_SERVICE_URL = 'http://localhost:8001';
const TESTING_ROBOT_URL = 'http://localhost:8002';

// Mock storage for APIs and subscriptions when running in Lovable environment
const isLovableEnvironment = window.location.hostname.includes('lovableproject.com');
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
  const newApi = {
    ...apiData,
    id: `api-${Date.now()}`,
    provider_id: localStorage.getItem('userId') || 'mock-provider',
    created_at: new Date().toISOString(),
    endpoints: apiData.endpoint ? [{ path: apiData.endpoint, description: '' }] : []
  };
  
  delete newApi.endpoint; // Removed since we're using endpoints array now
  
  mockApis.push(newApi);
  return Promise.resolve({ data: newApi });
};

const listMockApis = () => {
  return Promise.resolve({ data: mockApis });
};

const createMockSubscription = (subscriptionData: any) => {
  const newSubscription = {
    ...subscriptionData,
    id: `sub-${Date.now()}`,
    user_id: localStorage.getItem('userId') || 'mock-user',
    created_at: new Date().toISOString(),
    api_key: `api-key-${Math.random().toString(36).substring(2, 15)}`
  };
  
  mockSubscriptions.push(newSubscription);
  return Promise.resolve({ data: newSubscription });
};

const listMockSubscriptions = () => {
  return Promise.resolve({ data: mockSubscriptions });
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
      ? Promise.resolve({ data: mockApis.find(api => api.id === apiId) }) 
      : userServiceClient.get(`/apis/${apiId}`),
    addEndpoint: (apiId: string, endpointData: any) => isLovableEnvironment
      ? Promise.resolve(() => {
          const api = mockApis.find(api => api.id === apiId);
          if (api) {
            if (!api.endpoints) api.endpoints = [];
            api.endpoints.push(endpointData);
            return { data: api };
          }
          return { data: null };
        })
      : userServiceClient.post(`/apis/${apiId}/endpoints`, endpointData),
  },
  
  // Subscriptions endpoints
  subscriptions: {
    list: () => isLovableEnvironment ? listMockSubscriptions() : userServiceClient.get('/subscriptions'),
    create: (subscriptionData: any) => isLovableEnvironment 
      ? createMockSubscription(subscriptionData) 
      : userServiceClient.post('/subscriptions', subscriptionData),
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
        { path: '/current', description: 'Get current weather' },
        { path: '/forecast', description: 'Get weather forecast' }
      ],
      version: '1.0.0',
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
        { path: '/rates', description: 'Get current exchange rates' }
      ],
      version: '2.1.0',
      visibility: 'public',
      provider_id: 'mock-provider-2',
      authentication: { type: 'bearer' },
      created_at: new Date().toISOString()
    }
  ];
}

export default apiService;
