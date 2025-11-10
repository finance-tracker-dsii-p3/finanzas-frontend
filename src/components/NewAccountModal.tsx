import React, { useState, useEffect, useRef } from 'react';
import { XCircle, Building2, Wallet, CreditCard, Banknote, DollarSign } from 'lucide-react';
import './NewAccountModal.css';

interface Account {
  id?: number;
  name: string;
  type: 'bank' | 'wallet' | 'credit_card' | 'cash' | 'other';
  bankName?: string;
  accountNumber?: string;
  balance: number;
  currency: string;
  isActive: boolean;
  showBalance: boolean;
  color: string;
  creditLimit?: number;
}

interface NewAccountModalProps {
  onClose: () => void;
  account?: Account | null;
  onSave: (account: Account) => void;
}

const NewAccountModal: React.FC<NewAccountModalProps> = ({ onClose, account, onSave }) => {
  const [formData, setFormData] = useState(() => {
    if (account) {
      return {
        name: account.name,
        type: account.type,
        bankName: account.bankName || '',
        accountNumber: account.accountNumber || '',
        balance: account.balance.toString(),
        creditLimit: account.creditLimit?.toString() || '',
        currency: account.currency,
        isActive: account.isActive,
        showBalance: account.showBalance,
        color: account.color
      };
    }
    return {
      name: '',
      type: 'bank' as Account['type'],
      bankName: '',
      accountNumber: '',
      balance: '',
      creditLimit: '',
      currency: 'COP',
      isActive: true,
      showBalance: true,
      color: '#3b82f6'
    };
  });

  const prevAccountIdRef = useRef<number | undefined>(account?.id);
  
  useEffect(() => {
    if (account && account.id !== prevAccountIdRef.current) {
      prevAccountIdRef.current = account.id;
      setTimeout(() => {
        setFormData({
          name: account.name,
          type: account.type,
          bankName: account.bankName || '',
          accountNumber: account.accountNumber || '',
          balance: account.balance.toString(),
          creditLimit: account.creditLimit?.toString() || '',
          currency: account.currency,
          isActive: account.isActive,
          showBalance: account.showBalance,
          color: account.color
        });
      }, 0);
    }
  }, [account]);

  const banks = [
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
  ];

  const wallets = [
    'Nequi',
    'Daviplata',
    'RappiPay',
    'Ualá',
    'Lulo Bank',
    'Nu Colombia',
    'Otro'
  ];

  const creditCardBanks = [
    'Bancolombia',
    'Banco de Bogotá',
    'Davivienda',
    'Banco Popular',
    'Falabella',
    'Éxito',
    'Alkosto',
    'Otro'
  ];

  const typeColors: { [key: string]: string } = {
    bank: '#3b82f6',
    wallet: '#10b981',
    credit_card: '#8b5cf6',
    cash: '#f59e0b',
    other: '#6b7280'
  };

  const handleTypeChange = (type: Account['type']) => {
    setFormData({
      ...formData,
      type,
      color: typeColors[type] || '#3b82f6',
      bankName: '',
      accountNumber: ''
    });
  };

  const formatCurrency = (amount: number, currency: string = 'COP'): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Por favor ingresa el nombre de la cuenta');
      return;
    }
    if ((formData.type === 'bank' || formData.type === 'credit_card') && !formData.bankName) {
      alert('Por favor selecciona el banco');
      return;
    }

    const accountData: Account = {
      name: formData.name,
      type: formData.type,
      bankName: formData.bankName || undefined,
      accountNumber: formData.accountNumber || undefined,
      balance: parseFloat(formData.balance) || 0,
      creditLimit: formData.type === 'credit_card' && formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
      currency: formData.currency,
      isActive: formData.isActive,
      showBalance: formData.showBalance,
      color: formData.color
    };

    if (account?.id) {
      accountData.id = account.id;
    }

    onSave(accountData);
  };

  return (
    <div className="newaccountmodal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="newaccountmodal-container bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {account ? 'Editar cuenta' : 'Nueva cuenta'}
            </h3>
            <button onClick={onClose} className="newaccountmodal-close-button text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={formData.type === 'bank' ? 'Ej: Cuenta Ahorros Bancolombia' : formData.type === 'wallet' ? 'Ej: Nequi Personal' : formData.type === 'credit_card' ? 'Ej: Visa Bancolombia' : 'Ej: Efectivo Casa'}
                className="newaccountmodal-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {(formData.type === 'bank' || formData.type === 'credit_card') && (
              <div className="newaccountmodal-form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banco <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="newaccountmodal-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar banco...</option>
                  {(formData.type === 'bank' ? banks : creditCardBanks).map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
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
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="newaccountmodal-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar billetera...</option>
                  {wallets.map(wallet => (
                    <option key={wallet} value={wallet}>{wallet}</option>
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
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder={formData.type === 'credit_card' ? 'Ej: 1234 5678 9012 3456' : 'Ej: 123456789'}
                  className="newaccountmodal-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                />
              </div>
            )}

            {formData.type === 'credit_card' && (
              <div className="newaccountmodal-form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Límite de crédito
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    placeholder="0"
                    step="1000"
                    className="newaccountmodal-input w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {formData.creditLimit && (
                  <p className="text-xs text-gray-600 mt-1">
                    {formatCurrency(parseFloat(formData.creditLimit) || 0, formData.currency)}
                  </p>
                )}
              </div>
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
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    placeholder="0"
                    step="1000"
                    className="newaccountmodal-input w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {formData.balance && (
                  <p className="text-xs text-gray-600 mt-1">
                    {formatCurrency(parseFloat(formData.balance) || 0, formData.currency)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
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
                Color
              </label>
              <div className="flex items-center gap-3">
                <div
                  className={`newaccountmodal-color-option w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer ${formData.color === formData.color ? 'selected' : ''}`}
                  style={{ backgroundColor: formData.color }}
                ></div>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="newaccountmodal-color-option w-12 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-600">{formData.color}</span>
              </div>
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showBalance}
                  onChange={(e) => setFormData({ ...formData, showBalance: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Mostrar saldo públicamente</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="newaccountmodal-button flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="newaccountmodal-button flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {account ? 'Guardar cambios' : 'Crear cuenta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewAccountModal;

