import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import Register from './Register';
import { authService } from '../../services/authService';

vi.mock('../../services/authService', () => ({
  authService: {
    register: vi.fn(),
    getToken: vi.fn(() => null),
    getUser: vi.fn(() => null),
    isAuthenticated: vi.fn(() => false),
  },
}));

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el formulario de registro', () => {
    render(<Register />);
    
    expect(screen.getByLabelText(/^nombre$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/número de identificación/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre de usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
  });

  it('debe validar que todos los campos sean requeridos', () => {
    render(<Register />);
    
    const inputs = [
      screen.getByLabelText(/^nombre$/i),
      screen.getByLabelText(/apellido/i),
      screen.getByLabelText(/número de identificación/i),
      screen.getByLabelText(/nombre de usuario/i),
      screen.getByLabelText(/correo electrónico/i),
      screen.getByLabelText(/^contraseña$/i),
      screen.getByLabelText(/confirmar contraseña/i),
    ];
    
    inputs.forEach(input => {
      expect(input).toBeRequired();
    });
  });

  it('debe mostrar validación de contraseña en tiempo real', async () => {
    const user = userEvent.setup();
    render(<Register />);
    
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    
    await user.type(passwordInput, 'weak');
    expect(screen.getByText(/mínimo 8 caracteres/i)).toBeInTheDocument();
    
    await user.clear(passwordInput);
    await user.type(passwordInput, 'Password123!');
    
    await waitFor(() => {
      const checks = screen.getAllByText(/✓/i);
      expect(checks.length).toBeGreaterThan(0);
    });
  });

  it('debe validar que la contraseña tenga mayúscula, minúscula, número y carácter especial', async () => {
    const user = userEvent.setup();
    render(<Register />);
    
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    
    await user.type(passwordInput, 'Password123!');
    
    await waitFor(() => {
      expect(screen.getByText(/una mayúscula/i)).toBeInTheDocument();
      expect(screen.getByText(/una minúscula/i)).toBeInTheDocument();
      expect(screen.getByText(/un número/i)).toBeInTheDocument();
      expect(screen.getByText(/un carácter especial/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar error si las contraseñas no coinciden', async () => {
    const user = userEvent.setup();
    render(<Register />);
    
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);
    
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Different123!');
    
    await waitFor(() => {
      expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    });
  });

  it('debe registrar usuario exitosamente con datos válidos', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.register).mockResolvedValueOnce({
      message: 'Usuario registrado exitosamente',
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        is_verified: false,
      },
    });
    
    render(<Register />);
    
    await user.type(screen.getByLabelText(/^nombre$/i), 'Juan');
    await user.type(screen.getByLabelText(/apellido/i), 'Pérez');
    await user.type(screen.getByLabelText(/número de identificación/i), '1234567890');
    await user.type(screen.getByLabelText(/nombre de usuario/i), 'testuser');
    await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123!');
    
    const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(authService.register).toHaveBeenCalled();
    });
    
    const callArgs = vi.mocked(authService.register).mock.calls[0][0];
    expect(callArgs).toMatchObject({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      password_confirm: 'Password123!',
      first_name: 'Juan',
      last_name: 'Pérez',
      identification: '1234567890',
      role: 'user',
    });
  });

  it('debe mostrar error si el registro falla', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.register).mockRejectedValueOnce(new Error('El usuario ya existe'));
    
    render(<Register />);
    
    await user.type(screen.getByLabelText(/^nombre$/i), 'Juan');
    await user.type(screen.getByLabelText(/apellido/i), 'Pérez');
    await user.type(screen.getByLabelText(/número de identificación/i), '1234567890');
    await user.type(screen.getByLabelText(/nombre de usuario/i), 'testuser');
    await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123!');
    
    const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/el usuario ya existe/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('debe mostrar estado de carga durante el registro', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.register).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 200)));
    
    render(<Register />);
    
    await user.type(screen.getByLabelText(/^nombre$/i), 'Juan');
    await user.type(screen.getByLabelText(/apellido/i), 'Pérez');
    await user.type(screen.getByLabelText(/número de identificación/i), '1234567890');
    await user.type(screen.getByLabelText(/nombre de usuario/i), 'testuser');
    await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123!');
    
    const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      const loadingButton = screen.getByRole('button', { name: /creando cuenta\.\.\./i });
      expect(loadingButton).toBeInTheDocument();
      expect(loadingButton).toBeDisabled();
    }, { timeout: 3000 });
  }, 10000);

  it('debe mostrar/ocultar contraseñas al hacer clic en los botones', async () => {
    const user = userEvent.setup();
    render(<Register />);
    
    const passwordInput = screen.getByLabelText(/^contraseña$/i) as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i) as HTMLInputElement;
    
    const passwordToggle = screen.getByRole('button', { name: /mostrar contraseña/i });
    const confirmPasswordToggle = screen.getByRole('button', { name: /mostrar confirmación de contraseña/i });
    
    expect(passwordInput.type).toBe('password');
    expect(confirmPasswordInput.type).toBe('password');
    
    await user.click(passwordToggle);
    expect(passwordInput.type).toBe('text');
    
    await user.click(confirmPasswordToggle);
    expect(confirmPasswordInput.type).toBe('text');
  });

  it('debe mostrar enlace a login', () => {
    render(<Register />);
    
    const loginLink = screen.getByRole('link', { name: /inicia sesión/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});

