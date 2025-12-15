import React, { useState, useEffect, useCallback } from 'react';
import { XCircle, Building2, Wallet, CreditCard, Banknote, DollarSign } from 'lucide-react';
import { Account, CreateAccountData, accountService } from '../services/accountService';
import { formatMoneyFromPesos, Currency } from '../utils/currencyUtils';
import './NewAccountModal.css';

type LocalAccountType = 'bank' | 'wallet' | 'credit_card' | 'cash' | 'other';

interface NewAccountModalProps {
  onClose: () => void;
  account?: Account | null;
  onSave: (accountData: CreateAccountData, accountId?: number) => Promise<void>;
}

const NewAccountModal: React.FC<NewAccountModalProps> = ({ onClose, account, onSave }) => {
  const categoryToLocalType = (category: Account['category']): LocalAccountType => {
    switch (category) {
      case 'bank_account':
      case 'savings_account':
        return 'bank';
      case 'credit_card':
        return 'credit_card';
      case 'wallet':
        return 'wallet';
      default:
        return 'other';
    }
  };

  const localTypeToCategory = (type: LocalAccountType): Account['category'] => {
    switch (type) {
      case 'bank':
        return 'bank_account';
      case 'wallet':
        return 'wallet';
      case 'credit_card':
        return 'credit_card';
      case 'cash':
        return 'other';
      default:
        return 'other';
    }
  };

  const initializeFormData = useCallback((accountData: Account | null) => {
    if (accountData) {
      const localType = categoryToLocalType(accountData.category);
      const expirationDate = accountData.expiration_date 
        ? accountData.expiration_date.split('T')[0] 
        : '';
      
      return {
        name: accountData.name,
        type: localType,
        bankName: accountData.bank_name || '',
        accountNumber: accountData.account_number || '',
        // El current_balance del backend ya viene en pesos (no en centavos)
        balance: accountData.current_balance.toString(),
        creditLimit: accountData.credit_limit?.toString() || '',
        currency: accountData.currency,
        isActive: accountData.is_active !== false,
        description: accountData.description || '',
        accountType: accountData.account_type,
        gmfExempt: accountData.gmf_exempt || false,
        expirationDate: expirationDate
      };
    }
    return {
      name: '',
      type: 'bank' as LocalAccountType,
      bankName: '',
      accountNumber: '',
      balance: '',
      creditLimit: '',
      currency: 'COP' as Account['currency'],
      isActive: true,
      description: '',
      accountType: 'asset' as Account['account_type'],
      gmfExempt: false,
      expirationDate: ''
    };
  }, []);

  const [formData, setFormData] = useState(() => initializeFormData(account || null));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (account && account.id) {
      const newFormData = initializeFormData(account);
      setFormData(newFormData);
      setErrors({});
    } else if (!account) {
      const emptyFormData = initializeFormData(null);
      setFormData(emptyFormData);
      setErrors({});
    }
  }, [account, initializeFormData]);

  const [banks, setBanks] = useState<string[]>([
    'Bancolombia',
    'Banco de Bogotá',
    'Davivienda',
    'Banco Popular',
    'Banco AV Villas',
    'Banco Agrario',
    'Banco Caja Social',
    'Banco Falabella',
    'Banco Pichincha',
    'BBVA Colombia',
    'Citibank',
    'Scotiabank Colpatria',
    'Otro'
  ]);

  const [wallets, setWallets] = useState<string[]>([
    'Nequi',
    'Daviplata',
    'RappiPay',
    'Ualá',
    'Lulo Bank',
    'Nu Colombia',
    'Otro'
  ]);

  const [creditCardBanks, setCreditCardBanks] = useState<string[]>([
    'Bancolombia',
    'Banco de Bogotá',
    'Davivienda',
    'Banco Popular',
    'Falabella',
    'Éxito',
    'Alkosto',
    'Otro'
  ]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const options = await accountService.getAccountOptions();
        if (options.banks && Array.isArray(options.banks) && options.banks.length > 0) {
          setBanks(options.banks);
        }
        if (options.wallets && Array.isArray(options.wallets) && options.wallets.length > 0) {
          setWallets(options.wallets);
        }
        if (options.credit_card_banks && Array.isArray(options.credit_card_banks) && options.credit_card_banks.length > 0) {
          setCreditCardBanks(options.credit_card_banks);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('no implementado')) {
          void 0;
        }
      }
    };
    
    loadOptions();
  }, []);


  const handleTypeChange = (type: LocalAccountType) => {
    let newAccountType: Account['account_type'];
    if (type === 'credit_card') {
      newAccountType = 'liability';
    } else if (formData.type === 'credit_card') {
      newAccountType = 'asset';
    } else {
      newAccountType = formData.accountType;
    }
    
    setFormData({
      ...formData,
      type,
      accountType: newAccountType,
      bankName: '',
      accountNumber: ''
    });
  };

  const formatCurrency = (amount: number, currency: Currency = 'COP'): string => {
    return formatMoneyFromPesos(Math.abs(amount), currency);
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevenir que la rueda del mouse cambie el valor del input
    e.currentTarget.blur();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const category = localTypeToCategory(formData.type);
    const isCreditCard = category === 'credit_card';
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la cuenta es requerido';
    }
    
    // Validar número de cuenta: obligatorio excepto para efectivo y otros
    // Para efectivo y otros, el número de cuenta es opcional
    if (formData.type !== 'cash' && formData.type !== 'other') {
      const accountNumberDigits = formData.accountNumber.replace(/\D/g, ''); // Solo dígitos
      const minDigitsByCurrency: Record<Account['currency'], number> = {
        'COP': 10,
        'USD': 7,
        'EUR': 8
      };
      const minDigits = minDigitsByCurrency[formData.currency] || 10;
      
      if (!formData.accountNumber.trim()) {
        newErrors.accountNumber = 'El número de cuenta es requerido';
      } else if (accountNumberDigits.length < minDigits) {
        newErrors.accountNumber = `El número de cuenta debe tener al menos ${minDigits} dígitos para cuentas en ${formData.currency}`;
      }
    }
    
    if (isCreditCard) {
      const balance = parseFloat(formData.balance) || 0;
      if (balance > 0) {
        newErrors.balance = 'Las tarjetas de crédito no pueden tener saldo positivo';
      }
      
      if (formData.creditLimit) {
        const creditLimit = parseFloat(formData.creditLimit);
        if (isNaN(creditLimit) || creditLimit <= 0) {
          newErrors.creditLimit = 'El límite de crédito debe ser mayor a cero';
        }
      }
    } else {
      if (formData.expirationDate) {
        newErrors.expirationDate = 'La fecha de vencimiento solo aplica para tarjetas de crédito';
      }
      if (formData.creditLimit) {
        newErrors.creditLimit = 'El límite de crédito solo aplica para tarjetas de crédito';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const balance = parseFloat(formData.balance) || 0;
    const category = localTypeToCategory(formData.type);
    const isCreditCard = category === 'credit_card';
    
    const accountType = isCreditCard ? 'liability' : formData.accountType;

    const accountData: CreateAccountData = {
      name: formData.name.trim(),
      account_type: accountType,
      category: category,
      currency: formData.currency,
      current_balance: balance,
      description: formData.description.trim() || undefined,
      is_active: formData.isActive,
      // GMF no aplica a tarjetas de crédito ni efectivo, siempre false para ellas
      gmf_exempt: (formData.type === 'credit_card' || formData.type === 'cash') ? false : formData.gmfExempt,
      bank_name: formData.bankName.trim() || undefined,
      // Para efectivo y otros, no enviar account_number (es opcional en el backend)
      // Para los demás tipos, enviar el número de cuenta
      account_number: (formData.type === 'cash' || formData.type === 'other') 
        ? undefined 
        : formData.accountNumber.trim() || undefined
    };
    
    if (isCreditCard) {
      if (formData.expirationDate) {
        accountData.expiration_date = formData.expirationDate;
      }
      if (formData.creditLimit) {
        const creditLimit = parseFloat(formData.creditLimit);
        if (!isNaN(creditLimit) && creditLimit > 0) {
          accountData.credit_limit = creditLimit;
        }
      }
    }

    setIsSubmitting(true);
    setGeneralError(null);
    try {
      await onSave(accountData, account?.id);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar la cuenta';
      setGeneralError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="newaccountmodal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="newaccountmodal-container bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-x-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {account ? 'Editar cuenta' : 'Nueva cuenta'}
            </h3>
            <button onClick={onClose} className="newaccountmodal-close-button text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {generalError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">Error al guardar la cuenta</p>
              <p className="text-sm text-red-600 mt-1">{generalError}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="newaccountmodal-form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de cuenta <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange('bank')}
                  className={`newaccountmodal-type-button p-3 rounded-lg border-2 transition-colors ${
                    formData.type === 'bank'
                      ? 'active border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Building2 className={`w-5 h-5 mx-auto mb-1 ${formData.type === 'bank' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`text-xs ${formData.type === 'bank' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>Banco</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('wallet')}
                  className={`newaccountmodal-type-button p-3 rounded-lg border-2 transition-colors ${
                    formData.type === 'wallet'
                      ? 'active border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Wallet className={`w-5 h-5 mx-auto mb-1 ${formData.type === 'wallet' ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`text-xs ${formData.type === 'wallet' ? 'text-green-600 font-medium' : 'text-gray-600'}`}>Billetera</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('credit_card')}
                  className={`newaccountmodal-type-button p-3 rounded-lg border-2 transition-colors ${
                    formData.type === 'credit_card'
                      ? 'active border-purple-600 bg-purple-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <CreditCard className={`w-5 h-5 mx-auto mb-1 ${formData.type === 'credit_card' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span className={`text-xs ${formData.type === 'credit_card' ? 'text-purple-600 font-medium' : 'text-gray-600'}`}>Crédito</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('cash')}
                  className={`newaccountmodal-type-button p-3 rounded-lg border-2 transition-colors ${
                    formData.type === 'cash'
                      ? 'active border-amber-600 bg-amber-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Banknote className={`w-5 h-5 mx-auto mb-1 ${formData.type === 'cash' ? 'text-amber-600' : 'text-gray-400'}`} />
                  <span className={`text-xs ${formData.type === 'cash' ? 'text-amber-600 font-medium' : 'text-gray-600'}`}>Efectivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('other')}
                  className={`newaccountmodal-type-button p-3 rounded-lg border-2 transition-colors ${
                    formData.type === 'other'
                      ? 'active border-gray-600 bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <CreditCard className={`w-5 h-5 mx-auto mb-1 ${formData.type === 'other' ? 'text-gray-600' : 'text-gray-400'}`} />
                  <span className={`text-xs ${formData.type === 'other' ? 'text-gray-600 font-medium' : 'text-gray-600'}`}>Otro</span>
                </button>
              </div>
            </div>

            <div className="newaccountmodal-form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la cuenta <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 100) {
                    setFormData({ ...formData, name: value });
                    if (errors.name) {
                      setErrors({ ...errors, name: '' });
                    }
                  }
                }}
                placeholder={formData.type === 'bank' ? 'Ej: Cuenta Ahorros Bancolombia' : formData.type === 'wallet' ? 'Ej: Nequi Personal' : formData.type === 'credit_card' ? 'Ej: Visa Bancolombia' : 'Ej: Efectivo Casa'}
                maxLength={100}
                className={`newaccountmodal-input w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            {formData.type === 'bank' && (
              <div className="newaccountmodal-form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banco
                </label>
                <select
                  value={formData.bankName || ''}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="newaccountmodal-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar banco...</option>
                  {banks.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.type === 'credit_card' && (
              <div className="newaccountmodal-form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banco
                </label>
                <select
                  value={formData.bankName || ''}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="newaccountmodal-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar banco...</option>
                  {creditCardBanks.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.type === 'wallet' && (
              <div className="newaccountmodal-form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billetera digital
                </label>
                <select
                  value={formData.bankName || ''}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="newaccountmodal-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar billetera...</option>
                  {wallets.map((wallet) => (
                    <option key={wallet} value={wallet}>
                      {wallet}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(formData.type === 'bank' || formData.type === 'credit_card' || formData.type === 'wallet') && (
              <div className="newaccountmodal-form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de cuenta / Tarjeta
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 50) {
                      setFormData({ ...formData, accountNumber: value });
                      // Limpiar error si existe
                      if (errors.accountNumber) {
                        setErrors({ ...errors, accountNumber: '' });
                      }
                    }
                  }}
                  placeholder={formData.type === 'credit_card' ? 'Ej: 1234 5678 9012 3456' : 'Ej: 123456789'}
                  maxLength={50}
                  required
                  className={`newaccountmodal-input w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                    errors.accountNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.accountNumber && (
                  <p className="text-xs text-red-600 mt-1">{errors.accountNumber}</p>
                )}
              </div>
            )}

            {formData.type === 'credit_card' && (
              <>
                <div className="newaccountmodal-form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Límite de crédito
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.creditLimit}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          const numValue = parseFloat(value);
                          if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
                            setFormData({ ...formData, creditLimit: value });
                            if (errors.creditLimit) {
                              setErrors({ ...errors, creditLimit: '' });
                            }
                          }
                        }
                      }}
                      onWheel={handleWheel}
                      placeholder="0"
                      step="1000"
                      min="0"
                      className={`newaccountmodal-input w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.creditLimit ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.creditLimit && (
                    <p className="text-xs text-red-600 mt-1">{errors.creditLimit}</p>
                  )}
                  {formData.creditLimit && !errors.creditLimit && (
                    <p className="text-xs text-gray-600 mt-1">
                      {formatCurrency(parseFloat(formData.creditLimit) || 0, formData.currency)}
                    </p>
                  )}
                </div>

                <div className="newaccountmodal-form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de vencimiento
                  </label>
                  <input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => {
                      setFormData({ ...formData, expirationDate: e.target.value });
                      if (errors.expirationDate) {
                        setErrors({ ...errors, expirationDate: '' });
                      }
                    }}
                    className={`newaccountmodal-input w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.expirationDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.expirationDate && (
                    <p className="text-xs text-red-600 mt-1">{errors.expirationDate}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Fecha de vencimiento de la tarjeta (opcional)
                  </p>
                </div>
              </>
            )}

            <div className="newaccountmodal-form-group grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saldo inicial
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.balance}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                        const numValue = parseFloat(value);
                        if (value === '' || !isNaN(numValue)) {
                          setFormData({ ...formData, balance: value });
                          if (errors.balance) {
                            setErrors({ ...errors, balance: '' });
                          }
                        }
                      }
                    }}
                    onWheel={handleWheel}
                    placeholder="0"
                    step="1000"
                    className={`newaccountmodal-input w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.balance ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.balance && (
                  <p className="text-xs text-red-600 mt-1">{errors.balance}</p>
                )}
                {formData.balance && !errors.balance && (
                  <p className="text-xs text-gray-600 mt-1">
                    {formatCurrency(parseFloat(formData.balance) || 0, formData.currency)}
                  </p>
                )}
                {formData.type === 'credit_card' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Las tarjetas de crédito no pueden tener saldo positivo
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => {
                    const newCurrency = e.target.value as Account['currency'];
                    // Si cambia a USD o EUR, desmarcar GMF automáticamente
                    const newGmfExempt = newCurrency === 'COP' ? formData.gmfExempt : false;
                    setFormData({ ...formData, currency: newCurrency, gmfExempt: newGmfExempt });
                  }}
                  className="newaccountmodal-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="COP">COP - Peso Colombiano</option>
                  <option value="USD">USD - Dólar Estadounidense</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
            </div>

            <div className="newaccountmodal-form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 500) {
                    setFormData({ ...formData, description: value });
                  }
                }}
                placeholder="Agrega una descripción adicional de la cuenta..."
                rows={3}
                maxLength={500}
                className="newaccountmodal-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/500 caracteres
              </p>
            </div>

            {/* GMF solo aplica a cuentas en COP que NO sean tarjetas de crédito ni efectivo */}
            {formData.currency === 'COP' && formData.type !== 'credit_card' && formData.type !== 'cash' && (
              <div className="newaccountmodal-form-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.gmfExempt}
                    onChange={(e) => setFormData({ ...formData, gmfExempt: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Exenta GMF</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Si está marcada, la cuenta está exenta del GMF (Gravamen a los Movimientos Financieros - 4x1000)
                </p>
              </div>
            )}

            <div className="newaccountmodal-form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de cuenta (Activo/Pasivo)
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accountType"
                    value="asset"
                    checked={formData.accountType === 'asset'}
                    onChange={() => setFormData({ ...formData, accountType: 'asset' })}
                    disabled={formData.type === 'credit_card'}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Activo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accountType"
                    value="liability"
                    checked={formData.accountType === 'liability'}
                    onChange={() => setFormData({ ...formData, accountType: 'liability' })}
                    disabled={formData.type === 'credit_card'}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Pasivo</span>
                </label>
              </div>
              {formData.type === 'credit_card' && (
                <p className="text-xs text-gray-500 mt-1">
                  Las tarjetas de crédito se manejan automáticamente como pasivo
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Cuenta activa</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="newaccountmodal-button flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="newaccountmodal-button flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Guardando...' : (account ? 'Guardar cambios' : 'Crear cuenta')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewAccountModal;

