
import { supabase, logApiRequest } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { Database } from '@/integrations/supabase/types';
import { Json } from '@/integrations/supabase/types';

// API Types
export interface ApiEndpoint {
  path: string;
  description: string;
  method?: string;
  parameters?: any[];
}

export interface ApiAuthentication {
  type: 'apiKey' | 'bearer' | 'basic' | 'oauth2' | 'none';
  apiKeyName?: string;
  apiKeyLocation?: 'header' | 'query';
}

export interface Api {
  id: string;
  name: string;
  description: string;
  base_url: string;
  endpoints: ApiEndpoint[];
  visibility: 'public' | 'private';
  provider_id: string;
  authentication: ApiAuthentication;
  default_headers?: Record<string, string>;
  logo?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionPlan {
  id: string;
  api_id: string;
  name: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  request_limit?: number;
  features?: any[];
  is_custom?: boolean;
}

export interface Subscription {
  id: string;
  api_id: string;
  user_id: string;
  plan: string;
  api_key: string;
  start_date: string;
  end_date?: string;
  usage_limit?: number;
  usage_count?: number;
  status: 'active' | 'suspended' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export interface ApiRequest {
  id: string;
  subscription_id: string;
  endpoint_path: string;
  status_code?: number;
  response_time?: number;
  request_date?: string;
  request_method: string;
  request_headers?: any;
  request_query?: any;
  request_body?: any;
  response_headers?: any;
  response_body?: any;
  error?: string;
}

// Helper functions for type conversion
function convertDbApiToApi(dbApi: Database['public']['Tables']['apis']['Row']): Api {
  return {
    ...dbApi,
    endpoints: Array.isArray(dbApi.endpoints) 
      ? dbApi.endpoints as unknown as ApiEndpoint[]
      : typeof dbApi.endpoints === 'string'
        ? JSON.parse(dbApi.endpoints)
        : (dbApi.endpoints as unknown as ApiEndpoint[]) || [],
    authentication: dbApi.authentication as unknown as ApiAuthentication,
    default_headers: dbApi.default_headers as unknown as Record<string, string>,
    visibility: dbApi.visibility as 'public' | 'private',
  };
}

function convertApiToDbApi(api: Partial<Api>): Partial<Database['public']['Tables']['apis']['Update']> {
  const result: Partial<Database['public']['Tables']['apis']['Update']> = {
    ...api,
    endpoints: api.endpoints as unknown as Json,
    authentication: api.authentication as unknown as Json,
    default_headers: api.default_headers as unknown as Json,
  };
  return result;
}

function convertDbSubscriptionToSubscription(dbSubscription: Database['public']['Tables']['subscriptions']['Row']): Subscription {
  return {
    ...dbSubscription,
    status: dbSubscription.status as 'active' | 'suspended' | 'cancelled',
  };
}

function convertDbPlanToSubscriptionPlan(dbPlan: Database['public']['Tables']['subscription_plans']['Row']): SubscriptionPlan {
  return {
    ...dbPlan,
    features: dbPlan.features as unknown as any[],
  };
}

// Type-safe API Service
const apiService = {
  // API Management
  getApis: async ({ isProvider = false }: { isProvider?: boolean } = {}): Promise<Api[]> => {
    try {
      let query = supabase.from('apis');
      
      // If fetching as a provider, don't filter by visibility
      if (!isProvider) {
        query = query.eq('visibility', 'public');
      }
      
      const { data, error } = await query.select('*');
      
      if (error) throw error;
      return (data || []).map(convertDbApiToApi);
    } catch (error: any) {
      console.error('Error fetching APIs:', error);
      toast('Error', { description: 'Failed to fetch APIs: ' + error.message, variant: 'destructive' });
      return [];
    }
  },
  
  getApiById: async (id: string): Promise<Api | null> => {
    try {
      const { data, error } = await supabase
        .from('apis')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data ? convertDbApiToApi(data) : null;
    } catch (error: any) {
      console.error('Error fetching API by ID:', error);
      toast('Error', { description: 'Failed to fetch API details: ' + error.message, variant: 'destructive' });
      return null;
    }
  },
  
  createApi: async (api: Omit<Api, 'id' | 'provider_id'>): Promise<Api | null> => {
    try {
      // Make sure endpoints is an array
      if (!api.endpoints || !Array.isArray(api.endpoints)) {
        api.endpoints = [];
      }
      
      const userId = localStorage.getItem('userId') || '';
      
      const dbApi = convertApiToDbApi({
        ...api,
        provider_id: userId,
      });
      
      const { data, error } = await supabase
        .from('apis')
        .insert(dbApi as Database['public']['Tables']['apis']['Insert'])
        .select()
        .single();
      
      if (error) throw error;
      toast('Success', { description: 'API created successfully!' });
      return data ? convertDbApiToApi(data) : null;
    } catch (error: any) {
      console.error('Error creating API:', error);
      toast('Error', { description: 'Failed to create API: ' + error.message, variant: 'destructive' });
      return null;
    }
  },
  
  updateApi: async (id: string, updates: Partial<Api>): Promise<Api | null> => {
    try {
      const dbUpdates = convertApiToDbApi(updates);
      
      const { data, error } = await supabase
        .from('apis')
        .update(dbUpdates as Database['public']['Tables']['apis']['Update'])
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      toast('Success', { description: 'API updated successfully!' });
      return data ? convertDbApiToApi(data) : null;
    } catch (error: any) {
      console.error('Error updating API:', error);
      toast('Error', { description: 'Failed to update API: ' + error.message, variant: 'destructive' });
      return null;
    }
  },
  
  deleteApi: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('apis')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast('Success', { description: 'API deleted successfully!' });
      return true;
    } catch (error: any) {
      console.error('Error deleting API:', error);
      toast('Error', { description: 'Failed to delete API: ' + error.message, variant: 'destructive' });
      return false;
    }
  },
  
