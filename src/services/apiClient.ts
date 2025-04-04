
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Base URLs for our services
const USER_SERVICE_URL = 'http://localhost:8000';
const GATEWAY_SERVICE_URL = 'http://localhost:8001';
const TESTING_ROBOT_URL = 'http://localhost:8002';

// Storage keys for mock data
const STORAGE_KEYS = {
  MOCK_USERS: 'api_hub_mock_users',
  MOCK_APIS: 'api_hub_mock_apis',
  MOCK_SUBSCRIPTIONS: 'api_hub_mock_subscriptions',
  MOCK_USAGE_LOGS: 'api_hub_mock_usage_logs'
};

// Mock data with localStorage persistence
interface UsageLog {
  id: string;
  api_id: string;
  subscription_id: string;
  user_id: string;
  timestamp: string;
  endpoint: string;
  status: number;
  response_time: number;
  method: string;
}

// Helper functions for persistent storage
const getStoredMockApis = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.MOCK_APIS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored mock APIs:', e);
      return [];
    }
  }
  return [];
};

const setStoredMockApis = (apis: any[]) => {
  localStorage.setItem(STORAGE_KEYS.MOCK_APIS, JSON.stringify(apis));
};

const getStoredMockSubscriptions = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.MOCK_SUBSCRIPTIONS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored mock subscriptions:', e);
      return [];
    }
  }
  return [];
};

const setStoredMockSubscriptions = (subscriptions: any[]) => {
  localStorage.setItem(STORAGE_KEYS.MOCK_SUBSCRIPTIONS, JSON.stringify(subscriptions));
};

const getStoredMockUsageLogs = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.MOCK_USAGE_LOGS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored mock usage logs:', e);
      return [];
    }
  }
  return [];
};

const setStoredMockUsageLogs = (logs: UsageLog[]) => {
  localStorage.setItem(STORAGE_KEYS.MOCK_USAGE_LOGS, JSON.stringify(logs));
};

// Initialize mock data
let mockApis = getStoredMockApis();
let mockSubscriptions = getStoredMockSubscriptions();
let mockUsageLogs = getStoredMockUsageLogs();

// Add "What is my IP" mock API if it doesn't exist
const ipApiExists = mockApis.some(api => api.name === "What Is My IP");
if (!ipApiExists && mockApis.length > 0) {
  mockApis.push({
    id: 'api-ip',
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
    authentication: { type: 'apiKey', apiKeyName: 'X-API-Key', apiKeyLocation: 'header' },
    created_at: new Date().toISOString(),
    plans: [
      { name: 'Free', price: 0, requestLimit: 1000, description: 'Limited usage' },
      { name: 'Basic', price: 10, requestLimit: 10000, description: 'Standard usage' },
      { name: 'Pro', price: 50, requestLimit: -1, description: 'Unlimited usage' }
    ],
    logo: null
  });
  setStoredMockApis(mockApis);
}

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

// Service clients
const userServiceClient = createClient(USER_SERVICE_URL);
const gatewayServiceClient = createClient(GATEWAY_SERVICE_URL);
const testingRobotClient = createClient(TESTING_ROBOT_URL);

// Mock API functions
const createMockApi = (apiData: any) => {
  const userId = localStorage.getItem('userId') || `user-${Date.now()}`;
  
  const newApi = {
    ...apiData,
    id: `api-${Date.now()}`,
    provider_id: userId,
    created_at: new Date().toISOString(),
    // Initialize with endpoints array
    endpoints: apiData.endpoints || (apiData.endpoint ? [{ path: apiData.endpoint, description: '' }] : []),
    // Add plans if not provided
    plans: apiData.plans || [
      { name: 'Free', price: 0, requestLimit: 1000, description: 'Limited usage' },
      { name: 'Basic', price: 10, requestLimit: 10000, description: 'Standard usage' },
      { name: 'Pro', price: 50, requestLimit: -1, description: 'Unlimited usage' }
    ]
  };
  
  // Remove legacy endpoint field if it exists
  delete newApi.endpoint;
  
  mockApis.push(newApi);
  setStoredMockApis(mockApis);
  return Promise.resolve({ data: newApi });
};

