
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from '@/lib/toast';

interface User {
  username: string;
  role: 'provider' | 'consumer' | 'admin';
  id?: string; // Adding id property to fix the build error
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

// Mock user database for demo purposes - changing to use an object instead of a variable
const mockUsers: Record<string, { username: string; password: string; role: 'provider' | 'consumer' | 'admin'; id: string }> = {};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for existing token in localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      
      // For demo environment, check against our mock database
      if (import.meta.env.DEV || window.location.href.includes('lovableproject.com')) {
        console.log('Trying to login with mock user:', username);
        console.log('Available mock users:', Object.keys(mockUsers));
        
        // Check if user exists and password matches
        if (mockUsers[username] && mockUsers[username].password === password) {
          // Create a simple token (in a real app, this would be a JWT from the server)
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
      }
      
      // This will only run in production with actual backend
      const response = await axios.post('http://localhost:8000/login', {
        username,
        password
      });

      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      
      // Store in localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      toast('Success', {
        description: 'You have successfully logged in.',
      });
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
      
      // For demo environment, store in our mock database
      if (import.meta.env.DEV || window.location.href.includes('lovableproject.com')) {
        // Check if username already exists
        if (mockUsers[username]) {
          throw new Error('Username already exists');
        }
        
        // Generate a mock user ID
        const userId = `user-${Date.now()}`;
        
        // Store the new user
        mockUsers[username] = {
          username,
          password,
          role,
          id: userId
        };
        
        console.log('Registered user in mock database:', username, 'with role:', role, 'and ID:', userId);
        
        toast('Success', {
          description: 'Registration successful. Please log in.',
        });
        return;
      }
      
      // This will only run in production with actual backend
      await axios.post('http://localhost:8000/register', {
        username,
        password,
        role
      });
      
      toast('Success', {
        description: 'Registration successful. Please log in.',
      });
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
