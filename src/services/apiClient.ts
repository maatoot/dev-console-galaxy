
import axios from 'axios';
import apiService from './supabaseService';
import { supabase, logApiRequest } from '@/integrations/supabase/client';

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

// Use Supabase API functions as primary, with fallback to local storage
const apis = {
  list: async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const isProvider = session?.session?.user?.user_metadata?.role === 'provider';
      
      const data = await apiService.getApis({ isProvider });
      
      if (data && data.length > 0) {
        return { data, status: 200, statusText: 'OK' };
      } else {
        throw new Error('No APIs found');
      }
    } catch (error) {
      console.log('Falling back to local APIs');
      return {
        data: getLocalAPIs(),
        status: 200,
        statusText: 'OK (Local Fallback)'
      };
    }
  },
  
  get: async (id: string) => {
    try {
      const data = await apiService.getApiById(id);
      
      if (data) {
        return { data, status: 200, statusText: 'OK' };
      } else {
        throw new Error('API not found');
      }
    } catch (error) {
      console.log('Falling back to local API');
      const localApis = getLocalAPIs();
      const foundApi = localApis.find((api: any) => api.id === id);
      
      return {
        data: foundApi,
        status: 200,
        statusText: 'OK (Local Fallback)'
      };
    }
  },
  
  create: async (data: any) => {
    try {
      const result = await apiService.createApi(data);
      
      if (result) {
        return { data: result, status: 201, statusText: 'Created' };
      } else {
        throw new Error('Failed to create API');
      }
    } catch (error) {
      console.log('Falling back to local API creation');
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
  
  update: async (id: string, data: any) => {
    try {
      const result = await apiService.updateApi(id, data);
      
      if (result) {
        return { data: result, status: 200, statusText: 'Updated' };
      } else {
        throw new Error('Failed to update API');
      }
    } catch (error) {
      console.log('Falling back to local API update');
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
      
      throw error;
    }
  },
  
  delete: async (id: string) => {
    try {
      const success = await apiService.deleteApi(id);
      
      if (success) {
        return { data: undefined, status: 200, statusText: 'Deleted' };
      } else {
        throw new Error('Failed to delete API');
      }
    } catch (error) {
      console.log('Falling back to local API deletion');
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
      
      throw error;
    }
  },
  
  addEndpoint: async (apiId: string, endpoint: { path: string; description: string }) => {
    try {
      const { data } = await apis.get(apiId);
      
      if (!data) {
        throw new Error('API not found');
      }
      
      const updatedEndpoints = [...(data.endpoints || []), endpoint];
      
      return apis.update(apiId, { endpoints: updatedEndpoints });
    } catch (error) {
      console.log('Falling back to local endpoint addition');
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
      
      throw error;
    }
  },
};

const subscriptions = {
  list: async () => {
    try {
      const data = await apiService.getSubscriptions();
      
      if (data && data.length >= 0) {
        return { data, status: 200, statusText: 'OK' };
      } else {
        throw new Error('Failed to fetch subscriptions');
      }
    } catch (error) {
      console.log('Falling back to local subscriptions');
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
  
  get: async (id: string) => {
    try {
      const data = await apiService.getSubscriptionById(id);
      
      if (data) {
        return { data, status: 200, statusText: 'OK' };
      } else {
        throw new Error('Subscription not found');
      }
    } catch (error) {
      console.log('Falling back to local subscription');
      const localSubscriptions = getLocalSubscriptions();
      const found = localSubscriptions.find((sub: any) => sub.id === id);
      
      if (found) {
        return {
          data: found,
          status: 200,
          statusText: 'OK (Local)',
        };
      }
      
      throw error;
    }
  },
  
  create: async (data: any) => {
    try {
      const result = await apiService.createSubscription(data);
      
      if (result) {
        return { data: result, status: 201, statusText: 'Created' };
      } else {
        throw new Error('Failed to create subscription');
      }
    } catch (error) {
      console.log('Falling back to local subscription creation');
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
  
  update: async (id: string, data: any) => {
    try {
      const result = await apiService.updateSubscription(id, data);
      
      if (result) {
        return { data: result, status: 200, statusText: 'Updated' };
      } else {
        throw new Error('Failed to update subscription');
      }
    } catch (error) {
      console.log('Falling back to local subscription update');
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
      
      throw error;
    }
  },
  
  delete: async (id: string) => {
    try {
      const success = await apiService.cancelSubscription(id);
      
      if (success) {
        return { data: undefined, status: 200, statusText: 'Subscription cancelled' };
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.log('Falling back to local subscription deletion');
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
      
      throw error;
    }
  },
};

// Gateway service for API testing
const gateway = {
  proxy: async (apiKey: string, url: string, options: {
    method: string;
    headers?: Record<string, string>;
    data?: any;
  }): Promise<{
    data: any;
    status: number;
    statusText: string;
    headers: any;
  }> => {
    try {
      const startTime = Date.now();
      
      let targetUrl = url;
      
      const headers = {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-Key': apiKey }),
        ...options.headers
      };
      
      let response;
      
      console.log(`Making ${options.method} request to: ${targetUrl}`, {
        headers,
        data: options.data
      });
      
      switch (options.method.toUpperCase()) {
        case 'GET':
          response = await axios.get(targetUrl, { headers });
          break;
        case 'POST':
          response = await axios.post(targetUrl, options.data, { headers });
          break;
        case 'PUT':
          response = await axios.put(targetUrl, options.data, { headers });
          break;
        case 'DELETE':
          response = await axios.delete(targetUrl, { headers });
          break;
        case 'PATCH':
          response = await axios.patch(targetUrl, options.data, { headers });
          break;
        default:
          throw new Error(`Unsupported method: ${options.method}`);
      }
      
      const responseTime = Date.now() - startTime;
      
      try {
        // Find the subscription ID by API key
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('api_key', apiKey)
          .single();
          
        if (subscriptionData) {
          await logApiRequest({
            subscriptionId: subscriptionData.id,
            endpointPath: new URL(targetUrl).pathname,
            statusCode: response.status,
            responseTime,
            requestMethod: options.method.toUpperCase(),
            requestHeaders: headers,
            requestQuery: new URL(targetUrl).search || null,
            requestBody: options.data || null,
            responseHeaders: response.headers,
            responseBody: response.data || null
          });
        }
      } catch (logError) {
        console.error('Error logging API request:', logError);
      }
      
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error: any) {
      console.error('API gateway error:', error);
      
      if (axios.isAxiosError(error)) {
        return {
          data: error.response?.data || { error: error.message },
          status: error.response?.status || 500,
          statusText: error.response?.statusText || 'Error',
          headers: error.response?.headers || {},
        };
      }
      
      return {
        data: { error: error.message || 'Unknown error' },
        status: 500,
        statusText: 'Internal Error',
        headers: {},
      };
    }
  }
};

// Combined API client that uses Supabase with fallbacks
const apiClient = {
  apis,
  subscriptions,
  gateway,
};

export default apiClient;
