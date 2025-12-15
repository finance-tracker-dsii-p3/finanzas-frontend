import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import BaseCurrencySelector from './BaseCurrencySelector';
import * as baseCurrencyServiceModule from '../services/baseCurrencyService';

vi.mock('../services/baseCurrencyService', () => ({
  baseCurrencyService: {
    getBaseCurrency: vi.fn(),
    setBaseCurrency: vi.fn(),
  },
}));

describe('BaseCurrencySelector', () => {
  const mockOnCurrencyChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(baseCurrencyServiceModule.baseCurrencyService.getBaseCurrency).mockResolvedValue({
      base_currency: 'COP',
      updated_at: '2025-01-01T00:00:00Z',
      available_currencies: ['COP', 'USD', 'EUR'],
    });
  });

  it('debe renderizar el selector', async () => {
    render(<BaseCurrencySelector />);

    await waitFor(() => {
      expect(screen.getByText(/moneda base/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar la moneda base actual', async () => {
    render(<BaseCurrencySelector />);

    await waitFor(() => {
      expect(screen.getByText(/\$ COP/i)).toBeInTheDocument();
    });
  });

  it('debe abrir el dropdown al hacer clic', async () => {
    const user = userEvent.setup();
    render(<BaseCurrencySelector />);

    await waitFor(() => {
      expect(screen.getByText(/\$ COP/i)).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/\$ USD/i)).toBeInTheDocument();
      expect(screen.getByText(/€ EUR/i)).toBeInTheDocument();
    });
  });

  it('debe cambiar la moneda cuando se selecciona una nueva', async () => {
    const user = userEvent.setup();
    vi.mocked(baseCurrencyServiceModule.baseCurrencyService.setBaseCurrency).mockResolvedValue({
      base_currency: 'USD',
      updated_at: '2025-01-01T00:00:00Z',
      message: 'Moneda actualizada',
    });

    render(<BaseCurrencySelector onCurrencyChange={mockOnCurrencyChange} />);

    await waitFor(() => {
      expect(screen.getByText(/\$ COP/i)).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/\$ USD/i)).toBeInTheDocument();
    });

    const usdOption = screen.getByText(/\$ USD/i).closest('button');
    if (usdOption) {
      await user.click(usdOption);
    }

    await waitFor(() => {
      expect(baseCurrencyServiceModule.baseCurrencyService.setBaseCurrency).toHaveBeenCalledWith(
        'USD'
      );
      expect(mockOnCurrencyChange).toHaveBeenCalledWith('USD');
    });
  });

  it('debe mostrar mensaje de éxito al cambiar la moneda', async () => {
    const user = userEvent.setup();
    vi.mocked(baseCurrencyServiceModule.baseCurrencyService.setBaseCurrency).mockResolvedValue({
      base_currency: 'USD',
      updated_at: '2025-01-01T00:00:00Z',
      message: 'Moneda actualizada exitosamente',
    });

    render(<BaseCurrencySelector />);

    await waitFor(() => {
      expect(screen.getByText(/\$ COP/i)).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/\$ USD/i)).toBeInTheDocument();
    });

    const usdOption = screen.getByText(/\$ USD/i).closest('button');
    if (usdOption) {
      await user.click(usdOption);
    }

    await waitFor(() => {
      expect(screen.getByText(/moneda actualizada exitosamente/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar error cuando falla el cambio de moneda', async () => {
    const user = userEvent.setup();
    vi.mocked(baseCurrencyServiceModule.baseCurrencyService.setBaseCurrency).mockRejectedValue(
      new Error('Error al actualizar')
    );

    render(<BaseCurrencySelector />);

    await waitFor(() => {
      expect(screen.getByText(/\$ COP/i)).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/\$ USD/i)).toBeInTheDocument();
    });

    const usdOption = screen.getByText(/\$ USD/i).closest('button');
    if (usdOption) {
      await user.click(usdOption);
    }

    await waitFor(() => {
      expect(screen.getByText(/error al actualizar/i)).toBeInTheDocument();
    });
  });

  it('debe cerrar el dropdown al hacer clic fuera', async () => {
    const user = userEvent.setup();
    render(<BaseCurrencySelector />);

    await waitFor(() => {
      expect(screen.getByText(/\$ COP/i)).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/\$ USD/i)).toBeInTheDocument();
    });

    // Hacer clic fuera del dropdown
    await user.click(document.body);

    await waitFor(() => {
      expect(screen.queryByText(/\$ USD/i)).not.toBeInTheDocument();
    });
  });

  it('no debe cambiar si se selecciona la misma moneda', async () => {
    const user = userEvent.setup();
    render(<BaseCurrencySelector />);

    await waitFor(() => {
      const copElements = screen.getAllByText(/\$ COP/i);
      expect(copElements.length).toBeGreaterThan(0);
    });

    const buttons = screen.getAllByRole('button');
    const mainButton = buttons[0];
    await user.click(mainButton);

    await waitFor(() => {
      const copOptions = screen.getAllByText(/\$ COP/i);
      expect(copOptions.length).toBeGreaterThan(1); // Botón principal + opción en dropdown
    });

    // Buscar la opción activa en el dropdown (no el botón principal)
    const allButtons = screen.getAllByRole('button');
    const dropdownOption = allButtons.find((btn) => {
      const text = btn.textContent;
      return text?.includes('$ COP') && btn !== mainButton && btn.classList.contains('active');
    });

    if (dropdownOption) {
      await user.click(dropdownOption);
    }

    // No debe llamar al servicio porque es la misma moneda
    expect(baseCurrencyServiceModule.baseCurrencyService.setBaseCurrency).not.toHaveBeenCalled();
  });

  it('debe mostrar estado de carga al cambiar moneda', async () => {
    const user = userEvent.setup();
    vi.mocked(baseCurrencyServiceModule.baseCurrencyService.setBaseCurrency).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<BaseCurrencySelector />);

    await waitFor(() => {
      expect(screen.getByText(/\$ COP/i)).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/\$ USD/i)).toBeInTheDocument();
    });

    const usdOption = screen.getByText(/\$ USD/i).closest('button');
    if (usdOption) {
      await user.click(usdOption);
    }

    // Debe mostrar el loader
    await waitFor(() => {
      const loader = screen.queryByRole('button');
      expect(loader).toBeDisabled();
    });
  });
});
