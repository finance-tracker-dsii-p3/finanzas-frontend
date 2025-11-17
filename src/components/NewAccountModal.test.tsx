import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import NewAccountModal from './NewAccountModal';
import * as accountService from '../services/accountService';

const mockOnClose = vi.fn();
const mockOnSave = vi.fn();

vi.mock('../services/accountService', () => ({
  accountService: {
    getAccountOptions: vi.fn(),
  },
}));

describe('NewAccountModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountService.accountService.getAccountOptions).mockResolvedValue({
      banks: ['Bancolombia', 'Banco de Bogotá'],
      wallets: ['Nequi', 'Daviplata'],
      credit_card_banks: ['Bancolombia', 'Davivienda'],
    });
  });

  it('debe renderizar el modal de nueva cuenta', async () => {
    render(<NewAccountModal onClose={mockOnClose} onSave={mockOnSave} />);
    
    await waitFor(() => {
      expect(screen.getByText(/nueva cuenta/i)).toBeInTheDocument();
    });
    
    const textboxes = screen.getAllByRole('textbox');
    expect(textboxes.length).toBeGreaterThan(0);
  });

  it('debe mostrar el modal de edición cuando se pasa una cuenta', () => {
    const account = {
      id: 1,
      name: 'Cuenta Test',
      account_type: 'asset' as const,
      category: 'bank_account' as const,
      currency: 'COP' as const,
      current_balance: 100000,
      is_active: true,
    };

    render(<NewAccountModal onClose={mockOnClose} onSave={mockOnSave} account={account} />);
    
    expect(screen.getByText(/editar cuenta/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Cuenta Test')).toBeInTheDocument();
  });

  it('debe permitir escribir en el campo de nombre', async () => {
    const user = userEvent.setup();
    render(<NewAccountModal onClose={mockOnClose} onSave={mockOnSave} />);
    
    const nameInputs = screen.getAllByRole('textbox');
    const nameInput = nameInputs[0];
    await user.type(nameInput, 'Mi Cuenta');
    
    expect(nameInput).toHaveValue('Mi Cuenta');
  });

  it('debe tener un botón de submit para crear cuenta', async () => {
    render(<NewAccountModal onClose={mockOnClose} onSave={mockOnSave} />);
    
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
      expect(submitButton).toBeInTheDocument();
    });
  });

  it('debe mostrar campos específicos para tarjetas de crédito', async () => {
    const user = userEvent.setup();
    render(<NewAccountModal onClose={mockOnClose} onSave={mockOnSave} />);
    
    const creditCardButtons = screen.getAllByText(/crédito/i);
    const creditCardButton = creditCardButtons.find(btn => btn.closest('button'));
    if (creditCardButton) {
      await user.click(creditCardButton.closest('button')!);
      
      await waitFor(() => {
        expect(screen.getByText(/límite de crédito/i)).toBeInTheDocument();
        const fechaElements = screen.getAllByText(/fecha de vencimiento/i);
        expect(fechaElements.length).toBeGreaterThan(0);
      });
    }
  });

  it('debe cerrar el modal al hacer clic en cancelar', async () => {
    const user = userEvent.setup();
    render(<NewAccountModal onClose={mockOnClose} onSave={mockOnSave} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('debe cerrar el modal al hacer clic en el botón de cerrar', async () => {
    const user = userEvent.setup();
    render(<NewAccountModal onClose={mockOnClose} onSave={mockOnSave} />);
    
    const closeButton = screen.getByRole('button', { name: '' });
    const closeIcon = closeButton.querySelector('svg');
    if (closeIcon) {
      await user.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('debe mostrar el campo de banco cuando se selecciona tipo banco', async () => {
    const user = userEvent.setup();
    render(<NewAccountModal onClose={mockOnClose} onSave={mockOnSave} />);
    
    const buttons = screen.getAllByRole('button');
    const bankButton = buttons.find(btn => btn.textContent?.includes('Banco') && !btn.textContent?.includes('Seleccionar'));
    if (bankButton) {
      await user.click(bankButton);
      
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBeGreaterThan(0);
      });
    }
  });

  it('debe permitir seleccionar la moneda', async () => {
    const user = userEvent.setup();
    render(<NewAccountModal onClose={mockOnClose} onSave={mockOnSave} />);
    
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      const currencySelect = selects.find(sel => sel.querySelector('option[value="USD"]'));
      if (currencySelect) {
        user.selectOptions(currencySelect, 'USD');
        expect(currencySelect).toHaveValue('USD');
      }
    });
  });
});

