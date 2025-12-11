import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProtectedAdminRoute } from './ProtectedAdminRoute';

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate">Redirecting to {to}</div>,
  };
});

describe('ProtectedAdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el children cuando el usuario es admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin' },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <BrowserRouter>
        <ProtectedAdminRoute>
          <div>Contenido de admin</div>
        </ProtectedAdminRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Contenido de admin')).toBeInTheDocument();
  });

  it('debe redirigir a login cuando el usuario no está autenticado', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <BrowserRouter>
        <ProtectedAdminRoute>
          <div>Contenido de admin</div>
        </ProtectedAdminRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByText(/redirecting to \/login/i)).toBeInTheDocument();
  });

  it('debe redirigir a dashboard cuando el usuario no es admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'user', email: 'user@test.com', role: 'user' },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <BrowserRouter>
        <ProtectedAdminRoute>
          <div>Contenido de admin</div>
        </ProtectedAdminRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByText(/redirecting to \/dashboard/i)).toBeInTheDocument();
  });

  it('debe mostrar loading cuando isLoading es true', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });

    render(
      <BrowserRouter>
        <ProtectedAdminRoute>
          <div>Contenido de admin</div>
        </ProtectedAdminRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });
});

