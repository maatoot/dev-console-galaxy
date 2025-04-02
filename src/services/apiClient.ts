
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Base URLs for our services
const USER_SERVICE_URL = 'http://localhost:8000';
const GATEWAY_SERVICE_URL = 'http://localhost:8001';
const TESTING_ROBOT_URL = 'http://localhost:8002';

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
    list: () => userServiceClient.get('/apis'),
    create: (apiData: any) => userServiceClient.post('/apis', apiData),
    get: (apiId: string) => userServiceClient.get(`/apis/${apiId}`),
  },
  
  // Subscriptions endpoints
  subscriptions: {
    list: () => userServiceClient.get('/subscriptions'),
    create: (subscriptionData: any) => 
      userServiceClient.post('/subscriptions', subscriptionData),
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

export default apiService;
