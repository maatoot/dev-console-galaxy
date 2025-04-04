import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000'; // Replace with your actual API base URL

interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

interface ApiErrorResponse {
  message: string;
  status: number;
  statusText: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Adjust as needed
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to handle API requests and response parsing
async function handleRequest<T>(request: Promise<any>): Promise<ApiResponse<T>> {
  try {
    const response = await request;
    return {
      data: response.data as T,
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error: any) {
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

const apis = {
  list: async (): Promise<ApiResponse<any[]>> => {
    return handleRequest<any[]>(api.get('/apis'));
  },
  get: async (id: string): Promise<ApiResponse<any>> => {
    return handleRequest<any>(api.get(`/apis/${id}`));
  },
  create: async (data: any): Promise<ApiResponse<any>> => {
    return handleRequest<any>(api.post('/apis', data));
  },
  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return handleRequest<any>(api.put(`/apis/${id}`, data));
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return handleRequest<void>(api.delete(`/apis/${id}`));
  },
  addEndpoint: async (apiId: string, endpoint: { path: string; description: string }): Promise<ApiResponse<any>> => {
    return handleRequest<any>(api.post(`/apis/${apiId}/endpoints`, endpoint));
  },
};

const subscriptions = {
  list: async (): Promise<ApiResponse<any[]>> => {
    return handleRequest<any[]>(api.get('/subscriptions'));
  },
  get: async (id: string): Promise<ApiResponse<any>> => {
    return handleRequest<any>(api.get(`/subscriptions/${id}`));
  },
  create: async (data: any): Promise<ApiResponse<any>> => {
    return handleRequest<any>(api.post('/subscriptions', data));
  },
  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return handleRequest<any>(api.put(`/subscriptions/${id}`, data));
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return handleRequest<void>(api.delete(`/subscriptions/${id}`));
  },
};

const apiClient = {
  apis,
  subscriptions,
};

export default apiClient;
