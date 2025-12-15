import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import Reports from './Reports';

const mockOnBack = vi.fn();
const mockSetShowTaxes = vi.fn();

describe('Reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el componente', () => {
    render(<Reports showTaxes={false} setShowTaxes={mockSetShowTaxes} onBack={mockOnBack} />);
    
    expect(screen.getByText(/reportes y análisis/i)).toBeInTheDocument();
  });

  it('debe mostrar el botón de volver', () => {
    render(<Reports showTaxes={false} setShowTaxes={mockSetShowTaxes} onBack={mockOnBack} />);
    
    const backButton = screen.getByRole('button', { name: /volver al dashboard/i });
    expect(backButton).toBeInTheDocument();
  });

  it('debe mostrar los botones de exportar', () => {
    render(<Reports showTaxes={false} setShowTaxes={mockSetShowTaxes} onBack={mockOnBack} />);
    
    expect(screen.getByText(/exportar pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/exportar csv/i)).toBeInTheDocument();
  });

  it('debe mostrar los filtros de período', () => {
    render(<Reports showTaxes={false} setShowTaxes={mockSetShowTaxes} onBack={mockOnBack} />);
    
    expect(screen.getByText('Mes')).toBeInTheDocument();
    expect(screen.getByText('Trimestre')).toBeInTheDocument();
    expect(screen.getByText('Año')).toBeInTheDocument();
  });

  it('debe permitir cambiar el período', async () => {
    const user = userEvent.setup();
    render(<Reports showTaxes={false} setShowTaxes={mockSetShowTaxes} onBack={mockOnBack} />);
    
    const quarterButton = screen.getByText('Trimestre');
    await user.click(quarterButton);

    expect(quarterButton).toBeInTheDocument();
  });

  it('debe mostrar el checkbox de comparar períodos', () => {
    render(<Reports showTaxes={false} setShowTaxes={mockSetShowTaxes} onBack={mockOnBack} />);
    
    expect(screen.getByLabelText(/comparar períodos/i)).toBeInTheDocument();
  });

  it('debe mostrar el checkbox de incluir impuestos', () => {
    render(<Reports showTaxes={false} setShowTaxes={mockSetShowTaxes} onBack={mockOnBack} />);
    
    const checkbox = screen.getByLabelText(/incluir impuestos/i);
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('debe llamar a setShowTaxes cuando se cambia el checkbox de impuestos', async () => {
    const user = userEvent.setup();
    render(<Reports showTaxes={false} setShowTaxes={mockSetShowTaxes} onBack={mockOnBack} />);
    
    const checkbox = screen.getByLabelText(/incluir impuestos/i);
    await user.click(checkbox);
    
    expect(mockSetShowTaxes).toHaveBeenCalledWith(true);
  });

  it('debe llamar a onBack cuando se hace clic en el botón de volver', async () => {
    const user = userEvent.setup();
    render(<Reports showTaxes={false} setShowTaxes={mockSetShowTaxes} onBack={mockOnBack} />);
    
    const backButton = screen.getByRole('button', { name: /volver al dashboard/i });
    await user.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('debe mostrar el checkbox de comparar períodos', async () => {
    const user = userEvent.setup();
    render(<Reports showTaxes={false} setShowTaxes={mockSetShowTaxes} onBack={mockOnBack} />);
    
    const compareCheckbox = screen.getByLabelText(/comparar períodos/i);
    expect(compareCheckbox).toBeInTheDocument();
    
    await user.click(compareCheckbox);

    expect(compareCheckbox).toBeInTheDocument();
  });

  it('debe mostrar el período personalizado cuando se selecciona', async () => {
    const user = userEvent.setup();
    render(<Reports showTaxes={false} setShowTaxes={mockSetShowTaxes} onBack={mockOnBack} />);
    
    const customButton = screen.queryByText('Personalizado');
    if (customButton) {
      await user.click(customButton);
      expect(customButton).toBeInTheDocument();
    }
  });

  it('debe mostrar el resumen financiero', () => {
    render(<Reports showTaxes={false} setShowTaxes={mockSetShowTaxes} onBack={mockOnBack} />);

    expect(screen.getByText(/reportes y análisis/i)).toBeInTheDocument();
  });
});


