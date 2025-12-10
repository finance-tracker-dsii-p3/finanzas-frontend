import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import * as authService from '../services/authService';

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

vi.mock('../services/authService', () => ({
  authService: {
    getToken: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate">Redirecting to {to}</div>,
  };
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.authService.getToken).mockReturnValue(null);
  });

  it('debe renderizar el children cuando el usuario está autenticado', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'test', email: 'test@test.com' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      loading: false,
      isLoading: false,
    });
    vi.mocked(authService.authService.getToken).mockReturnValue('mock-token');

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Contenido protegido</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });

  it('debe redirigir cuando el usuario no está autenticado', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      loading: false,
      isLoading: false,
    });
    vi.mocked(authService.authService.getToken).mockReturnValue(null);

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Contenido protegido</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByText(/redirecting to \/login/i)).toBeInTheDocument();
  });

  it('debe mostrar loading cuando isLoading es true', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      loading: true,
      isLoading: true,
    });
    vi.mocked(authService.authService.getToken).mockReturnValue(null);

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Contenido protegido</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });
});

