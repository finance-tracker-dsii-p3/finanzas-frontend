import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '../test/utils/test-utils';
import { FinanceAnimation } from './FinanceAnimation';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: { children: React.ReactNode; className?: string }) => (
      <div className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
}));

describe('FinanceAnimation', () => {
  it('debe renderizar correctamente', () => {
    render(<FinanceAnimation />);
    
    const containers = screen.getAllByTestId('motion-div');
    expect(containers.length).toBeGreaterThan(0);
    expect(containers[0]).toBeInTheDocument();
  });

  it('debe renderizar las barras de animación', () => {
    render(<FinanceAnimation />);
    
    // Debería haber múltiples elementos motion.div (barras + línea)
    const motionElements = screen.getAllByTestId('motion-div');
    expect(motionElements.length).toBeGreaterThan(0);
  });

  it('debe tener la estructura correcta del contenedor', () => {
    const { container } = render(<FinanceAnimation />);
    
    // Verificar que existe el contenedor principal
    const mainContainer = container.querySelector('.w-full.h-full');
    expect(mainContainer).toBeInTheDocument();
  });

  it('debe renderizar sin errores', () => {
    expect(() => render(<FinanceAnimation />)).not.toThrow();
  });
});

