import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ResetPassword from './ResetPassword';
import * as authService from '../../services/authService';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('?token=valid-token')],
  };
});

vi.mock('../../services/authService');

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe validar el token al cargar', async () => {
    vi.mocked(authService.authService.validateResetToken).mockResolvedValue({
      valid: true,
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
      },
    });

    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(authService.authService.validateResetToken).toHaveBeenCalledWith('valid-token');
    });
  });

  it('debe mostrar error cuando el token es inválido', async () => {
    vi.mocked(authService.authService.validateResetToken).mockResolvedValue({
      valid: false,
    });

    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Token inválido o expirado/i)).toBeInTheDocument();
    });
  });

  it('debe permitir escribir en los campos de contraseña', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.authService.validateResetToken).mockResolvedValue({
      valid: true,
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
      },
    });

    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('Nueva contraseña');
    await user.type(passwordInput, 'NewPass123!');

    expect(passwordInput).toHaveValue('NewPass123!');
  });

  it('debe mostrar/ocultar contraseña al hacer clic en el botón', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.authService.validateResetToken).mockResolvedValue({
      valid: true,
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
      },
    });

    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('Nueva contraseña');
    const toggleButton = passwordInput.parentElement?.querySelector('button[aria-label*="contraseña"]');
    
    if (toggleButton) {
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });
});

