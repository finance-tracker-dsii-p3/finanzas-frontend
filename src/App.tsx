import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CategoryProvider } from './context/CategoryContext';
import { BudgetProvider } from './context/BudgetContext';
import { AlertProvider } from './context/AlertContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/home/HomePage';
import { AboutPage } from './pages/about/AboutPage';
import Login from './pages/login/Login';
import Register from './pages/register/Register';
import ForgotPassword from './pages/forgot-password/ForgotPassword';
import ResetPassword from './pages/reset-password/ResetPassword';
import Success from './pages/success/Success';

const ProfilePage = lazy(() => import('./pages/profile/ProfilePage').then(module => ({ default: module.ProfilePage })));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Cargando...</p>
    </div>
  </div>
);

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <CategoryProvider>
                    <BudgetProvider>
                        <AlertProvider>
                        <main>
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/about" element={<AboutPage />} />
                            <Route 
                                path="/profile" 
                                element={
                                    <ProtectedRoute>
                                        <Suspense fallback={<LoadingFallback />}>
                                            <ProfilePage />
                                        </Suspense>
                                    </ProtectedRoute>
                                } 
                            />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/success" element={<Success />} />
                            <Route 
                                path="/dashboard" 
                                element={
                                    <ProtectedRoute>
                                        <Suspense fallback={<LoadingFallback />}>
                                            <Dashboard />
                                        </Suspense>
                                    </ProtectedRoute>
                                } 
                            />
                        </Routes>
                    </main>
                        </AlertProvider>
                    </BudgetProvider>
                </CategoryProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};
export default App;