import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import * as authContext from '../../context/AuthContext';

const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockCheckAuth = vi.fn();

vi.mock('../../context/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof authContext>();
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

vi.mock('../../components/FinanceAnimation', () => ({
  FinanceAnimation: () => <div data-testid="finance-animation">Animation</div>,
}));

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      logout: mockLogout,
      checkAuth: mockCheckAuth,
    });
  });

  it('debe renderizar el formulario de login', () => {
    render(<Login />);
    
    expect(screen.getByLabelText(/nombre de usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('debe mostrar campos requeridos', () => {
    render(<Login />);
    
    const usernameInput = screen.getByLabelText(/nombre de usuario/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    
    expect(usernameInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it('debe permitir escribir en los campos', async () => {
    const user = userEvent.setup();
    render(<Login />);
    
    const usernameInput = screen.getByLabelText(/nombre de usuario/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    
    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
  });

  it('debe mostrar/ocultar la contraseña al hacer clic en el botón', async () => {
    const user = userEvent.setup();
    render(<Login />);
    
    const passwordInput = screen.getByLabelText(/^contraseña$/i) as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: /mostrar contraseña/i });
    
    expect(passwordInput.type).toBe('password');
    
    await user.click(toggleButton);
    expect(passwordInput.type).toBe('text');
    
    await user.click(screen.getByRole('button', { name: /ocultar contraseña/i }));
    expect(passwordInput.type).toBe('password');
  });

  it('debe mostrar error cuando el login falla', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(new Error('Credenciales inválidas'));
    
    render(<Login />);
    
    const usernameInput = screen.getByLabelText(/nombre de usuario/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
    });
  });

  it('debe llamar a login con las credenciales correctas', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);
    
    render(<Login />);
    
    const usernameInput = screen.getByLabelText(/nombre de usuario/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  it('debe mostrar estado de carga durante el login', async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<Login />);
    
    const usernameInput = screen.getByLabelText(/nombre de usuario/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(screen.getByText(/iniciando sesión/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('debe mostrar enlace a registro', () => {
    render(<Login />);
    
    const registerLink = screen.getByRole('link', { name: /regístrate gratis/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('debe mostrar enlace a recuperar contraseña', () => {
    render(<Login />);
    
    const forgotPasswordLink = screen.getByRole('link', { name: /¿olvidaste tu contraseña\?/i });
    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
  });
});

