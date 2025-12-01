import React, { useMemo, useState, useEffect, useRef } from 'react';
import { XCircle, TrendingDown, TrendingUp, ArrowRight, Tag, Target, AlertCircle } from 'lucide-react';
import './NewMovementModal.css';
import { useCategories } from '../context/CategoryContext';
import { useBudgets } from '../context/BudgetContext';
import { transactionService, CreateTransactionData, UpdateTransactionData, TransactionType, Transaction } from '../services/transactionService';
import { accountService, Account } from '../services/accountService';
import { goalService, Goal } from '../services/goalService';
import { formatMoney, getCurrencyDisplay, Currency, getExchangeRate, convertCurrency, pesosToCents } from '../utils/currencyUtils';
import ConfirmModal from './ConfirmModal';

interface NewMovementModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  transactionToEdit?: Transaction;
  transactionToDuplicate?: Transaction;
}

const NewMovementModal: React.FC<NewMovementModalProps> = ({ onClose, onSuccess, transactionToEdit, transactionToDuplicate }) => {
  const { getActiveCategoriesByType, createCategory, refreshCategories } = useCategories();
  const { getBudgetByCategory, refreshBudgets } = useBudgets();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<{
    id: number;
    category_name: string;
    amount: string;
    spent_amount: string;
    calculation_mode: 'base' | 'total';
    calculation_mode_display?: string;
    alert_threshold: string;
  } | null>(null);
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [goalAmount, setGoalAmount] = useState<string>('');
  const [transactionCurrency, setTransactionCurrency] = useState<Currency | null>(null);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isLoadingConversion, setIsLoadingConversion] = useState(false);
  const [currencyWarning, setCurrencyWarning] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const isEdit = !!transactionToEdit;
  const isDuplicate = !!transactionToDuplicate;
  const sourceTransaction = transactionToEdit || transactionToDuplicate;

  const getInitialFormData = () => {
    if (sourceTransaction) {
      const type = sourceTransaction.type === 1 ? 'income' : sourceTransaction.type === 2 ? 'expense' : sourceTransaction.type === 3 ? 'transfer' : 'expense';
      const baseAmount = sourceTransaction.base_amount || 0;
      const taxRate = sourceTransaction.tax_percentage || 0;
      const totalAmount = sourceTransaction.total_amount || baseAmount;
      
      return {
        type: type as 'income' | 'expense' | 'transfer',
        date: isDuplicate ? new Date().toISOString().split('T')[0] : (sourceTransaction.date || new Date().toISOString().split('T')[0]),
        note: isDuplicate ? (sourceTransaction.note ? `${sourceTransaction.note} (duplicado)` : 'Duplicado') : (sourceTransaction.note || ''),
        tag: sourceTransaction.tag || '',
        category: sourceTransaction.category?.toString() || '',
        originAccount: sourceTransaction.origin_account?.toString() || '',
        destinationAccount: sourceTransaction.destination_account?.toString() || '',
        amount: totalAmount.toString(),
        base: baseAmount.toString(),
        taxRate: taxRate || 0,
      };
    }
    
    return {
      type: 'expense' as 'income' | 'expense' | 'transfer',
    date: new Date().toISOString().split('T')[0],
      note: '',
      tag: '',
    category: '',
      originAccount: '',
      destinationAccount: '',
    amount: '',
    base: '',
      taxRate: 0, // Por defecto sin IVA
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());
  const getInitialMode = (): 'total' | 'base' => {
    if (sourceTransaction) {
      const taxRate = sourceTransaction.tax_percentage || 0;
      const totalAmount = sourceTransaction.total_amount || 0;
      const baseAmount = sourceTransaction.base_amount || 0;
      if (taxRate > 0 && totalAmount > baseAmount) {
        return 'total';
      }
    }
    return 'total';
  };
  const [calculationMode, setCalculationMode] = useState<'total' | 'base'>(getInitialMode());

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    const loadGoals = async () => {
      if (formData.type === 'income' && !isEdit) {
        setIsLoadingGoals(true);
        try {
          const goalsData = await goalService.list();
          const activeGoals = goalsData.filter(goal => !goal.is_completed);
          setGoals(activeGoals);
        } catch {
          setGoals([]);
        } finally {
          setIsLoadingGoals(false);
        }
      } else {
        setGoals([]);
        setSelectedGoal(null);
        setGoalAmount('');
        setTransactionCurrency(null);
        setConvertedAmount(null);
        setExchangeRate(null);
        setCurrencyWarning(null);
      }
    };

    loadGoals();
  }, [formData.type, isEdit]);

  useEffect(() => {
    if (formData.type === 'income' && formData.originAccount && selectedGoal) {
      const account = accounts.find(acc => acc.id?.toString() === formData.originAccount);
      const goal = goals.find(g => g.id === selectedGoal);
      
      if (account && goal) {
        if (!transactionCurrency) {
          setTransactionCurrency(account.currency);
        }
        
        if (account.currency !== goal.currency) {
          const accountCurrency = account.currency || 'COP';
          const goalCurrency = goal.currency || 'COP';
          setCurrencyWarning(
            `⚠️ La cuenta está en ${getCurrencyDisplay(accountCurrency)} pero la meta está en ${getCurrencyDisplay(goalCurrency)}. ` +
            `Las transacciones deben estar en la misma moneda que la meta. ` +
            `Por favor, selecciona una cuenta en ${getCurrencyDisplay(goalCurrency)} o crea una nueva meta en ${getCurrencyDisplay(accountCurrency)}.`
          );
        } else {
          setCurrencyWarning(null);
        }
      }
    } else {
      setCurrencyWarning(null);
    }
  }, [formData.originAccount, selectedGoal, accounts, goals, formData.type, transactionCurrency]);

  useEffect(() => {
    const handleConversion = async () => {
      if (!formData.originAccount || !transactionCurrency || !goalAmount) {
        setConvertedAmount(null);
        setExchangeRate(null);
        return;
      }

      const account = accounts.find(acc => acc.id?.toString() === formData.originAccount);
      if (!account) {
        setConvertedAmount(null);
        setExchangeRate(null);
        return;
      }

      if (transactionCurrency !== account.currency) {
        setIsLoadingConversion(true);
        try {
          const token = localStorage.getItem('token');
          if (!token) return;

          const goalAmountNum = parseFloat(goalAmount);
          if (isNaN(goalAmountNum) || goalAmountNum <= 0) {
            setConvertedAmount(null);
            setExchangeRate(null);
            return;
          }

          const amountInCents = pesosToCents(goalAmountNum);
          
          const rateData = await getExchangeRate(transactionCurrency, account.currency, token);
          setExchangeRate(rateData.rate);

          const conversionData = await convertCurrency(amountInCents, transactionCurrency, account.currency, token);
          setConvertedAmount(conversionData.converted_amount);
        } catch {
          setConvertedAmount(null);
          setExchangeRate(null);
        } finally {
          setIsLoadingConversion(false);
        }
      } else {
        setConvertedAmount(null);
        setExchangeRate(null);
      }
    };

    handleConversion();
  }, [transactionCurrency, goalAmount, formData.originAccount, accounts]);

  useEffect(() => {
    const loadBudget = async () => {
      if (formData.type === 'expense' && formData.category) {
        setIsLoadingBudget(true);
        setSelectedBudget(null);
        try {
          const categoryId = parseInt(formData.category);
          const response = await getBudgetByCategory(categoryId, true);
          const monthlyBudget = response.budgets.find(b => b.period === 'monthly' && b.is_active);
          if (monthlyBudget) {
            setSelectedBudget(monthlyBudget);
          }
        } catch {
          setSelectedBudget(null);
        } finally {
          setIsLoadingBudget(false);
        }
      } else {
        setSelectedBudget(null);
      }
    };

    loadBudget();
  }, [formData.category, formData.type, getBudgetByCategory]);

  useEffect(() => {
    const sourceTransaction = transactionToEdit || transactionToDuplicate;
    if (sourceTransaction) {
      const type = sourceTransaction.type === 1 ? 'income' : sourceTransaction.type === 2 ? 'expense' : sourceTransaction.type === 3 ? 'transfer' : 'expense';
      const baseAmount = sourceTransaction.base_amount || 0;
      const taxRate = sourceTransaction.tax_percentage || 0;
      const totalAmount = sourceTransaction.total_amount || baseAmount;
      
      const shouldUseTotalMode = taxRate > 0 && totalAmount > baseAmount;
      setCalculationMode(shouldUseTotalMode ? 'total' : 'base');
      
      setFormData({
        type: type as 'income' | 'expense' | 'transfer',
        date: isDuplicate ? new Date().toISOString().split('T')[0] : (sourceTransaction.date || new Date().toISOString().split('T')[0]),
        note: isDuplicate ? (sourceTransaction.note ? `${sourceTransaction.note} (duplicado)` : 'Duplicado') : (sourceTransaction.note || ''),
        tag: sourceTransaction.tag || '',
        category: sourceTransaction.category?.toString() || '',
        originAccount: sourceTransaction.origin_account?.toString() || '',
        destinationAccount: sourceTransaction.destination_account?.toString() || '',
        amount: totalAmount.toString(),
        base: baseAmount.toString(),
        taxRate: taxRate || 0,
      });
    }
  }, [transactionToEdit, transactionToDuplicate, isDuplicate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const loadAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const accountsData = await accountService.getAllAccounts();
      const activeAccounts = accountsData.filter(acc => acc.is_active !== false);
      setAccounts(activeAccounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cuentas');
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const getAccountAvailableBalance = (accountId: string): { available: number; isCredit: boolean; limit?: number } | null => {
    const account = accounts.find(acc => acc.id?.toString() === accountId);
    if (!account) return null;

    if (account.account_type === 'liability') {
      const limit = account.credit_limit || 0;
      const debt = Math.abs(account.current_balance); // La deuda es negativa, tomamos el valor absoluto
      const available = limit - debt;
      return { available, isCredit: true, limit };
    } else {
      return { available: account.current_balance, isCredit: false };
    }
  };

  const validateAccountBalance = (accountId: string, amount: number, isExpense: boolean): string | null => {
    const accountInfo = getAccountAvailableBalance(accountId);
    if (!accountInfo) return null;

    if (accountInfo.isCredit) {
      if (isExpense && amount > accountInfo.available) {
        return `El monto excede el crédito disponible. Crédito disponible: ${formatCurrency(accountInfo.available)}, Límite: ${formatCurrency(accountInfo.limit || 0)}`;
      }
    } else {
      if (isExpense && amount > accountInfo.available) {
        return `El monto excede el saldo disponible. Saldo disponible: ${formatCurrency(accountInfo.available)}`;
      }
    }

    return null;
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      setIsCreatingCategory(true);
      setError(null); // Limpiar errores previos
      const categoryType = formData.type === 'income' ? 'income' : 'expense';
      const payload = {
        name: newCategoryName.trim(),
        type: categoryType as 'income' | 'expense',
      };
      const newCategory = await createCategory(payload);
      
      try {
        await refreshCategories({ active_only: false });
      } catch {
        // Intentionally empty
      }
      
      if (newCategory?.id) {
        setFormData({ ...formData, category: newCategory.id.toString() });
      }
      setNewCategoryName('');
      setShowNewCategoryForm(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear categoría';
      setError(errorMessage);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const availableCategories = useMemo(() => {
    if (formData.type === 'transfer') {
      return [];
    }
    const type = formData.type === 'income' ? 'income' : 'expense';
    const categories = getActiveCategoriesByType(type);
    return categories.filter((cat) => cat && cat.id != null);
  }, [formData.type, getActiveCategoriesByType]);

  const getTransactionType = (): TransactionType => {
    if (formData.type === 'income') return 1;
    if (formData.type === 'expense') return 2;
    return 3; // transfer
  };

  const calculateBreakdown = (total: number, taxPercent?: number, accountId?: string, transactionType?: 'income' | 'expense' | 'transfer') => {
    if (!taxPercent || taxPercent === 0) {
      return {
        base: total,
        tax: 0,
        gmf: 0,
        total: total,
      };
    }

    const taxRate = taxPercent / 100;
    const base = total / (1 + taxRate);
    const tax = total - base;
    
    let gmf = 0;
    const accountIdToUse = accountId || formData.originAccount;
    const transactionTypeToUse = transactionType || formData.type;
    
    if (accountIdToUse) {
      const originAccount = accounts.find(acc => acc.id?.toString() === accountIdToUse);
      if (originAccount) {
        const isCreditCard = originAccount.account_type === 'liability' || originAccount.category === 'credit_card';
        const isExempt = originAccount.gmf_exempt === true;
        const isApplicableTransaction = transactionTypeToUse === 'expense' || transactionTypeToUse === 'transfer';
        
        if (isApplicableTransaction && !isCreditCard && !isExempt) {
          gmf = (base + tax) * 0.004;
        }
      }
    }
    
    const finalTotal = base + tax + gmf;

    return {
      base: Math.round(base),
      tax: Math.round(tax),
      gmf: Math.round(gmf),
      total: Math.round(finalTotal),
    };
  };

  const handleAmountChange = (value: string, mode: 'total' | 'base') => {
    if (mode === 'total') {
      const total = parseFloat(value) || 0;
      const breakdown = calculateBreakdown(total, formData.taxRate);
      setFormData({ 
        ...formData, 
        amount: value, 
        base: breakdown.base.toString() 
      });
    } else {
      const base = parseFloat(value) || 0;
      const iva = formData.taxRate > 0 ? base * (formData.taxRate / 100) : 0;
      const total = base + iva;
      setFormData({ ...formData, base: value, amount: total.toFixed(2) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.originAccount) {
      setError('Debes seleccionar una cuenta origen');
      return;
    }

    const originAccount = accounts.find(acc => acc.id?.toString() === formData.originAccount);
    if (!originAccount || originAccount.is_active === false) {
      setError('La cuenta origen seleccionada no está activa');
      return;
    }

    if (formData.type === 'transfer') {
      if (!formData.destinationAccount) {
        setError('Las transferencias requieren una cuenta destino');
        return;
      }

      const destinationAccount = accounts.find(acc => acc.id?.toString() === formData.destinationAccount);
      if (!destinationAccount || destinationAccount.is_active === false) {
        setError('La cuenta destino seleccionada no está activa');
        return;
      }

      if (formData.originAccount === formData.destinationAccount) {
        setError('Las cuentas origen y destino deben ser diferentes');
        return;
      }
    }

    const totalAmount = parseFloat(formData.amount) || 0;
    if (totalAmount <= 0) {
      setError('El total debe ser mayor a cero');
      return;
    }

    if (formData.taxRate !== undefined && formData.taxRate !== null && formData.taxRate !== 0) {
      if (formData.taxRate < 0 || formData.taxRate > 30) {
        setError('La tasa de IVA debe estar entre 0 y 30%');
        return;
      }
    }

    const baseAmount = parseFloat(formData.base) || totalAmount;

    if (formData.type !== 'transfer' && !formData.category) {
      setError('Debes seleccionar una categoría para ingresos y gastos');
      return;
    }

    if (formData.type === 'income' && selectedGoal) {
      if (!goalAmount || parseFloat(goalAmount) <= 0) {
        setError('Debes ingresar un monto válido para asignar a la meta');
        return;
      }
      const goalAmountNum = parseFloat(goalAmount);
      if (goalAmountNum > totalAmount) {
        setError('El monto a asignar no puede ser mayor al total del ingreso');
        return;
      }
      const selectedGoalData = goals.find(g => g.id === selectedGoal);
      if (selectedGoalData) {
        const goalCurrency = selectedGoalData.currency || 'COP';
        const remainingInPesos = selectedGoalData.remaining_amount / 100;
        const finalAmount = convertedAmount ? convertedAmount / 100 : goalAmountNum;
        if (finalAmount > remainingInPesos) {
          setError(`El monto excede lo que falta para alcanzar la meta (${formatMoney(selectedGoalData.remaining_amount, goalCurrency)})`);
          return;
        }
      }
    }

    const breakdown = calculateBreakdown(totalAmount, formData.taxRate || undefined);
    const finalTotal = breakdown.total;
    
    if (formData.type === 'expense' && formData.originAccount) {
      const balanceWarning = validateAccountBalance(formData.originAccount, finalTotal, true);
      if (balanceWarning) {
        setConfirmModal({
          isOpen: true,
          title: 'Advertencia de límite',
          message: `${balanceWarning}\n\n¿Deseas continuar de todas formas? El backend validará el límite.`,
          onConfirm: () => {
            setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
            submitTransaction(totalAmount, baseAmount);
          },
        });
        return;
      }
    }

    submitTransaction(totalAmount, baseAmount);
  };

  const submitTransaction = async (totalAmount: number, baseAmount: number) => {
    try {
      setIsSubmitting(true);
      
      const transactionData: CreateTransactionData = {
        origin_account: Number(formData.originAccount),
        type: getTransactionType(),
        date: formData.date,
      };

      const convertToCents = (amount: number): number => {
        return Math.round(amount * 100);
      };

      if (calculationMode === 'total') {
        transactionData.total_amount = convertToCents(totalAmount);
        if (formData.taxRate > 0) {
          transactionData.tax_percentage = formData.taxRate;
        }
      } else {
        transactionData.base_amount = convertToCents(baseAmount);
        if (formData.taxRate > 0) {
          transactionData.tax_percentage = formData.taxRate;
        }
      }

      if (formData.type !== 'transfer' && formData.category) {
        transactionData.category = Number(formData.category);
      }

      if (formData.type === 'transfer' && formData.destinationAccount) {
        transactionData.destination_account = Number(formData.destinationAccount);
      }

      const tagValue = formData.tag.trim();
      const noteValue = formData.note.trim();
      if (tagValue) {
        transactionData.tag = tagValue;
      }
      if (noteValue) {
        transactionData.note = noteValue;
      }

      if (calculationMode === 'total' && 'base_amount' in transactionData) {
        delete transactionData.base_amount;
      }
      if (calculationMode === 'base' && 'total_amount' in transactionData) {
        if (transactionData.total_amount === undefined || transactionData.total_amount === null) {
          delete transactionData.total_amount;
        }
      }

      if (isEdit && transactionToEdit) {
        const updateData: UpdateTransactionData = {
          origin_account: transactionData.origin_account,
          type: transactionData.type,
          date: transactionData.date,
        };
        
        if (transactionData.total_amount !== undefined) {
          updateData.total_amount = transactionData.total_amount;
        } else if (transactionData.base_amount !== undefined) {
          updateData.base_amount = transactionData.base_amount;
        }
        
        if (transactionData.tax_percentage !== undefined && transactionData.tax_percentage !== null) {
          updateData.tax_percentage = transactionData.tax_percentage;
        }
        
        if (transactionData.destination_account !== undefined) {
          updateData.destination_account = transactionData.destination_account;
        }
        
        if (transactionData.category !== undefined) {
          updateData.category = transactionData.category;
        }
        
        if (transactionData.tag !== undefined) {
          updateData.tag = transactionData.tag;
        }
        
        if (transactionData.note !== undefined) {
          updateData.note = transactionData.note;
        }
        
        await transactionService.update(transactionToEdit.id, updateData);
      } else {
        await transactionService.create(transactionData);
        
        if (formData.type === 'income' && selectedGoal && goalAmount) {
            const goalAmountNum = parseFloat(goalAmount);
            if (goalAmountNum > 0 && goalAmountNum <= totalAmount) {
              try {
                const originAccount = accounts.find(acc => acc.id?.toString() === formData.originAccount);
              const goal = goals.find(g => g.id === selectedGoal);
              
              if (!originAccount || !goal) {
                  throw new Error('Cuenta o meta no encontrada');
                }

                const finalAmount = convertedAmount || pesosToCents(goalAmountNum);
              
                const savingTransactionData: CreateTransactionData = {
                  origin_account: Number(formData.originAccount),
                  type: 4,
                  date: formData.date,
                  base_amount: finalAmount,
                  goal: selectedGoal,
                  note: `Ahorro asignado desde ingreso${formData.note ? `: ${formData.note}` : ''}`,
                };

                if (transactionCurrency && transactionCurrency !== originAccount.currency && exchangeRate) {
                  savingTransactionData.transaction_currency = transactionCurrency;
                  savingTransactionData.exchange_rate = exchangeRate;
                  savingTransactionData.original_amount = pesosToCents(goalAmountNum);
                }

                await transactionService.create(savingTransactionData);
              } catch {
                // Intentionally empty
              }
          }
        }
      }

      const eventType = isEdit ? 'transactionUpdated' : 'transactionCreated';
      window.dispatchEvent(new Event(eventType));

      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        await refreshBudgets({ active_only: true, period: 'monthly' });
      } catch {
        // Intentionally empty
      }
      
      setTimeout(async () => {
        try {
          await refreshBudgets({ active_only: true, period: 'monthly' });
        } catch {
          // Intentionally empty
        }
      }, 2000);

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar el movimiento';
      setError(errorMessage);
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(Math.abs(numAmount));
  };

  const BudgetInfo: React.FC<{
    budget: {
      id: number;
      category_name: string;
      amount: string;
      spent_amount: string;
      calculation_mode: 'base' | 'total';
      calculation_mode_display?: string;
      alert_threshold: string;
    };
    transactionAmount: number;
    breakdown: { base: number; tax: number; gmf: number; total: number };
    formatCurrency: (amount: number | string) => string;
  }> = ({ budget, transactionAmount, breakdown, formatCurrency }) => {
    const budgetCalculationMode = budget.calculation_mode || 'base';
    const amountToUse = budgetCalculationMode === 'total' ? breakdown.total : breakdown.base;
    
    const currentSpent = parseFloat(budget.spent_amount || '0');
    const budgetLimit = parseFloat(budget.amount || '0');
    const newSpent = currentSpent + amountToUse;
    const newPercentage = budgetLimit > 0 ? (newSpent / budgetLimit) * 100 : 0;
    const currentPercentage = budgetLimit > 0 ? (currentSpent / budgetLimit) * 100 : 0;
    const newRemaining = budgetLimit - newSpent;
    
    const willExceed = newSpent > budgetLimit;
    const willReachWarning = newPercentage >= parseFloat(budget.alert_threshold || '80') && currentPercentage < parseFloat(budget.alert_threshold || '80');
    const isWarning = currentPercentage >= parseFloat(budget.alert_threshold || '80') && currentPercentage < 100;
    const isExceeded = currentPercentage >= 100;

    const getStatusColor = () => {
      if (willExceed || isExceeded) return 'bg-red-50 border-red-200 text-red-800';
      if (willReachWarning || isWarning) return 'bg-amber-50 border-amber-200 text-amber-800';
      return 'bg-blue-50 border-blue-200 text-blue-800';
    };

    const getStatusIcon = () => {
      if (willExceed || isExceeded) return '🚨';
      if (willReachWarning || isWarning) return '⚠️';
      return '📊';
    };

    return (
      <div className={`p-4 border rounded-lg ${getStatusColor()}`}>
        <div className="flex items-start gap-2 mb-3">
          <span className="text-lg">{getStatusIcon()}</span>
          <div className="flex-1">
            <p className="font-semibold text-sm mb-1">Presupuesto: {budget.category_name}</p>
            <p className="text-xs opacity-90">
              Modo: {budget.calculation_mode_display || (budgetCalculationMode === 'total' ? 'Total (con impuestos)' : 'Base (sin impuestos)')}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs opacity-90">Límite:</span>
            <span className="font-semibold">{formatCurrency(budgetLimit)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs opacity-90">Gastado actual:</span>
            <span className="font-semibold">{formatCurrency(currentSpent)} ({currentPercentage.toFixed(1)}%)</span>
          </div>

          {transactionAmount > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-90">Este gasto:</span>
                <span className="font-semibold">{formatCurrency(amountToUse)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-current border-opacity-20">
                <span className="text-xs opacity-90">Nuevo total:</span>
                <span className={`font-bold ${willExceed ? 'text-red-900' : ''}`}>
                  {formatCurrency(newSpent)} ({newPercentage.toFixed(1)}%)
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs opacity-90">Restante:</span>
                <span className={`font-semibold ${newRemaining < 0 ? 'text-red-900' : ''}`}>
                  {formatCurrency(newRemaining)}
                </span>
              </div>
            </>
          )}

          <div className="mt-3 pt-2 border-t border-current border-opacity-20">
            <div className="w-full bg-current bg-opacity-20 rounded-full h-2 mb-1">
              <div
                className={`h-full rounded-full transition-all ${
                  willExceed || isExceeded
                    ? 'bg-red-600'
                    : willReachWarning || isWarning
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(newPercentage, 100)}%` }}
              ></div>
            </div>
            {willExceed && (
              <p className="text-xs font-semibold mt-1">
                ⚠️ Este gasto hará que excedas el presupuesto por {formatCurrency(Math.abs(newRemaining))}
              </p>
            )}
            {willReachWarning && !willExceed && (
              <p className="text-xs font-semibold mt-1">
                ⚠️ Este gasto alcanzará el {budget.alert_threshold || 80}% del presupuesto
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 id="modal-title" className="text-xl font-bold text-gray-900">
              {isEdit ? 'Editar movimiento' : isDuplicate ? 'Duplicar movimiento' : 'Nuevo movimiento'}
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600"
              aria-label="Cerrar modal"
              type="button"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div 
              ref={errorRef}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm sticky top-0 z-10 shadow-sm"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-start gap-2">
                <span className="font-semibold">⚠️ Error:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de movimiento</label>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de movimiento">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.type === 'expense'
                      ? 'border-red-600 bg-red-50 text-red-700 font-semibold'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  aria-pressed={formData.type === 'expense'}
                >
                  <TrendingDown className="w-5 h-5 inline mr-2" aria-hidden="true" />
                  Gasto
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.type === 'income'
                      ? 'border-green-600 bg-green-50 text-green-700 font-semibold'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  aria-pressed={formData.type === 'income'}
                >
                  <TrendingUp className="w-5 h-5 inline mr-2" aria-hidden="true" />
                  Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'transfer', category: '' })}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.type === 'transfer'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  aria-pressed={formData.type === 'transfer'}
                >
                  <ArrowRight className="w-5 h-5 inline mr-2" aria-hidden="true" />
                  Transferencia
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="movement-date" className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <input
                  id="movement-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-required="true"
                />
              </div>

            </div>

            <div>
              <label htmlFor="movement-note" className="block text-sm font-medium text-gray-700 mb-2">Nota (opcional)</label>
              <input
                id="movement-note"
                type="text"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Ej: Almuerzo con amigos"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-describedby="note-description"
              />
              <p id="note-description" className="sr-only">Campo opcional para agregar una nota descriptiva al movimiento</p>
            </div>

            <div>
              <label htmlFor="movement-tag" className="block text-sm font-medium text-gray-700 mb-2">Etiqueta (opcional)</label>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" aria-hidden="true" />
                <input
                  id="movement-tag"
                  type="text"
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  placeholder="Ej: #hogar, #viaje"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-describedby="tag-description"
                />
              </div>
              <p id="tag-description" className="text-xs text-gray-500 mt-1">Usa etiquetas para filtrar tus movimientos fácilmente</p>
            </div>

            {formData.type === 'transfer' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="transfer-origin-account" className="block text-sm font-medium text-gray-700 mb-2">Cuenta origen *</label>
                  {isLoadingAccounts ? (
                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500" aria-live="polite" aria-busy="true">
                      Cargando cuentas...
                    </div>
                  ) : (
                  <select
                      id="transfer-origin-account"
                      value={formData.originAccount}
                      onChange={(e) => setFormData({ ...formData, originAccount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      aria-required="true"
                  >
                    <option value="">Seleccionar...</option>
                      {accounts.filter(acc => acc.id?.toString() !== formData.destinationAccount).map(acc => {
                        const accountInfo = getAccountAvailableBalance(acc.id?.toString() || '');
                        const displayName = accountInfo?.isCredit 
                          ? `${acc.name} (Crédito: ${formatCurrency(accountInfo.available)})`
                          : `${acc.name} (Saldo: ${formatCurrency(acc.current_balance)})`;
                        return (
                          <option key={acc.id} value={acc.id}>{displayName}</option>
                        );
                      })}
                  </select>
                  )}
                </div>
                <div>
                  <label htmlFor="transfer-destination-account" className="block text-sm font-medium text-gray-700 mb-2">Cuenta destino *</label>
                  {isLoadingAccounts ? (
                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500" aria-live="polite" aria-busy="true">
                      Cargando cuentas...
                    </div>
                  ) : (
                  <select
                      id="transfer-destination-account"
                      value={formData.destinationAccount}
                      onChange={(e) => setFormData({ ...formData, destinationAccount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      aria-required="true"
                  >
                    <option value="">Seleccionar...</option>
                      {accounts.filter(acc => acc.id?.toString() !== formData.originAccount).map(acc => {
                        const accountInfo = getAccountAvailableBalance(acc.id?.toString() || '');
                        const displayName = accountInfo?.isCredit 
                          ? `${acc.name} (Crédito: ${formatCurrency(accountInfo.available)})`
                          : `${acc.name} (Saldo: ${formatCurrency(acc.current_balance)})`;
                        return (
                          <option key={acc.id} value={acc.id}>{displayName}</option>
                        );
                      })}
                  </select>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="movement-category" className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                  {availableCategories.length === 0 ? (
                    <div className="px-3 py-2 border border-amber-200 rounded-lg bg-amber-50 text-sm text-amber-800 space-y-1" role="alert">
                      <p>No hay categorías activas para este tipo.</p>
                      <button
                        type="button"
                        onClick={() => setShowNewCategoryForm(true)}
                        className="text-xs text-amber-900 underline hover:text-amber-700"
                        aria-describedby="category-empty-description"
                      >
                        Crear nueva categoría
                      </button>
                      <p id="category-empty-description" className="sr-only">Botón para crear una nueva categoría para este tipo de movimiento</p>
                    </div>
                  ) : (
                    <select
                      id="movement-category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      aria-required="true"
                    >
                      <option value="">Seleccionar...</option>
                      {availableCategories.map((cat) => {
                        if (!cat || cat.id == null) return null;
                        return (
                        <option key={cat.id} value={cat.id.toString()}>
                            {cat.name || 'Sin nombre'}
                        </option>
                        );
                      })}
                    </select>
                  )}
                  
                  {formData.type === 'expense' && formData.category && (
                    <div className="mt-3">
                      {isLoadingBudget ? (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                          Cargando información del presupuesto...
                        </div>
                      ) : selectedBudget ? (
                        <BudgetInfo 
                          budget={selectedBudget} 
                          transactionAmount={parseFloat(formData.amount) || 0}
                          breakdown={calculateBreakdown(
                            parseFloat(formData.amount) || 0,
                            formData.taxRate || undefined,
                            formData.originAccount,
                            'expense'
                          )}
                          formatCurrency={formatCurrency}
                        />
                      ) : (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                          <p className="font-medium">⚠️ No hay presupuesto asignado</p>
                          <p className="text-xs mt-1">Esta categoría no tiene un presupuesto mensual activo. Los gastos no se contabilizarán en ningún presupuesto.</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {showNewCategoryForm && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg" role="region" aria-label="Formulario de nueva categoría">
                      <label htmlFor="new-category-name" className="sr-only">Nombre de la categoría</label>
                      <input
                        id="new-category-name"
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nombre de la categoría"
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm mb-2"
                        aria-required="true"
                      />
                      <div className="flex gap-2">
                      <button
                        type="button"
                          onClick={handleCreateCategory}
                          disabled={isCreatingCategory || !newCategoryName.trim()}
                          className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                          aria-busy={isCreatingCategory}
                        >
                          {isCreatingCategory ? 'Creando...' : 'Crear'}
                      </button>
                      <button
                        type="button"
                          onClick={() => {
                            setShowNewCategoryForm(false);
                            setNewCategoryName('');
                          }}
                          className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                        >
                          Cancelar
                      </button>
                      </div>
                  </div>
                )}
              </div>
              <div>
                  <label htmlFor="movement-account" className="block text-sm font-medium text-gray-700 mb-2">Cuenta *</label>
                  {isLoadingAccounts ? (
                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500" aria-live="polite" aria-busy="true">
                      Cargando cuentas...
                    </div>
                  ) : (
                    <>
                      <select
                        id="movement-account"
                        value={formData.originAccount}
                        onChange={(e) => {
                          const newOriginAccount = e.target.value;
                          if (formData.amount && formData.taxRate > 0) {
                            const total = parseFloat(formData.amount) || 0;
                            const breakdown = calculateBreakdown(total, formData.taxRate, newOriginAccount, formData.type);
                            setFormData({ 
                              ...formData,
                              originAccount: newOriginAccount,
                              base: breakdown.base.toString()
                            });
                          } else {
                            setFormData({ ...formData, originAccount: newOriginAccount });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        aria-required="true"
                      >
                        <option value="">Seleccionar...</option>
                        {accounts.map(acc => {
                          const accountInfo = getAccountAvailableBalance(acc.id?.toString() || '');
                          const displayName = accountInfo?.isCredit 
                            ? `${acc.name} (Crédito disponible: ${formatCurrency(accountInfo.available)})`
                            : `${acc.name} (Saldo: ${formatCurrency(acc.current_balance)})`;
                          return (
                            <option key={acc.id} value={acc.id}>{displayName}</option>
                          );
                        })}
                      </select>
                      {formData.originAccount && formData.type === 'expense' && (() => {
                        const accountInfo = getAccountAvailableBalance(formData.originAccount);
                        if (!accountInfo) return null;
                        const isLow = accountInfo.isCredit 
                          ? accountInfo.available < 100000 
                          : accountInfo.available < 50000;
                        if (isLow) {
                          return (
                            <p className="text-xs text-amber-600 mt-1" role="alert">
                              ⚠️ {accountInfo.isCredit ? 'Crédito disponible bajo' : 'Saldo bajo'}: {formatCurrency(accountInfo.available)}
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}
                  </div>
              </div>
            )}


            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Monto *</label>
                <div className="flex gap-2" role="radiogroup" aria-label="Modo de cálculo de monto">
                  <button
                    type="button"
                    onClick={() => {
                      setCalculationMode('total');
                      if (formData.amount) {
                        setFormData({ ...formData, taxRate: 0, base: formData.amount });
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded ${
                      calculationMode === 'total' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                    aria-pressed={calculationMode === 'total'}
                  >
                    Total con IVA
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCalculationMode('base');
                      if (formData.base) {
                        const base = parseFloat(formData.base) || 0;
                        const iva = formData.taxRate > 0 ? base * (formData.taxRate / 100) : 0;
                        setFormData({ ...formData, amount: (base + iva).toFixed(2) });
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded ${
                      calculationMode === 'base' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                    aria-pressed={calculationMode === 'base'}
                  >
                    Base sin IVA
                  </button>
                </div>
              </div>

              {calculationMode === 'total' ? (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="movement-total-amount" className="block text-xs text-gray-600 mb-1">Total a pagar *</label>
                  <input
                      id="movement-total-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                      onChange={(e) => handleAmountChange(e.target.value, 'total')}
                      onWheel={handleWheel}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                    required
                    aria-required="true"
                      aria-describedby="total-amount-description"
                    />
                    <p id="total-amount-description" className="mt-1 text-xs text-gray-500">
                      Ingresa el monto total que pagaste (incluye IVA si aplica).
                    </p>
                  </div>
                  <div>
                    <label htmlFor="movement-tax-rate-total" className="block text-xs text-gray-600 mb-1">IVA (%) (opcional)</label>
                    <input
                      id="movement-tax-rate-total"
                      type="number"
                      step="0.01"
                      min="0"
                      max="30"
                      value={formData.taxRate || ''}
                      onChange={(e) => {
                        const newRate = parseFloat(e.target.value) || 0;
                        const total = parseFloat(formData.amount) || 0;
                        const breakdown = calculateBreakdown(total, newRate > 0 ? newRate : undefined);
                        setFormData({ 
                          ...formData, 
                          taxRate: newRate,
                          base: breakdown.base.toString()
                        });
                      }}
                      onWheel={handleWheel}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-describedby="tax-rate-total-description"
                    />
                    <p id="tax-rate-total-description" className="mt-1 text-xs text-gray-500">
                      Ingresa el porcentaje de IVA (0-30%). Si no aplica, déjalo vacío.
                    </p>
                  </div>
                  {formData.taxRate > 0 && formData.amount && (
                    <div className="pt-3 border-t border-gray-300 bg-white rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Desglose calculado:</p>
                      {(() => {
                        const breakdown = calculateBreakdown(parseFloat(formData.amount) || 0, formData.taxRate);
                        return (
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Base calculada:</span>
                              <span className="font-medium">{formatCurrency(breakdown.base)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">IVA ({formData.taxRate}%):</span>
                              <span className="font-medium text-amber-600">{formatCurrency(breakdown.tax)}</span>
                            </div>
                            {(formData.type === 'expense' || formData.type === 'transfer') && breakdown.gmf > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">GMF (estimado):</span>
                                <span className="font-medium text-blue-600">{formatCurrency(breakdown.gmf)}</span>
                              </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-gray-200">
                              <span className="font-semibold text-gray-900">Total final:</span>
                              <span className="font-bold text-gray-900">{formatCurrency(breakdown.total)}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="movement-base-amount" className="block text-xs text-gray-600 mb-1">Base gravable *</label>
                    <input
                      id="movement-base-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.base}
                      onChange={(e) => handleAmountChange(e.target.value, 'base')}
                      onWheel={handleWheel}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <label htmlFor="movement-tax-rate" className="block text-xs text-gray-600 mb-1">IVA (%) (opcional)</label>
                    <input
                      id="movement-tax-rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="30"
                      value={formData.taxRate || ''}
                      onChange={(e) => {
                        const newRate = parseFloat(e.target.value) || 0;
                        const base = parseFloat(formData.base) || 0;
                        const iva = newRate > 0 ? base * (newRate / 100) : 0;
                        const total = base + iva;
                        setFormData({ ...formData, taxRate: newRate, amount: total.toFixed(2) });
                      }}
                      onWheel={handleWheel}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-describedby="tax-rate-description"
                    />
                    <p id="tax-rate-description" className="mt-1 text-xs text-gray-500">
                      Ingresa el porcentaje de IVA (0-30%). Si no aplica, déjalo vacío.
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <label className="block text-xs text-gray-600 mb-1">Total a pagar</label>
                    <p className="text-lg font-bold text-gray-900" aria-live="polite" id="total-amount-display" data-testid="total-amount-display">
                      {formatCurrency(parseFloat(formData.amount) || 0)}
                    </p>
                    {formData.base && formData.taxRate > 0 && (
                      <p className="text-xs text-gray-500 mt-1" aria-label="Desglose del total">
                        Base: {formatCurrency(parseFloat(formData.base) || 0)} + IVA ({formData.taxRate}%): {formatCurrency((parseFloat(formData.amount) || 0) - (parseFloat(formData.base) || 0))}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {formData.type === 'income' && !isEdit && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-blue-600" />
                  <label className="text-sm font-medium text-gray-700">
                    ¿Asignar parte a una meta de ahorro?
                  </label>
                </div>
                
                {isLoadingGoals ? (
                  <p className="text-sm text-gray-600">Cargando metas...</p>
                ) : goals.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    No tienes metas activas. Puedes crear una desde la sección de Metas.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="goal-select" className="block text-xs text-gray-600 mb-1">
                        Seleccionar meta (opcional)
                      </label>
                      <select
                        id="goal-select"
                        value={selectedGoal || ''}
                        onChange={(e) => {
                          const goalId = e.target.value ? parseInt(e.target.value) : null;
                          setSelectedGoal(goalId);
                          if (!goalId) {
                            setGoalAmount('');
                            setTransactionCurrency(null);
                            setConvertedAmount(null);
                            setExchangeRate(null);
                            setCurrencyWarning(null);
                          } else {
                            const account = accounts.find(acc => acc.id?.toString() === formData.originAccount);
                            if (account) {
                              setTransactionCurrency(account.currency);
                            }
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">No asignar a meta</option>
                        {goals.map(goal => {
                          const goalCurrency = goal.currency || 'COP';
                          return (
                            <option key={goal.id} value={goal.id}>
                              {goal.name} ({goal.currency_display || goalCurrency}) - Faltan: {formatMoney(goal.remaining_amount, goalCurrency)}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {currencyWarning && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-900 mb-1">⚠️ Advertencia de Moneda</p>
                            <p className="text-xs text-amber-800">{currencyWarning}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {selectedGoal && formData.originAccount && !currencyWarning && (
                      <>
                        <div>
                          <label htmlFor="transaction-currency" className="block text-xs text-gray-600 mb-1">
                            Moneda de la transacción
                          </label>
                          <select
                            id="transaction-currency"
                            value={transactionCurrency || ''}
                            onChange={(e) => {
                              setTransactionCurrency(e.target.value as Currency);
                              setConvertedAmount(null);
                              setExchangeRate(null);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="COP">Pesos Colombianos (COP)</option>
                            <option value="USD">Dólares (USD)</option>
                            <option value="EUR">Euros (EUR)</option>
                          </select>
                        </div>

                        {transactionCurrency && formData.originAccount && (() => {
                          const account = accounts.find(acc => acc.id?.toString() === formData.originAccount);
                          const goal = goals.find(g => g.id === selectedGoal);
                          
                          if (!account || !goal) return null;
                          
                          if (transactionCurrency !== account.currency) {
                            return (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs font-semibold text-blue-900 mb-2">ℹ️ Conversión de Moneda</p>
                                <p className="text-xs text-blue-800 mb-2">
                                  La cuenta está en <strong>{getCurrencyDisplay(account.currency)}</strong>.
                                  El monto se convertirá automáticamente.
                                </p>
                                {isLoadingConversion ? (
                                  <p className="text-xs text-blue-700">Cargando tasa de cambio...</p>
                                ) : exchangeRate && convertedAmount && goalAmount ? (
                                  <div className="bg-white rounded p-2 mt-2">
                                    <p className="text-xs text-gray-700">
                                      <strong>{formatMoney(pesosToCents(parseFloat(goalAmount) || 0), transactionCurrency)}</strong> = 
                                      <strong className="ml-1">{formatMoney(convertedAmount, account.currency)}</strong>
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1 italic">
                                      Tasa: 1 {transactionCurrency} = {exchangeRate.toFixed(4)} {account.currency}
                                    </p>
                                  </div>
                                ) : goalAmount ? (
                                  <p className="text-xs text-blue-700">Ingresa un monto para ver la conversión</p>
                                ) : null}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </>
                    )}
                    
                    {selectedGoal && (
                      <div>
                        <label htmlFor="goal-amount" className="block text-xs text-gray-600 mb-1">
                          Monto a asignar a la meta * (en {transactionCurrency || 'COP'})
                        </label>
                        <input
                          id="goal-amount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={formData.amount ? parseFloat(formData.amount) : undefined}
                          value={goalAmount}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue = parseFloat(value) || 0;
                            const totalAmount = parseFloat(formData.amount) || 0;
                            
                            if (numValue > totalAmount) {
                              setError(`El monto a asignar no puede ser mayor al total del ingreso (${formatCurrency(totalAmount)})`);
                            } else {
                              setError(null);
                            }
                            
                            const selectedGoalData = goals.find(g => g.id === selectedGoal);
                            if (selectedGoalData) {
                              const goalCurrency = selectedGoalData.currency || 'COP';
                              const remainingInPesos = selectedGoalData.remaining_amount / 100;
                              if (numValue > remainingInPesos) {
                                setError(`El monto excede lo que falta para alcanzar la meta (${formatMoney(selectedGoalData.remaining_amount, goalCurrency)})`);
                              }
                            }
                            
                            setGoalAmount(value);
                          }}
                          onWheel={handleWheel}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required={!!selectedGoal}
                          disabled={!!currencyWarning}
                        />
                        {goalAmount && transactionCurrency && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatMoney(pesosToCents(parseFloat(goalAmount) || 0), transactionCurrency)}
                          </p>
                        )}
                        {selectedGoal && (() => {
                          const selectedGoalData = goals.find(g => g.id === selectedGoal);
                          if (selectedGoalData) {
                            const goalCurrency = selectedGoalData.currency || 'COP';
                            const remainingInCents = selectedGoalData.remaining_amount;
                            const goalAmountNum = parseFloat(goalAmount) || 0;
                            
                            const finalAmountInCents = convertedAmount || pesosToCents(goalAmountNum);
                            
                            const newRemainingInCents = Math.max(0, remainingInCents - finalAmountInCents);
                            
                            return (
                              <p className="text-xs text-blue-600 mt-1">
                                Restante en la meta: {formatMoney(remainingInCents, goalCurrency)}
                                {goalAmountNum > 0 && (
                                  <span className="ml-2">
                                    → Nuevo restante: {formatMoney(newRemainingInCents, goalCurrency)}
                                  </span>
                                )}
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                aria-label="Cancelar y cerrar el formulario"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoadingAccounts}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                aria-busy={isSubmitting}
                aria-disabled={isSubmitting || isLoadingAccounts}
              >
                {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar movimiento' : 'Guardar movimiento'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Continuar"
        cancelText="Cancelar"
        type="warning"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </div>
  );
};

export default NewMovementModal;


