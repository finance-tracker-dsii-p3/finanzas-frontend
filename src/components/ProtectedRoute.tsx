import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Loader2 } from 'lucide-react';
import './ProtectedRoute.css';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  const token = authService.getToken();
  const hasToken = !!token;
  const actuallyAuthenticated = isAuthenticated || hasToken;

  if (isLoading) {
    return (
      <div className="protectedroute-loader-container min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="protectedroute-loader-icon w-8 h-8 text-blue-600 mx-auto mb-4" />
          <p className="protectedroute-loader-text text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!actuallyAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};


