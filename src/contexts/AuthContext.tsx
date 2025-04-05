
import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthUser {
  username: string;
  role: 'provider' | 'consumer' | 'admin';
  id: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userRole: 'provider' | 'consumer' | 'admin' | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: 'provider' | 'consumer') => Promise<void>;
  logout: () => Promise<void>;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initializeAuth = async () => {
    setIsLoading(true);
    
    try {
      // First, try to get the session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const userData: AuthUser = {
          id: session.user.id,
          username: session.user.email || 'User',
          // Default to 'consumer' role, can be updated later based on your user profile system
          role: 'consumer' as 'provider' | 'consumer' | 'admin'
        };
        
        setSession(session);
        setUser(userData);
        
        // Set user ID in localStorage for mock services
        localStorage.setItem('userId', userData.id);
      } else {
        // Fallback to localStorage token
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Failed to parse stored user:', e);
            // Clear invalid storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          const userData: AuthUser = {
            id: session.user.id,
            username: session.user.email || 'User',
            // Default to 'consumer' role, can be updated later
            role: 'consumer' as 'provider' | 'consumer' | 'admin'
          };
          setUser(userData);
          localStorage.setItem('userId', userData.id);
        } else {
          setUser(null);
          localStorage.removeItem('userId');
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      if (email.includes('@')) {
        // Real auth via Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        toast('Success', {
          description: 'You have successfully logged in.',
        });
        return;
      } else {
        // Mock auth for usernames
        console.log('Trying to login with mock user:', email);
        
        // Check if user exists and password matches
        if (mockUsers[email] && mockUsers[email].password === password) {
          // Create a simple token
          const mockToken = `mock-token-${Date.now()}`;
          const userObj: AuthUser = { 
            username: email,
            role: mockUsers[email].role,
            id: mockUsers[email].id
          };
          
          localStorage.setItem('token', mockToken);
          localStorage.setItem('user', JSON.stringify(userObj));
          localStorage.setItem('userId', mockUsers[email].id);
          
          setUser(userObj);
          
          toast('Success', {
            description: 'You have successfully logged in.',
          });
          return;
        } else {
          throw new Error('Invalid credentials');
        }
      }
    } catch (error: any) {
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

  const register = async (email: string, password: string, role: 'provider' | 'consumer') => {
    try {
      setIsLoading(true);
      
      if (email.includes('@')) {
        // Real auth via Supabase
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role
            }
          }
        });
        
        if (error) throw error;
        
        toast('Success', {
          description: 'Registration successful. Please check your email for verification.',
        });
        return;
      } else {
        // Mock registration
        // Check if username already exists
        if (mockUsers[email]) {
          throw new Error('Username already exists');
        }
        
        // Generate a mock user ID
        const userId = `user-${Date.now()}`;
        
        // Store the new user
        const newUser = {
          username: email,
          password,
          role,
          id: userId
        };
        
        mockUsers[email] = newUser;
        setStoredMockUsers(mockUsers);
        
        console.log('Registered user in mock database:', email, 'with role:', role, 'and ID:', userId);
        
        toast('Success', {
          description: 'Registration successful. Please log in.',
        });
        return;
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast('Error', {
        description: 'Failed to register: ' + error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Log out from Supabase auth
      await supabase.auth.signOut();
      
      // Also clear any localStorage items
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      
      setUser(null);
      setSession(null);
      
      toast('Logged out', {
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      token: session?.access_token || null,
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
