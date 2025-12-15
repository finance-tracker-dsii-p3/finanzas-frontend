import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AboutPage } from './AboutPage';

describe('AboutPage', () => {
  it('debe renderizar el componente', () => {
    render(<AboutPage />);
    
    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText(/Información sobre nuestra aplicación/i)).toBeInTheDocument();
  });

  it('debe tener la estructura correcta', () => {
    const { container } = render(<AboutPage />);
    
    const header = container.querySelector('.aboutpage-header');
    expect(header).toBeInTheDocument();
    
    const title = container.querySelector('.aboutpage-title');
    expect(title).toBeInTheDocument();
  });
});

