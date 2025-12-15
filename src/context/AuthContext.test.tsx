import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '../test/utils/test-utils';
import { AuthProvider, useAuth } from './AuthContext';
import * as authServiceModule from '../services/authService';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getToken: vi.fn(),
    getUser: vi.fn(),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(authServiceModule.authService.getToken).mockReturnValue(null);
    vi.mocked(authServiceModule.authService.getUser).mockReturnValue(null);
  });

  it('debe inicializar sin usuario cuando no hay token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('debe inicializar con usuario cuando hay token y user', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@test.com', role: 'user' };
    vi.mocked(authServiceModule.authService.getToken).mockReturnValue('token123');
    vi.mocked(authServiceModule.authService.getUser).mockReturnValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('debe hacer login correctamente', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@test.com', role: 'user' };
    const mockResponse = { user: mockUser, token: 'token123', message: 'Login exitoso' };
    
    vi.mocked(authServiceModule.authService.login).mockResolvedValue(mockResponse);
    vi.mocked(authServiceModule.authService.getToken).mockReturnValue('token123');
    vi.mocked(authServiceModule.authService.getUser).mockReturnValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('testuser', 'password123');
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(authServiceModule.authService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });
  });

  it('debe manejar error en login', async () => {
    vi.mocked(authServiceModule.authService.login).mockRejectedValue(new Error('Credenciales inválidas'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await expect(result.current.login('testuser', 'wrong')).rejects.toThrow('Credenciales inválidas');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('debe hacer logout correctamente', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@test.com', role: 'user' };
    vi.mocked(authServiceModule.authService.getToken).mockReturnValue('token123');
    vi.mocked(authServiceModule.authService.getUser).mockReturnValue(mockUser);
    vi.mocked(authServiceModule.authService.logout).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toBeDefined();
    });

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(authServiceModule.authService.logout).toHaveBeenCalled();
    });
  });

  it('debe manejar error en logout', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@test.com', role: 'user' };
    vi.mocked(authServiceModule.authService.getToken).mockReturnValue('token123');
    vi.mocked(authServiceModule.authService.getUser).mockReturnValue(mockUser);
    vi.mocked(authServiceModule.authService.logout).mockRejectedValue(new Error('Error de red'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toBeDefined();
    });

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it('debe limpiar usuario cuando no hay token', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@test.com', role: 'user' };
    vi.mocked(authServiceModule.authService.getToken).mockReturnValue(null);
    vi.mocked(authServiceModule.authService.getUser).mockReturnValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });
  });

  it('debe llamar a checkAuth', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.checkAuth).toBeDefined();
    });

    act(() => {
      result.current.checkAuth();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('debe manejar evento storage change', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      window.dispatchEvent(new Event('storage'));
    });

    await waitFor(() => {
      expect(result.current.checkAuth).toBeDefined();
    });
  });

  it('debe manejar evento auth:logout', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@test.com', role: 'user' };
    vi.mocked(authServiceModule.authService.getToken).mockReturnValue('token123');
    vi.mocked(authServiceModule.authService.getUser).mockReturnValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toBeDefined();
    });

    act(() => {
      window.dispatchEvent(new Event('auth:logout'));
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });
  });
});