  // Subscription Management
  getSubscriptions: async (): Promise<Subscription[]> => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*');
      
      if (error) throw error;
      return (data || []).map(convertDbSubscriptionToSubscription);
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      toast('Error', { description: 'Failed to fetch subscriptions: ' + error.message, variant: 'destructive' });
      return [];
    }
  },
  
  getSubscriptionById: async (id: string): Promise<Subscription | null> => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data ? convertDbSubscriptionToSubscription(data) : null;
    } catch (error: any) {
      console.error('Error fetching subscription by ID:', error);
      toast('Error', { description: 'Failed to fetch subscription details: ' + error.message, variant: 'destructive' });
      return null;
    }
  },
  
  getSubscriptionsForApi: async (apiId: string): Promise<Subscription[]> => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('api_id', apiId);
      
      if (error) throw error;
      return (data || []).map(convertDbSubscriptionToSubscription);
    } catch (error: any) {
      console.error('Error fetching subscriptions for API:', error);
      toast('Error', { description: 'Failed to fetch subscriptions: ' + error.message, variant: 'destructive' });
      return [];
    }
  },
  
  getUserSubscriptions: async (userId: string): Promise<Subscription[]> => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, apis(*)')
        .eq('user_id', userId);
      
      if (error) throw error;
      return (data || []).map(item => ({
        ...convertDbSubscriptionToSubscription(item),
        api: item.apis ? convertDbApiToApi(item.apis as any) : undefined
      })) as Subscription[];
    } catch (error: any) {
      console.error('Error fetching user subscriptions:', error);
      toast('Error', { description: 'Failed to fetch subscriptions: ' + error.message, variant: 'destructive' });
      return [];
    }
  },
  
  createSubscription: async (subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<Subscription | null> => {
    try {
      // Generate an API key if not provided
      if (!subscription.api_key) {
        subscription.api_key = `sk_${Math.random().toString(36).substring(2, 15)}`;
      }
      
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscription as unknown as Database['public']['Tables']['subscriptions']['Insert'])
        .select()
        .single();
      
      if (error) throw error;
      toast('Success', { description: 'API subscription created successfully!' });
      return data ? convertDbSubscriptionToSubscription(data) : null;
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast('Error', { description: 'Failed to create subscription: ' + error.message, variant: 'destructive' });
      return null;
    }
  },
  
  updateSubscription: async (id: string, updates: Partial<Subscription>): Promise<Subscription | null> => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates as unknown as Database['public']['Tables']['subscriptions']['Update'])
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      toast('Success', { description: 'Subscription updated successfully!' });
      return data ? convertDbSubscriptionToSubscription(data) : null;
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      toast('Error', { description: 'Failed to update subscription: ' + error.message, variant: 'destructive' });
      return null;
    }
  },
  
  cancelSubscription: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', id);
      
      if (error) throw error;
      toast('Success', { description: 'Subscription cancelled successfully!' });
      return true;
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast('Error', { description: 'Failed to cancel subscription: ' + error.message, variant: 'destructive' });
      return false;
    }
  },
  
  // API Request Logging and Analytics
  getApiRequests: async (subscriptionId: string, limit = 50): Promise<ApiRequest[]> => {
    try {
      const { data, error } = await supabase
        .from('api_requests')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('request_date', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching API requests:', error);
      toast('Error', { description: 'Failed to fetch request logs: ' + error.message, variant: 'destructive' });
      return [];
    }
  },
  
  getApiAnalytics: async (apiId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('api_analytics')
        .select('*')
        .eq('api_id', apiId)
        .order('day', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching API analytics:', error);
      toast('Error', { description: 'Failed to fetch analytics data: ' + error.message, variant: 'destructive' });
      return [];
    }
  },
  
  // Subscription Plans
  getSubscriptionPlans: async (apiId: string): Promise<SubscriptionPlan[]> => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('api_id', apiId);
      
      if (error) throw error;
      return (data || []).map(convertDbPlanToSubscriptionPlan);
    } catch (error: any) {
      console.error('Error fetching subscription plans:', error);
      toast('Error', { description: 'Failed to fetch subscription plans: ' + error.message, variant: 'destructive' });
      return [];
    }
  },
  
  createSubscriptionPlan: async (plan: Omit<SubscriptionPlan, 'id'>): Promise<SubscriptionPlan | null> => {
    try {
      const dbPlan = {
        ...plan,
        features: plan.features as unknown as Json,
      };
      
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert(dbPlan as Database['public']['Tables']['subscription_plans']['Insert'])
        .select()
        .single();
      
      if (error) throw error;
      toast('Success', { description: 'Subscription plan created successfully!' });
      return data ? convertDbPlanToSubscriptionPlan(data) : null;
    } catch (error: any) {
      console.error('Error creating subscription plan:', error);
      toast('Error', { description: 'Failed to create subscription plan: ' + error.message, variant: 'destructive' });
      return null;
    }
  },
  
  updateSubscriptionPlan: async (id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | null> => {
    try {
      const dbUpdates = {
        ...updates,
        features: updates.features as unknown as Json,
      };
      
      const { data, error } = await supabase
        .from('subscription_plans')
        .update(dbUpdates as Database['public']['Tables']['subscription_plans']['Update'])
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      toast('Success', { description: 'Subscription plan updated successfully!' });
      return data ? convertDbPlanToSubscriptionPlan(data) : null;
    } catch (error: any) {
      console.error('Error updating subscription plan:', error);
      toast('Error', { description: 'Failed to update subscription plan: ' + error.message, variant: 'destructive' });
      return null;
    }
  },
  
  deleteSubscriptionPlan: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast('Success', { description: 'Subscription plan deleted successfully!' });
      return true;
    } catch (error: any) {
      console.error('Error deleting subscription plan:', error);
      toast('Error', { description: 'Failed to delete subscription plan: ' + error.message, variant: 'destructive' });
      return false;
    }
  },
  
  // Test API endpoint
  testApiEndpoint: async (
    apiUrl: string, 
    method: string = 'GET',
    headers: Record<string, string> = {},
    body: any = undefined,
    apiKey: string | null = null
  ): Promise<{
    data: any;
    status: number;
    responseTime: number;
    headers: any;
  }> => {
    try {
      const startTime = Date.now();
      
      // Add API key to headers if provided
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }
      
      const requestOptions: RequestInit = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      };
      
      const response = await fetch(apiUrl, requestOptions);
      const responseTime = Date.now() - startTime;
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { message: 'No JSON response body' };
      }
      
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      return {
        data,
        status: response.status,
        responseTime,
        headers: responseHeaders,
      };
    } catch (error: any) {
      console.error('Error testing API endpoint:', error);
      return {
        data: { error: error.message || 'Failed to connect to API' },
        status: 500,
        responseTime: 0,
        headers: {},
      };
    }
  }
};

export default apiService;
