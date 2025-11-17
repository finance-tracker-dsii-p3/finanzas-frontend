import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, CreditCard, Wallet, Building2, Banknote, Eye, EyeOff, CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react';
import NewAccountModal from '../../components/NewAccountModal';
import CardDetail from '../cards/CardDetail';
import { accountService, Account, CreateAccountData } from '../../services/accountService';
import './accounts.css';

interface AccountsProps {
  onBack: () => void;
}

const Accounts: React.FC<AccountsProps> = ({ onBack }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedCard, setSelectedCard] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBalance, setShowBalance] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const accountsData = await accountService.getAllAccounts();
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
      alert(error instanceof Error ? error.message : 'Error al cargar las cuentas');
    } finally {
      setIsLoading(false);
    }
  };


  const formatCurrency = (amount: number, currency: string = 'COP'): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const getAccountIcon = (category: Account['category']) => {
    switch (category) {
      case 'bank_account':
      case 'savings_account':
        return <Building2 className="w-5 h-5" />;
      case 'wallet':
        return <Wallet className="w-5 h-5" />;
      case 'credit_card':
        return <CreditCard className="w-5 h-5" />;
      default:
        return <Banknote className="w-5 h-5" />;
    }
  };

  const getAccountTypeLabel = (category: Account['category']) => {
    switch (category) {
      case 'bank_account':
        return 'Cuenta Bancaria';
      case 'savings_account':
        return 'Cuenta de Ahorros';
      case 'wallet':
        return 'Billetera';
      case 'credit_card':
        return 'Tarjeta de Crédito';
      default:
        return 'Otro';
    }
  };

  const totalBalance = accounts
    .filter(acc => acc.is_active === true)
    .reduce((sum, acc) => {
      if (acc.account_type === 'asset') {
        return sum + acc.current_balance;
      } else {
        return sum - acc.current_balance;
      }
    }, 0);

  const handleSaveAccount = async (accountData: CreateAccountData, accountId?: number) => {
    if (accountId) {
      await accountService.updateAccount(accountId, accountData);
    } else {
      await accountService.createAccount(accountData);
    }
    await loadAccounts();
  };

  const handleDeleteAccount = async (id: number) => {
    try {
      const validation = await accountService.validateDeletion(id);
      
      if (!validation.can_delete && validation.has_movements) {
        const message = `Esta cuenta tiene ${validation.movement_count || 0} movimiento(s) asociado(s).\n\n¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer.`;
        if (!window.confirm(message)) {
          return;
        }
      } else {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta cuenta?')) {
          return;
        }
      }

      await accountService.deleteAccount(id);
      await loadAccounts();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar la cuenta');
    }
  };

  const toggleAccountStatus = async (id: number) => {
    try {
      await accountService.toggleActive(id);
      await loadAccounts();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al cambiar el estado de la cuenta');
    }
  };

  const toggleBalanceVisibility = (id: number) => {
    setShowBalance(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (selectedCard && selectedCard.category === 'credit_card') {
    return (
      <CardDetail
        card={{
          id: selectedCard.id!,
          name: selectedCard.name,
          bankName: selectedCard.bank_name || '',
          accountNumber: selectedCard.account_number || '',
          limit: selectedCard.credit_limit || 0,
          available: (selectedCard.credit_limit || 0) + selectedCard.current_balance,
          used: Math.abs(selectedCard.current_balance),
          currency: selectedCard.currency,
          color: '#8b5cf6'
        }}
        onBack={() => setSelectedCard(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Volver al Dashboard</span>
      </button>

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cuentas y Métodos de Pago</h2>
          <p className="text-sm text-gray-600 mt-1">Gestiona tus cuentas bancarias, billeteras y métodos de pago</p>
        </div>
        <button 
          onClick={() => {
            setEditingAccount(null);
            setShowNewAccountModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva cuenta
        </button>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total de cuentas</p>
            <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Cuentas activas</p>
            <p className="text-2xl font-bold text-blue-600">{accounts.filter(acc => acc.is_active === true).length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Balance total</p>
            <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalBalance)}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Cargando cuentas...</span>
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Comencemos!</h3>
          <p className="text-gray-600 mb-2 text-lg">No hay cuentas configuradas aún</p>
          <p className="text-gray-500 mb-8">Agrega tu primera cuenta bancaria o billetera digital para empezar a gestionar tus finanzas</p>
          <button 
            onClick={() => setShowNewAccountModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            <Plus className="w-5 h-5" />
            Agregar primera cuenta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts
            .sort((a, b) => {
              const aActive = a.is_active === true ? 0 : 1;
              const bActive = b.is_active === true ? 0 : 1;
              
              if (aActive !== bActive) {
                return aActive - bActive;
              }
              
              return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
            })
            .map((account) => {
            const isBalanceVisible = showBalance[account.id!] !== false;
            
            if (account.category === 'credit_card') {
              const formatCardNumber = (num: string) => {
                if (!num) return '•••• •••• •••• ••••';
                const cleaned = num.replace(/\s/g, '');
                return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
              };

              const usagePercentage = account.credit_limit ? (Math.abs(account.current_balance) / account.credit_limit) * 100 : 0;
              const available = account.credit_limit ? account.credit_limit + account.current_balance : 0;

              return (
                <div 
                  key={account.id} 
                  className="relative overflow-hidden rounded-2xl shadow-lg transition-all hover:shadow-xl hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, #8b5cf6 0%, #8b5cf6dd 100%)`,
                    minHeight: '220px'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                  <div className="relative p-6 text-white">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{account.name}</h3>
                          {account.bank_name ? (
                            <p className="text-xs text-white/80">{account.bank_name}</p>
                          ) : (
                            <p className="text-xs text-white/60">Sin banco especificado</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleBalanceVisibility(account.id!)}
                          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          {isBalanceVisible ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleAccountStatus(account.id!)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            account.is_active === true 
                              ? 'text-green-300 hover:bg-white/20' 
                              : 'text-white/50 hover:bg-white/10'
                          }`}
                          title={account.is_active === true ? 'Desactivar cuenta' : 'Activar cuenta'}
                        >
                          {account.is_active === true ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-12 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded flex items-center justify-center">
                          <div className="w-8 h-6 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-sm"></div>
                        </div>
                      </div>
                      <p className="text-2xl font-mono font-bold tracking-wider mb-1">
                        {isBalanceVisible 
                          ? formatCardNumber(account.account_number || '')
                          : '•••• •••• •••• ••••'
                        }
                      </p>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-white/70 mb-1">Límite de crédito</p>
                        <p className="text-lg font-bold">
                          {isBalanceVisible && account.credit_limit
                            ? formatCurrency(account.credit_limit, account.currency)
                            : '••••••'
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/70 mb-1">Disponible</p>
                        <p className="text-lg font-bold">
                          {isBalanceVisible && account.credit_limit
                            ? formatCurrency(available, account.currency)
                            : '••••••'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/70">Moneda:</span>
                        <span className="text-white font-semibold">{account.currency}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/70">Banco:</span>
                        <span className="text-white font-semibold">{account.bank_name || 'No especificado'}</span>
                      </div>
                      {account.gmf_exempt !== undefined && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/70">Exenta GMF:</span>
                          <span className={`font-semibold ${account.gmf_exempt ? 'text-green-300' : 'text-yellow-300'}`}>
                            {account.gmf_exempt ? 'Sí' : 'No'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-white/80">Uso del crédito</span>
                        <span className="font-semibold">{usagePercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            usagePercentage >= 90 ? 'bg-red-300' : 
                            usagePercentage >= 70 ? 'bg-yellow-300' : 
                            'bg-green-300'
                          }`}
                          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-white/20">
                      <button
                        onClick={() => setSelectedCard(account)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver detalle
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const fullAccount = await accountService.getAccountById(account.id!);
                            setEditingAccount(fullAccount);
                            setShowNewAccountModal(true);
                          } catch (error) {
                            console.error('Error al cargar detalles de la cuenta:', error);
                            alert('Error al cargar los detalles de la cuenta');
                          }
                        }}
                        className="px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id!)}
                        className="px-3 py-2 bg-red-500/30 hover:bg-red-500/40 backdrop-blur-sm rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={account.id} 
                className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
                  account.is_active === true 
                    ? 'border-gray-200 hover:border-blue-300 hover:shadow-md' 
                    : 'border-gray-100 opacity-60'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                        style={{ 
                          backgroundColor: account.account_type === 'asset' ? '#3b82f6' : '#8b5cf6' 
                        }}
                      >
                        {getAccountIcon(account.category)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{account.name}</h3>
                        <p className="text-xs text-gray-500">
                          {getAccountTypeLabel(account.category)} • {account.account_type === 'asset' ? 'Activo' : 'Pasivo'}
                          {account.is_active !== true && (
                            <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-medium">
                              Inactiva
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleBalanceVisibility(account.id!)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        {isBalanceVisible ? (
                          <Eye className="w-4 h-4 text-gray-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleAccountStatus(account.id!)}
                        className={`p-1 rounded transition-colors ${
                          account.is_active === true 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={account.is_active === true ? 'Desactivar cuenta' : 'Activar cuenta'}
                      >
                        {account.is_active === true ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-1">Balance</p>
                    <p className={`text-2xl font-bold ${
                      account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isBalanceVisible 
                        ? formatCurrency(account.current_balance, account.currency)
                        : '••••••'
                      }
                    </p>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Moneda</p>
                      <p className="text-sm font-semibold text-gray-900">{account.currency}</p>
                    </div>
                    {account.gmf_exempt !== undefined && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Exenta GMF</p>
                        <p className={`text-sm font-semibold ${account.gmf_exempt ? 'text-green-600' : 'text-orange-600'}`}>
                          {account.gmf_exempt ? 'Sí' : 'No'}
                        </p>
                      </div>
                    )}
                  </div>

                  {account.account_number && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 mb-1">Número de cuenta</p>
                      <p className="text-sm font-mono text-gray-900">
                        {isBalanceVisible 
                          ? account.account_number 
                          : '•••• •••• ••••'
                        }
                      </p>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-1">Banco</p>
                    <p className="text-sm text-gray-900 font-medium">{account.bank_name || 'No especificado'}</p>
                  </div>

                  {account.description && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 mb-1">Descripción</p>
                      <p className="text-sm text-gray-900">{account.description}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={async () => {
                        try {
                          const fullAccount = await accountService.getAccountById(account.id!);
                          setEditingAccount(fullAccount);
                          setShowNewAccountModal(true);
                        } catch (error) {
                          console.error('Error al cargar detalles de la cuenta:', error);
                          alert('Error al cargar los detalles de la cuenta');
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account.id!)}
                      className="flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNewAccountModal && (
        <NewAccountModal
          key={editingAccount?.id || 'new'}
          onClose={() => {
            setShowNewAccountModal(false);
            setEditingAccount(null);
          }}
          account={editingAccount}
          onSave={handleSaveAccount}
        />
      )}

    </div>
  );
};

export default Accounts;

