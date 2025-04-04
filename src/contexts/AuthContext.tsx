
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from '@/lib/toast';

interface User {
  username: string;
  role: 'provider' | 'consumer' | 'admin';
  id: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userRole: 'provider' | 'consumer' | 'admin' | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, role: 'provider' | 'consumer') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Enhanced mock database with localStorage persistence
const STORAGE_KEYS = {
  MOCK_USERS: 'api_hub_mock_users',
  MOCK_APIS: 'api_hub_mock_apis',
  MOCK_SUBSCRIPTIONS: 'api_hub_mock_subscriptions',
  MOCK_USAGE_LOGS: 'api_hub_mock_usage_logs'
};

interface MockUser {
  username: string;
  password: string;
  role: 'provider' | 'consumer' | 'admin';
  id: string;
}

const getStoredMockUsers = (): Record<string, MockUser> => {
  const stored = localStorage.getItem(STORAGE_KEYS.MOCK_USERS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored mock users:', e);
    }
  }
  return {};
};

const setStoredMockUsers = (users: Record<string, MockUser>) => {
  localStorage.setItem(STORAGE_KEYS.MOCK_USERS, JSON.stringify(users));
};

let mockUsers = getStoredMockUsers();

// Initialize with admin if empty
if (Object.keys(mockUsers).length === 0) {
  const adminId = `admin-${Date.now()}`;
  mockUsers = {
    admin: {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      id: adminId
    },
    provider: {
      username: 'provider',
      password: 'provider123',
      role: 'provider',
      id: `provider-${Date.now()}`
    },
    consumer: {
      username: 'consumer',
      password: 'consumer123',
      role: 'consumer',
      id: `consumer-${Date.now()}`
    }
  };
  setStoredMockUsers(mockUsers);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for existing token in localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        // Clear invalid storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Always use mock database for demo
      console.log('Trying to login with mock user:', username);
      console.log('Available mock users:', Object.keys(mockUsers));
      
      // Check if user exists and password matches
      if (mockUsers[username] && mockUsers[username].password === password) {
        // Create a simple token
        const mockToken = `mock-token-${Date.now()}`;
        const userObj = { 
          username,
          role: mockUsers[username].role,
          id: mockUsers[username].id
        };
        
        setToken(mockToken);
        setUser(userObj);
        
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(userObj));
        localStorage.setItem('userId', mockUsers[username].id);
        
        toast('Success', {
          description: 'You have successfully logged in.',
        });
        return;
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast('Error', {
        description: 'Failed to login. Please check your credentials.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, password: string, role: 'provider' | 'consumer') => {
    try {
      setIsLoading(true);
      
      // Check if username already exists
      if (mockUsers[username]) {
        throw new Error('Username already exists');
      }
      
      // Generate a mock user ID
      const userId = `user-${Date.now()}`;
      
      // Store the new user
      const newUser = {
        username,
        password,
        role,
        id: userId
      };
      
      mockUsers[username] = newUser;
      setStoredMockUsers(mockUsers);
      
      console.log('Registered user in mock database:', username, 'with role:', role, 'and ID:', userId);
      
      toast('Success', {
        description: 'Registration successful. Please log in.',
      });
      return;
    } catch (error) {
      console.error('Registration error:', error);
      toast('Error', {
        description: 'Failed to register. Username may already exist.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    toast('Logged out', {
      description: 'You have been successfully logged out.',
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      isAuthenticated: !!user,
      userRole: user?.role || null,
      login, 
      register, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
