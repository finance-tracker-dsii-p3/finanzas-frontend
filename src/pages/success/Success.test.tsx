import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Success from './Success';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Success', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el componente con mensaje de correo enviado por defecto', () => {
    render(
      <MemoryRouter>
        <Success />
      </MemoryRouter>
    );

    expect(screen.getByText('¡Correo enviado!')).toBeInTheDocument();
    expect(screen.getByText(/Si el correo electrónico existe/i)).toBeInTheDocument();
  });

  it('debe mostrar mensaje de contraseña actualizada cuando type es reset', () => {
    render(
      <MemoryRouter initialEntries={[{ state: { type: 'reset' } }]}>
        <Success />
      </MemoryRouter>
    );

    expect(screen.getByText('¡Contraseña actualizada!')).toBeInTheDocument();
    expect(screen.getByText(/Tu contraseña ha sido restablecida/i)).toBeInTheDocument();
  });

  it('debe navegar a login al hacer clic en el botón', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <Success />
      </MemoryRouter>
    );

    const button = screen.getByText('Volver al inicio de sesión');
    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('debe mostrar enlace de desarrollo cuando resetUrl está presente', () => {
    render(
      <MemoryRouter initialEntries={[{ state: { type: 'forgot', resetUrl: 'http://test.com/reset' } }]}>
        <Success />
      </MemoryRouter>
    );

    expect(screen.getByText('http://test.com/reset')).toBeInTheDocument();
  });

  it('debe mostrar botón de reenviar cuando no es reset success', () => {
    render(
      <MemoryRouter>
        <Success />
      </MemoryRouter>
    );

    expect(screen.getByText('¿No recibiste el correo? Reenviar')).toBeInTheDocument();
  });

  it('debe navegar a forgot-password al hacer clic en reenviar', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <Success />
      </MemoryRouter>
    );

    const button = screen.getByText('¿No recibiste el correo? Reenviar');
    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });
});
