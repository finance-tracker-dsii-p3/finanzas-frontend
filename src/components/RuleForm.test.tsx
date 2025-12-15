import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import RuleForm from './RuleForm';
import * as ruleServiceModule from '../services/ruleService';
import * as categoryContextModule from '../context/CategoryContext';
import type { Rule } from '../services/ruleService';

vi.mock('../services/ruleService', () => ({
  ruleService: {
    createRule: vi.fn(),
    updateRule: vi.fn(),
    previewRule: vi.fn(),
  },
}));

vi.mock('../context/CategoryContext', async () => {
  const actual = await vi.importActual('../context/CategoryContext');
  return {
    ...actual,
    useCategories: vi.fn(),
  };
});

describe('RuleForm', () => {
  const mockCategories = [
    {
      id: 1,
      name: 'Comida',
      type: 'expense' as const,
      color: '#3B82F6',
      icon: '🍔',
    },
  ];

  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(categoryContextModule.useCategories).mockReturnValue({
      categories: mockCategories,
      isLoading: false,
      error: null,
      refreshCategories: vi.fn(),
    } as unknown as ReturnType<typeof categoryContextModule.useCategories>);
    vi.mocked(ruleServiceModule.ruleService.createRule).mockResolvedValue({
      id: 1,
      name: 'Nueva Regla',
      criteria_type: 'description_contains',
      criteria_type_display: 'Descripción contiene',
      keyword: 'test',
      action_type: 'assign_category',
      action_type_display: 'Asignar categoría',
      target_category: 1,
      target_category_name: 'Comida',
      target_category_color: '#3B82F6',
      target_category_icon: '🍔',
      is_active: true,
      order: 1,
      applied_count: 0,
      created_at: '2025-01-15T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    } as Rule);
  });

  it('debe renderizar el formulario', async () => {
    render(<RuleForm onClose={mockOnClose} onSave={mockOnSave} />);

    await waitFor(() => {
      expect(screen.getByText(/crear regla automática/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar el botón de cerrar', async () => {
    render(<RuleForm onClose={mockOnClose} onSave={mockOnSave} />);

    await waitFor(() => {

      const closeButton = document.querySelector('.close-button');
      expect(closeButton).toBeInTheDocument();
    });
  });

  it('debe llamar a onClose cuando se hace clic en cerrar', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(<RuleForm onClose={mockOnClose} onSave={mockOnSave} />);

    await waitFor(() => {
      const closeButton = document.querySelector('.close-button');
      expect(closeButton).toBeInTheDocument();
    });

    const closeButton = document.querySelector('.close-button') as HTMLButtonElement;
    if (closeButton) {
      await user.click(closeButton);
    }

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('debe validar que el nombre sea requerido', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(<RuleForm onClose={mockOnClose} onSave={mockOnSave} />);

    await waitFor(() => {
      expect(screen.getByText(/crear regla automática/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/nombre de la regla/i);
    expect(nameInput).toHaveAttribute('required');

    const submitButton = screen.getByRole('button', { name: /crear|actualizar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(ruleServiceModule.ruleService.createRule).not.toHaveBeenCalled();
    });
  });

  it('debe validar que la palabra clave sea requerida para description_contains', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(<RuleForm onClose={mockOnClose} onSave={mockOnSave} />);

    await waitFor(() => {
      expect(screen.getByText(/crear regla automática/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/nombre de la regla/i);
    await user.type(nameInput, 'Regla de prueba');

    const keywordInput = screen.getByLabelText(/palabra clave/i);
    expect(keywordInput).toHaveAttribute('required');

    const submitButton = screen.getByRole('button', { name: /crear|actualizar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(ruleServiceModule.ruleService.createRule).not.toHaveBeenCalled();
    });
  });

  it('debe validar que el tipo de transacción sea requerido para transaction_type', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(<RuleForm onClose={mockOnClose} onSave={mockOnSave} />);

    await waitFor(() => {
      expect(screen.getByText(/crear regla automática/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/nombre de la regla/i);
    await user.type(nameInput, 'Regla de prueba');

    const criteriaSelect = screen.getByLabelText(/tipo de criterio/i);
    await user.selectOptions(criteriaSelect, 'transaction_type');

    await waitFor(() => {
      expect(screen.getByLabelText(/tipo de transacción/i)).toBeInTheDocument();
    });

    const transactionTypeSelect = screen.getByLabelText(/tipo de transacción/i);
    expect(transactionTypeSelect).toHaveAttribute('required');

    const submitButton = screen.getByRole('button', { name: /crear|actualizar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(ruleServiceModule.ruleService.createRule).not.toHaveBeenCalled();
    });
  });

  it('debe validar que la categoría sea requerida para assign_category', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(<RuleForm onClose={mockOnClose} onSave={mockOnSave} />);

    await waitFor(() => {
      expect(screen.getByText(/crear regla automática/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/nombre de la regla/i);
    await user.type(nameInput, 'Regla de prueba');

    const keywordInput = screen.getByLabelText(/palabra clave/i);
    await user.type(keywordInput, 'test');

    const form = document.querySelector('form');
    if (form) {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
    }

    await waitFor(() => {
      expect(ruleServiceModule.ruleService.createRule).not.toHaveBeenCalled();
    });
  });

  it('debe validar que la etiqueta sea requerida para assign_tag', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(<RuleForm onClose={mockOnClose} onSave={mockOnSave} />);

    await waitFor(() => {
      expect(screen.getByText(/crear regla automática/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/nombre de la regla/i);
    await user.type(nameInput, 'Regla de prueba');

    const keywordInput = screen.getByLabelText(/palabra clave/i);
    await user.type(keywordInput, 'test');

    const actionSelect = screen.getByLabelText(/tipo de acción/i);
    await user.selectOptions(actionSelect, 'assign_tag');

    await waitFor(() => {
      expect(screen.getByLabelText(/etiqueta/i)).toBeInTheDocument();
    });

    const form = document.querySelector('form');
    if (form) {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
    }

    await waitFor(() => {
      expect(ruleServiceModule.ruleService.createRule).not.toHaveBeenCalled();
    });
  });

  it('debe crear una regla con assign_category', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(<RuleForm onClose={mockOnClose} onSave={mockOnSave} />);

    await waitFor(() => {
      expect(screen.getByText(/crear regla automática/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/nombre de la regla/i);
    await user.type(nameInput, 'Regla de prueba');

    const keywordInput = screen.getByLabelText(/palabra clave/i);
    await user.type(keywordInput, 'test');

    const categorySelect = screen.getByLabelText(/categoría/i);
    await user.selectOptions(categorySelect, '1');

    const submitButton = screen.getByRole('button', { name: /crear|actualizar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(ruleServiceModule.ruleService.createRule).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('debe crear una regla con assign_tag', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(<RuleForm onClose={mockOnClose} onSave={mockOnSave} />);

    await waitFor(() => {
      expect(screen.getByText(/crear regla automática/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/nombre de la regla/i);
    await user.type(nameInput, 'Regla de prueba');

    const keywordInput = screen.getByLabelText(/palabra clave/i);
    await user.type(keywordInput, 'test');

    const actionSelect = screen.getByLabelText(/tipo de acción/i);
    await user.selectOptions(actionSelect, 'assign_tag');

    await waitFor(() => {
      expect(screen.getByLabelText(/etiqueta/i)).toBeInTheDocument();
    });

    const tagInput = screen.getByLabelText(/etiqueta/i);
    await user.type(tagInput, 'test-tag');

    const submitButton = screen.getByRole('button', { name: /crear|actualizar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(ruleServiceModule.ruleService.createRule).toHaveBeenCalledWith(
        expect.objectContaining({
          action_type: 'assign_tag',
          target_tag: 'test-tag',
        })
      );
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('debe crear una regla con transaction_type', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(<RuleForm onClose={mockOnClose} onSave={mockOnSave} />);

    await waitFor(() => {
      expect(screen.getByText(/crear regla automática/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/nombre de la regla/i);
    await user.type(nameInput, 'Regla de prueba');

    const criteriaSelect = screen.getByLabelText(/tipo de criterio/i);
    await user.selectOptions(criteriaSelect, 'transaction_type');

    await waitFor(() => {
      expect(screen.getByLabelText(/tipo de transacción/i)).toBeInTheDocument();
    });

    const transactionTypeSelect = screen.getByLabelText(/tipo de transacción/i);
    await user.selectOptions(transactionTypeSelect, '2');

    const categorySelect = screen.getByLabelText(/categoría/i);
    await user.selectOptions(categorySelect, '1');

    const submitButton = screen.getByRole('button', { name: /crear|actualizar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(ruleServiceModule.ruleService.createRule).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria_type: 'transaction_type',
          target_transaction_type: 2,
        })
      );
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('debe mostrar error al crear regla', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    vi.mocked(ruleServiceModule.ruleService.createRule).mockRejectedValue(new Error('Error de red'));

    render(<RuleForm onClose={mockOnClose} onSave={mockOnSave} />);

    await waitFor(() => {
      expect(screen.getByText(/crear regla automática/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/nombre de la regla/i);
    await user.type(nameInput, 'Regla de prueba');

    const keywordInput = screen.getByLabelText(/palabra clave/i);
    await user.type(keywordInput, 'test');

    const categorySelect = screen.getByLabelText(/categoría/i);
    await user.selectOptions(categorySelect, '1');

    const submitButton = screen.getByRole('button', { name: /crear|actualizar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error de red/i)).toBeInTheDocument();
    });
  });

  it('debe previsualizar una regla', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    vi.mocked(ruleServiceModule.ruleService.previewRule).mockResolvedValue({
      would_match: true,
      message: 'La regla coincidiría con 5 transacciones',
      matching_rule: undefined,
    });

    render(<RuleForm onClose={mockOnClose} onSave={mockOnSave} />);

    await waitFor(() => {
      expect(screen.getByText(/crear regla automática/i)).toBeInTheDocument();
    });

    const keywordInput = screen.getByLabelText(/palabra clave/i);
    await user.type(keywordInput, 'test');

    const previewButton = screen.getByRole('button', { name: /previsualizar/i });
    await user.click(previewButton);

    await waitFor(() => {
      expect(ruleServiceModule.ruleService.previewRule).toHaveBeenCalled();
    });
  });

  it('debe validar palabra clave para previsualizar', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(<RuleForm onClose={mockOnClose} onSave={mockOnSave} />);

    await waitFor(() => {
      expect(screen.getByText(/crear regla automática/i)).toBeInTheDocument();
    });

    const previewButton = screen.getByRole('button', { name: /previsualizar/i });
    await user.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText(/ingresa una palabra clave para previsualizar/i)).toBeInTheDocument();
    });
  });

  it('debe editar una regla existente', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    const existingRule: Rule = {
      id: 1,
      name: 'Regla existente',
      criteria_type: 'description_contains',
      criteria_type_display: 'Descripción contiene',
      keyword: 'old',
      action_type: 'assign_category',
      action_type_display: 'Asignar categoría',
      target_category: 1,
      target_category_name: 'Comida',
      target_category_color: '#3B82F6',
      target_category_icon: '🍔',
      is_active: true,
      order: 1,
      applied_count: 0,
      created_at: '2025-01-15T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    };

    vi.mocked(ruleServiceModule.ruleService.updateRule).mockResolvedValue(existingRule);

    render(<RuleForm onClose={mockOnClose} onSave={mockOnSave} ruleToEdit={existingRule} />);

    await waitFor(() => {
      expect(screen.getByText(/editar regla/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Regla existente')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/nombre de la regla/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Regla actualizada');

    const submitButton = screen.getByRole('button', { name: /crear|actualizar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(ruleServiceModule.ruleService.updateRule).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalled();
    });
  });
});

