import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/utils/test-utils';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('debe renderizar la página de inicio', () => {
    render(<HomePage />);
    expect(screen.getByText(/toma control de tus finanzas personales/i)).toBeInTheDocument();
  });

  it('debe mostrar los botones de acción principales', () => {
    render(<HomePage />);
    expect(screen.getByText(/comenzar gratis/i)).toBeInTheDocument();
    expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument();
  });

  it('debe mostrar las características principales', () => {
    render(<HomePage />);
    expect(screen.getByText(/seguimiento en tiempo real/i)).toBeInTheDocument();
    expect(screen.getByText(/reportes inteligentes/i)).toBeInTheDocument();
    expect(screen.getByText(/control de impuestos/i)).toBeInTheDocument();
  });

  it('debe mostrar las secciones de funcionalidades', () => {
    render(<HomePage />);
    expect(screen.getByText(/consolidación inteligente/i)).toBeInTheDocument();
    expect(screen.getByText(/manejo de tarjetas/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard y analítica/i)).toBeInTheDocument();
    expect(screen.getByText(/presupuestos y alertas/i)).toBeInTheDocument();
  });

  it('debe mostrar el call to action final', () => {
    render(<HomePage />);
    expect(screen.getByText(/¿listo para tomar control de tus finanzas?/i)).toBeInTheDocument();
    expect(screen.getByText(/crear cuenta gratis/i)).toBeInTheDocument();
  });
});

