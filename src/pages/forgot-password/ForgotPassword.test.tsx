import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ForgotPassword from './ForgotPassword';
import * as authService from '../../services/authService';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/authService');

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el formulario', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
  });

  it('debe permitir escribir en el campo de email', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('debe enviar el formulario correctamente', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.authService.requestPasswordReset).mockResolvedValue({
      message: 'Email enviado',
      exists: true,
    });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /enviar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(authService.authService.requestPasswordReset).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });

  it('debe navegar a login al hacer clic en volver', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const backButton = screen.getByText('Volver');
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('debe mostrar error cuando falla la solicitud', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.authService.requestPasswordReset).mockRejectedValue(
      new Error('Error al solicitar restablecimiento')
    );

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /enviar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Error al solicitar restablecimiento/i)).toBeInTheDocument();
    });
  });
});

