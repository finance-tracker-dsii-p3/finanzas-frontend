import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, LoginResponse } from '../services/authService';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const navigate = useNavigate();

  const checkAuth = React.useCallback(() => {
    if (justLoggedIn) {
      return;
    }

    const token = authService.getToken();
    const userData = authService.getUser();
    
    if (token && userData) {
      setUser(userData);
    } else if (!token) {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setIsLoading(false);
  }, [justLoggedIn]);

  useEffect(() => {
    checkAuth();
    
    const handleStorageChange = () => {
      checkAuth();
    };
    
    const handleAuthLogout = () => {
      setUser(null);
      setIsLoading(false);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth:logout', handleAuthLogout);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, [checkAuth]);

  const login = async (username: string, password: string) => {
    try {
      setJustLoggedIn(true);
      
      const response: LoginResponse = await authService.login({ username, password });
      
      const savedToken = authService.getToken();
      const savedUser = authService.getUser();
      
      if (!savedToken || !savedUser) {
        setJustLoggedIn(false);
        throw new Error('Error al guardar los datos de sesión');
      }
      
      setUser(response.user);
      setIsLoading(false);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const tokenBeforeNavigate = authService.getToken();
      const userBeforeNavigate = authService.getUser();
      
      if (!tokenBeforeNavigate || !userBeforeNavigate) {
        setJustLoggedIn(false);
        throw new Error('Error: el token o usuario se perdió');
      }
      
      navigate('/dashboard', { replace: true });
      
      setTimeout(() => {
        setJustLoggedIn(false);
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      setJustLoggedIn(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

