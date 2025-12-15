import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FinanceAnimation } from './FinanceAnimation';

describe('FinanceAnimation', () => {
  it('debe renderizar el componente', () => {
    const { container } = render(<FinanceAnimation />);
    
    // Verificar que el contenedor principal existe
    expect(container.firstChild).toBeInTheDocument();
  });

  it('debe renderizar las barras de animación', () => {
    const { container } = render(<FinanceAnimation />);
    
    // Verificar que hay elementos con las clases de las barras
    const bars = container.querySelectorAll('.bg-gradient-to-t');
    expect(bars.length).toBeGreaterThan(0);
  });

  it('debe renderizar la línea de progreso', () => {
    const { container } = render(<FinanceAnimation />);
    
    // Verificar que existe la línea de progreso
    const progressLine = container.querySelector('.bg-gradient-to-r');
    expect(progressLine).toBeInTheDocument();
  });
});
