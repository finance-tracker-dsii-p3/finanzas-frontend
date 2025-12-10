import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import BaseCurrencySettings from './BaseCurrencySettings';
import * as baseCurrencyService from '../services/baseCurrencyService';

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
    vi.mocked(baseCurrencyService.baseCurrencyService.getBaseCurrency).mockResolvedValue({
      base_currency: 'COP',
      updated_at: '2025-01-01T00:00:00Z',
      available_currencies: ['COP', 'USD', 'EUR'],
    });

    render(<BaseCurrencySettings />);

    await waitFor(() => {
      const elements = screen.getAllByText(/moneda base/i);
      expect(elements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('debe mostrar la moneda base actual', async () => {
    vi.mocked(baseCurrencyService.baseCurrencyService.getBaseCurrency).mockResolvedValue({
      base_currency: 'USD',
      updated_at: '2025-01-01T00:00:00Z',
      available_currencies: ['COP', 'USD', 'EUR'],
    });

    render(<BaseCurrencySettings />);

    await waitFor(() => {
      expect(screen.getByText(/usd/i)).toBeInTheDocument();
    });
  });
});

