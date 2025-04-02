
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from '@/components/ui/sonner';

interface User {
  username: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      const response = await axios.post('http://localhost:8000/login', {
        username,
        password
      });

      const { access_token } = response.data;
      
      // Create a basic user object
      const userObj = { username };
      
      setToken(access_token);
      setUser(userObj);
      
      // Store in localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userObj));
      
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

  const register = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      await axios.post('http://localhost:8000/register', {
        username,
        password
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
