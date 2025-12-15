import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import BaseCurrencySettings from './BaseCurrencySettings';
import * as baseCurrencyServiceModule from '../services/baseCurrencyService';

vi.mock('../services/baseCurrencyService', () => ({
  baseCurrencyService: {
    getBaseCurrency: vi.fn(),
    setBaseCurrency: vi.fn(),
  },
}));

describe('BaseCurrencySettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el componente', async () => {
    vi.mocked(baseCurrencyServiceModule.baseCurrencyService.getBaseCurrency).mockResolvedValue({
      base_currency: 'COP',
      updated_at: '2025-01-01T00:00:00Z',
      available_currencies: ['COP', 'USD', 'EUR'],
    });

    render(<BaseCurrencySettings />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /moneda base/i })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('debe mostrar la moneda base actual', async () => {
    vi.mocked(baseCurrencyServiceModule.baseCurrencyService.getBaseCurrency).mockResolvedValue({
      base_currency: 'USD',
      updated_at: '2025-01-01T00:00:00Z',
      available_currencies: ['COP', 'USD', 'EUR'],
    });

    render(<BaseCurrencySettings />);

    await waitFor(() => {
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('USD');
    });
  });

  it('debe permitir cambiar la moneda base', async () => {
    const user = userEvent.setup();
    vi.mocked(baseCurrencyServiceModule.baseCurrencyService.getBaseCurrency).mockResolvedValue({
      base_currency: 'COP',
      updated_at: '2025-01-01T00:00:00Z',
      available_currencies: ['COP', 'USD', 'EUR'],
    });
    vi.mocked(baseCurrencyServiceModule.baseCurrencyService.setBaseCurrency).mockResolvedValue({
      base_currency: 'USD',
      updated_at: '2025-01-01T00:00:00Z',
      message: 'Moneda base actualizada',
    });

    render(<BaseCurrencySettings />);

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'USD');

    const saveButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(baseCurrencyServiceModule.baseCurrencyService.setBaseCurrency).toHaveBeenCalledWith('USD');
    });
  });

  it('debe mostrar error cuando falla la carga', async () => {
    vi.mocked(baseCurrencyServiceModule.baseCurrencyService.getBaseCurrency).mockRejectedValue(new Error('Error de red'));

    render(<BaseCurrencySettings />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('debe mostrar error cuando falla el guardado', async () => {
    const user = userEvent.setup();
    vi.mocked(baseCurrencyServiceModule.baseCurrencyService.getBaseCurrency).mockResolvedValue({
      base_currency: 'COP',
      updated_at: '2025-01-01T00:00:00Z',
      available_currencies: ['COP', 'USD', 'EUR'],
    });
    vi.mocked(baseCurrencyServiceModule.baseCurrencyService.setBaseCurrency).mockRejectedValue(new Error('Error al guardar'));

    render(<BaseCurrencySettings />);

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'USD');

    const saveButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