const addMockEndpoint = (apiId: string, endpointData: any) => {
  const apiIndex = mockApis.findIndex(api => api.id === apiId);
  if (apiIndex !== -1) {
    if (!mockApis[apiIndex].endpoints) mockApis[apiIndex].endpoints = [];
    mockApis[apiIndex].endpoints.push(endpointData);
    setStoredMockApis(mockApis);
    return Promise.resolve({ data: mockApis[apiIndex] });
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
  setStoredMockSubscriptions(mockSubscriptions);
  return Promise.resolve({ data: newSubscription });
};

const listMockSubscriptions = () => {
  const userId = localStorage.getItem('userId');
  const userSubscriptions = mockSubscriptions.filter(sub => sub.user_id === userId);
  return Promise.resolve({ data: userSubscriptions });
};

const logApiUsage = (apiKey: string, path: string, method: string, status: number, responseTime: number) => {
  const subscription = mockSubscriptions.find(sub => sub.api_key === apiKey);
  if (!subscription) return;
  
  const log: UsageLog = {
    id: `log-${Date.now()}`,
    api_id: subscription.api_id,
    subscription_id: subscription.id,
    user_id: subscription.user_id,
    timestamp: new Date().toISOString(),
    endpoint: path,
    status,
    response_time: responseTime,
    method
  };
  
  mockUsageLogs.push(log);
  setStoredMockUsageLogs(mockUsageLogs);
};

const getApiUsageLogs = (apiId: string) => {
  const logs = mockUsageLogs.filter(log => log.api_id === apiId);
  return Promise.resolve({ data: logs });
};

const getSubscriptionUsageLogs = (subscriptionId: string) => {
  const logs = mockUsageLogs.filter(log => log.subscription_id === subscriptionId);
  return Promise.resolve({ data: logs });
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
    list: () => listMockApis(),
    create: (apiData: any) => createMockApi(apiData),
    get: (apiId: string) => getMockApi(apiId),
    addEndpoint: (apiId: string, endpointData: any) => addMockEndpoint(apiId, endpointData),
    updateDetails: (apiId: string, apiData: any) => {
      const apiIndex = mockApis.findIndex(api => api.id === apiId);
      if (apiIndex !== -1) {
        mockApis[apiIndex] = { ...mockApis[apiIndex], ...apiData };
        setStoredMockApis(mockApis);
        return Promise.resolve({ data: mockApis[apiIndex] });
      }
      return Promise.reject(new Error('API not found'));
    },
  },
  
  // Subscriptions endpoints
  subscriptions: {
    list: () => listMockSubscriptions(),
    create: (subscriptionData: any) => createMockSubscription(subscriptionData),
    get: (subscriptionId: string) => {
      const subscription = mockSubscriptions.find(sub => sub.id === subscriptionId);
      return Promise.resolve({ data: subscription || null });
    },
    getByApiId: (apiId: string) => {
      const userId = localStorage.getItem('userId');
      const subscription = mockSubscriptions.find(sub => sub.api_id === apiId && sub.user_id === userId);
      return Promise.resolve({ data: subscription || null });
    }
  },
  
  // Usage logs endpoints
  usageLogs: {
    getForApi: (apiId: string) => getApiUsageLogs(apiId),
    getForSubscription: (subscriptionId: string) => getSubscriptionUsageLogs(subscriptionId)
  },
  
  // Gateway endpoints
  gateway: {
    proxy: (apiKey: string, path: string, options: AxiosRequestConfig = {}) => {
      const startTime = performance.now();
      
      return gatewayServiceClient.request({
        url: `/${apiKey}/${path}`,
        ...options,
      }).then(response => {
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        
        // Log the API usage
        logApiUsage(apiKey, path, options.method || 'GET', response.status, responseTime);
        
        return response;
      }).catch(error => {
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        
        // Log failed API usage too
        if (error.response) {
          logApiUsage(apiKey, path, options.method || 'GET', error.response.status, responseTime);
        } else {
          logApiUsage(apiKey, path, options.method || 'GET', 500, responseTime);
        }
        
        throw error;
      });
    },
  },
  
  // Testing robot endpoints
  testResults: {
    list: () => testingRobotClient.get('/test-results'),
  },
};

// Add initial mock data if empty
if (mockApis.length === 0) {
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
      created_at: new Date().toISOString(),
      plans: [
        { name: 'Free', price: 0, requestLimit: 1000, description: 'Limited access' },
        { name: 'Basic', price: 9.99, requestLimit: 10000, description: 'Standard access' },
        { name: 'Pro', price: 49.99, requestLimit: -1, description: 'Unlimited access' }
      ],
      logo: null
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
      authentication: { type: 'apiKey', apiKeyName: 'X-API-Key', apiKeyLocation: 'header' },
      created_at: new Date().toISOString(),
      plans: [
        { name: 'Free', price: 0, requestLimit: 500, description: 'Basic access' },
        { name: 'Premium', price: 29.99, requestLimit: -1, description: 'Unlimited access' }
      ],
      logo: null
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
      authentication: { type: 'apiKey', apiKeyName: 'X-API-Key', apiKeyLocation: 'header' },
      created_at: new Date().toISOString(),
      plans: [
        { name: 'Free', price: 0, requestLimit: 1000, description: 'Limited usage' },
        { name: 'Basic', price: 10, requestLimit: 10000, description: 'Standard usage' },
        { name: 'Pro', price: 50, requestLimit: -1, description: 'Unlimited usage' }
      ],
      logo: null
    }
  ];
  setStoredMockApis(mockApis);
}

export default apiService;
