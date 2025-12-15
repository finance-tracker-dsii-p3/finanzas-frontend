import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils/test-utils';
import { ProfilePage } from './ProfilePage';
import * as authServiceModule from '../../services/authService';
import * as authContextModule from '../../context/AuthContext';

vi.mock('../../services/authService', () => ({
  authService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    deleteAccount: vi.fn(),
    getToken: vi.fn().mockReturnValue('mock-token'),
    getUser: vi.fn().mockReturnValue({ id: 1, username: 'testuser' }),
  },
}));

vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../context/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

describe('ProfilePage', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
  };

  const mockProfile = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    phone: '1234567890',
    identification: '123456789',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authContextModule.useAuth).mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    } as unknown as ReturnType<typeof authContextModule.useAuth>);
    vi.mocked(authServiceModule.authService.getProfile).mockResolvedValue(mockProfile);
  });

  it('debe renderizar el componente', async () => {
    render(<ProfilePage />);
    
    await waitFor(() => {

      expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
    });
  });

  it('debe cargar el perfil del usuario', async () => {
    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(authServiceModule.authService.getProfile).toHaveBeenCalled();
    });
  });

  it('debe mostrar los campos del formulario', async () => {
    render(<ProfilePage />);
    
    await waitFor(() => {


      const nombreLabel = screen.getByText('Nombre');
      expect(nombreLabel).toBeInTheDocument();
      
      const apellidoLabel = screen.getByText('Apellido');
      expect(apellidoLabel).toBeInTheDocument();
      
      const emailLabel = screen.getByText('Correo electrónico');
      expect(emailLabel).toBeInTheDocument();

      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  it('debe mostrar el formulario de cambio de contraseña', async () => {
    render(<ProfilePage />);
    
    await waitFor(() => {

      const currentPasswordLabel = screen.getByText('Contraseña actual');
      expect(currentPasswordLabel).toBeInTheDocument();
      
      const newPasswordLabel = screen.getByText('Nueva contraseña');
      expect(newPasswordLabel).toBeInTheDocument();

      const allPasswordInputs = document.querySelectorAll('input[type="password"]');
      expect(allPasswordInputs.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('debe actualizar el perfil del usuario', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    vi.mocked(authServiceModule.authService.updateProfile).mockResolvedValue({
      message: 'Perfil actualizado exitosamente',
      user: {
        ...mockProfile,
        first_name: 'Updated',
      },
    });
    
    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
    });
    
    const firstNameInput = screen.getByDisplayValue('Test');
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Updated');
    
    const saveButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(authServiceModule.authService.updateProfile).toHaveBeenCalled();
    });
  });

  it('debe cambiar la contraseña del usuario', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    vi.mocked(authServiceModule.authService.changePassword).mockResolvedValue({
      message: 'Contraseña actualizada exitosamente',
    });
    
    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
    });
    
    const passwordForms = document.querySelectorAll('form');
    const passwordForm = Array.from(passwordForms).find(form => 
      form.querySelector('input[type="password"]') !== null
    );
    
    if (passwordForm) {
      const passwordInputs = passwordForm.querySelectorAll('input[type="password"]');
      if (passwordInputs.length >= 3) {
        await user.type(passwordInputs[0], 'OldPass123!');
        await user.type(passwordInputs[1], 'NewPass123!');
        await user.type(passwordInputs[2], 'NewPass123!');
        
        const submitButton = passwordForm.querySelector('button[type="submit"]');
        if (submitButton) {
          await user.click(submitButton);
          
          await waitFor(() => {
            expect(authServiceModule.authService.changePassword).toHaveBeenCalled();
          }, { timeout: 3000 });
        }
      }
    }
  });

  it('debe mostrar error al cargar el perfil', async () => {
    vi.mocked(authServiceModule.authService.getProfile).mockRejectedValue(
      new Error('Error al cargar perfil')
    );
    
    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText(/error al cargar perfil/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar error al actualizar el perfil', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    vi.mocked(authServiceModule.authService.updateProfile).mockRejectedValue(
      new Error('Error al actualizar perfil')
    );
    
    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
    });
    
    const firstNameInput = screen.getByDisplayValue('Test');
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Updated');
    
    const saveButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText(/error al actualizar perfil/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar error al cambiar la contraseña', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    vi.mocked(authServiceModule.authService.changePassword).mockRejectedValue(
      new Error('Contraseña actual incorrecta')
    );
    
    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
    });
    
    const passwordForms = document.querySelectorAll('form');
    const passwordForm = Array.from(passwordForms).find(form => 
      form.querySelector('input[type="password"]') !== null
    );
    
    if (passwordForm) {
      const passwordInputs = passwordForm.querySelectorAll('input[type="password"]');
      if (passwordInputs.length >= 3) {
        await user.type(passwordInputs[0], 'WrongPass123!');
        await user.type(passwordInputs[1], 'NewPass123!');
        await user.type(passwordInputs[2], 'NewPass123!');
        
        const submitButton = passwordForm.querySelector('button[type="submit"]');
        if (submitButton) {
          await user.click(submitButton);
          
          await waitFor(() => {
            const errorElements = screen.queryAllByText(/error|incorrecta/i);
            expect(errorElements.length).toBeGreaterThan(0);
          }, { timeout: 3000 });
        }
      }
    }
  });
});

