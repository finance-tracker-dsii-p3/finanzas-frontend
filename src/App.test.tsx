import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
}));

vi.mock('./context/CategoryContext', () => ({
  CategoryProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="category-provider">{children}</div>,
}));

vi.mock('./context/BudgetContext', () => ({
  BudgetProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="budget-provider">{children}</div>,
}));

vi.mock('./context/AlertContext', () => ({
  AlertProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="alert-provider">{children}</div>,
}));

vi.mock('./components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div data-testid="protected-route">{children}</div>,
}));

vi.mock('./pages/home/HomePage', () => ({
  HomePage: () => <div data-testid="home-page">Home Page</div>,
}));

vi.mock('./pages/about/AboutPage', () => ({
  AboutPage: () => <div data-testid="about-page">About Page</div>,
}));

vi.mock('./pages/login/Login', () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}));

vi.mock('./pages/register/Register', () => ({
  default: () => <div data-testid="register-page">Register Page</div>,
}));

vi.mock('./pages/forgot-password/ForgotPassword', () => ({
  default: () => <div data-testid="forgot-password-page">Forgot Password Page</div>,
}));

vi.mock('./pages/reset-password/ResetPassword', () => ({
  default: () => <div data-testid="reset-password-page">Reset Password Page</div>,
}));

vi.mock('./pages/success/Success', () => ({
  default: () => <div data-testid="success-page">Success Page</div>,
}));

vi.mock('./pages/dashboard/Dashboard', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>,
}));

vi.mock('./pages/profile/ProfilePage', () => ({
  ProfilePage: () => <div data-testid="profile-page">Profile Page</div>,
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar correctamente', () => {
    render(<App />);
    
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('category-provider')).toBeInTheDocument();
    expect(screen.getByTestId('budget-provider')).toBeInTheDocument();
    expect(screen.getByTestId('alert-provider')).toBeInTheDocument();
  });

  it('debe renderizar la página de inicio en la ruta raíz', () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('debe renderizar la página de login en /login', () => {
    window.history.pushState({}, '', '/login');
    render(<App />);
    
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('debe renderizar la página de registro en /register', () => {
    window.history.pushState({}, '', '/register');
    render(<App />);
    
    expect(screen.getByTestId('register-page')).toBeInTheDocument();
  });

  it('debe renderizar la página about en /about', () => {
    window.history.pushState({}, '', '/about');
    render(<App />);
    
    expect(screen.getByTestId('about-page')).toBeInTheDocument();
  });

  it('debe renderizar la página de forgot-password en /forgot-password', () => {
    window.history.pushState({}, '', '/forgot-password');
    render(<App />);
    
    expect(screen.getByTestId('forgot-password-page')).toBeInTheDocument();
  });

  it('debe renderizar la página de reset-password en /reset-password', () => {
    window.history.pushState({}, '', '/reset-password');
    render(<App />);
    
    expect(screen.getByTestId('reset-password-page')).toBeInTheDocument();
  });

  it('debe renderizar la página de success en /success', () => {
    window.history.pushState({}, '', '/success');
    render(<App />);
    
    expect(screen.getByTestId('success-page')).toBeInTheDocument();
  });

  it('debe renderizar la página de dashboard protegida en /dashboard', () => {
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    
    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    // El componente usa lazy loading, así que puede mostrar el fallback de carga
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('debe renderizar la página de perfil protegida en /profile', () => {
    window.history.pushState({}, '', '/profile');
    render(<App />);
    
    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    // El componente usa lazy loading, así que puede mostrar el fallback de carga
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });
});

