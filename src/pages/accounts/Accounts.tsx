import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, CreditCard, Wallet, Building2, Banknote, Eye, EyeOff, CheckCircle, XCircle, ExternalLink, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import NewAccountModal from '../../components/NewAccountModal';
import CardDetail from '../cards/CardDetail';
import ConfirmModal from '../../components/ConfirmModal';
import { accountService, Account, CreateAccountData } from '../../services/accountService';
import { formatMoneyFromPesos, Currency } from '../../utils/currencyUtils';
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
  const [expandedCards, setExpandedCards] = useState<{ [key: number]: boolean }>({});
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'warning' | 'danger' | 'info';
    cancelText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning',
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const accountsData = await accountService.getAllAccounts();
      setAccounts(accountsData);
    } catch (error) {
      setConfirmModal({
        isOpen: true,
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al cargar las cuentas',
        type: 'danger',
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
        cancelText: undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };


  const formatCurrency = (amount: number, currency: Currency = 'COP'): string => {
    return formatMoneyFromPesos(amount, currency);
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

  // Agrupar balances por moneda (solo activos)
  const balancesByCurrency = accounts
    .filter(acc => acc.is_active === true && acc.account_type === 'asset')
    .reduce((acc, account) => {
      const balance = Number(account.current_balance) || 0;
      const currency = (account.currency as Currency) || 'COP';
      if (!acc[currency]) {
        acc[currency] = 0;
      }
      acc[currency] += isNaN(balance) || !isFinite(balance) ? 0 : balance;
      return acc;
    }, {} as Record<Currency, number>);

  // Agrupar deudas por moneda (solo pasivos)
  const debtsByCurrency = accounts
    .filter(acc => acc.is_active === true && acc.account_type === 'liability')
    .reduce((acc, account) => {
      const balance = Number(account.current_balance) || 0;
      const currency = (account.currency as Currency) || 'COP';
      if (!acc[currency]) {
        acc[currency] = 0;
      }
      acc[currency] += isNaN(balance) || !isFinite(balance) ? 0 : balance;
      return acc;
    }, {} as Record<Currency, number>);

  const handleSaveAccount = async (accountData: CreateAccountData, accountId?: number) => {
    if (accountId) {
      const existingAccount = accounts.find(acc => acc.id === accountId);
      const newBalanceInPesos = accountData.current_balance;
      // El current_balance del backend ya viene en pesos (no en centavos)
      const oldBalanceInPesos = existingAccount?.current_balance;
      
      const accountUpdateData: CreateAccountData = { ...accountData };
      delete accountUpdateData.current_balance;
      
      await accountService.updateAccount(accountId, accountUpdateData);
      
      if (newBalanceInPesos !== undefined) {
        // El backend espera recibir el saldo en pesos (no multiplicar por 100)
        if (newBalanceInPesos !== oldBalanceInPesos) {
          await accountService.updateBalance(accountId, newBalanceInPesos, 'Actualización desde edición de cuenta');
        }
      }
    } else {
      // El backend espera recibir el saldo en pesos (no multiplicar por 100)
      // accountData.current_balance ya está en pesos, no necesita conversión
      await accountService.createAccount(accountData);
    }
    await loadAccounts();
  };

  const handleDeleteAccount = async (id: number) => {
    try {
      const validation = await accountService.validateDeletion(id);
      
      let message = '¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer.';
      
      if (validation.warnings && validation.warnings.length > 0) {
        message = '⚠️ Advertencias:\n\n' + validation.warnings.join('\n') + '\n\n¿Deseas continuar con la eliminación? El saldo y las transacciones asociadas se perderán.';
      } else if (validation.has_movements) {
        message = `Esta cuenta tiene ${validation.movement_count || 0} movimiento(s) asociado(s).\n\n¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer.`;
      }

      setConfirmModal({
        isOpen: true,
        title: validation.warnings && validation.warnings.length > 0 ? 'Confirmar eliminación' : 'Confirmar eliminación',
        message,
        type: 'danger',
        onConfirm: async () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          try {
            await accountService.deleteAccount(id);
            await loadAccounts();
          } catch (error) {
            setConfirmModal({
              isOpen: true,
              title: 'Error',
              message: error instanceof Error ? error.message : 'Error al eliminar la cuenta',
              type: 'danger',
              onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
              cancelText: undefined,
            });
          }
        },
        cancelText: 'Cancelar',
      });
    } catch (error) {
      setConfirmModal({
        isOpen: true,
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al validar la eliminación',
        type: 'danger',
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
        cancelText: undefined,
      });
    }
  };

  const toggleAccountStatus = async (id: number) => {
    try {
      await accountService.toggleActive(id);
      await loadAccounts();
    } catch (error) {
      setConfirmModal({
        isOpen: true,
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al cambiar el estado de la cuenta',
        type: 'danger',
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
        cancelText: undefined,
      });
    }
  };

  const toggleBalanceVisibility = (id: number) => {
    setShowBalance(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleCardExpansion = (id: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (selectedCard && selectedCard.category === 'credit_card') {
    const creditDetails = selectedCard.credit_card_details;
    // credit_limit viene en PESOS desde el backend (DecimalField), NO en centavos
    // creditDetails.credit_limit también viene en PESOS (Decimal)
    const creditLimit = creditDetails?.credit_limit ?? selectedCard.credit_limit ?? 0;
    // current_balance también viene en PESOS desde el backend
    const currentBalance = selectedCard.current_balance ?? 0;
    
    let available = 0;
    // creditDetails.available_credit viene en PESOS (Decimal), NO en centavos
    if (creditDetails?.available_credit !== undefined && creditDetails.available_credit !== null) {
      available = creditDetails.available_credit;
    } else if (creditLimit > 0) {
      available = Math.max(0, creditLimit + currentBalance);
    }
    available = isNaN(available) || !isFinite(available) ? 0 : available;
    
    // creditDetails.used_credit, current_debt y total_paid vienen en PESOS (Decimal), NO en centavos
    const usedCredit = creditDetails?.used_credit ?? Math.abs(currentBalance);
    const currentDebt = creditDetails?.current_debt ?? currentBalance;
    const totalPaid = creditDetails?.total_paid ?? 0;
    
    return (
      <CardDetail
        card={{
          id: selectedCard.id!,
          name: selectedCard.name,
          bankName: selectedCard.bank_name || '',
          accountNumber: selectedCard.account_number || '',
          limit: creditLimit,
          available: available,
          used: usedCredit,
          currentDebt: currentDebt,
          totalPaid: totalPaid,
          utilizationPercentage: creditDetails?.utilization_percentage ?? 
            (creditLimit > 0 ? (Math.abs(currentBalance) / creditLimit) * 100 : 0),
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

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm flex-1 min-w-[200px]">
            <p className="text-sm text-gray-600 mb-2 text-center">Total de cuentas</p>
            <p className="text-3xl font-bold text-gray-900 text-center">{accounts.length}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm flex-1 min-w-[200px]">
            <p className="text-sm text-gray-600 mb-2 text-center">Cuentas activas</p>
            <p className="text-3xl font-bold text-blue-600 text-center">{accounts.filter(acc => acc.is_active === true).length}</p>
          </div>
          {Object.entries(balancesByCurrency).length > 0 ? (
            Object.entries(balancesByCurrency).map(([currency, balance]) => (
              <div key={currency} className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm flex-1 min-w-[200px]">
                <p className="text-sm text-gray-600 mb-2 text-center">Balance disponible</p>
                <p className="text-2xl font-bold text-green-600 text-center">
                  {formatCurrency(balance, currency as Currency)}
                </p>
                <p className="text-xs text-gray-500 text-center mt-1">{currency}</p>
                <p className="text-xs text-gray-500 text-center mt-2">Solo activos</p>
              </div>
            ))
          ) : (
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm flex-1 min-w-[200px]">
              <p className="text-sm text-gray-600 mb-2 text-center">Balance disponible</p>
              <p className="text-2xl font-bold text-green-600 text-center">
                {formatCurrency(0)}
              </p>
              <p className="text-xs text-gray-500 text-center mt-2">Solo activos</p>
            </div>
          )}
          {Object.keys(debtsByCurrency).length > 0 && (
            Object.entries(debtsByCurrency).map(([currency, debt]) => (
              <div key={`debt-${currency}`} className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm flex-1 min-w-[200px]">
                <p className="text-sm text-gray-600 mb-2 text-center">Deudas totales</p>
                <p className="text-2xl font-bold text-red-600 text-center">
                  {formatCurrency(Math.abs(debt), currency as Currency)}
                </p>
                <p className="text-xs text-gray-500 text-center mt-1">{currency}</p>
                <p className="text-xs text-gray-500 text-center mt-2">Tarjetas de crédito</p>
              </div>
            ))
          )}
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

              const creditDetails = account.credit_card_details;
              // credit_limit y current_balance vienen en PESOS desde el backend (DecimalField), NO en centavos
              const creditLimit = creditDetails?.credit_limit ?? account.credit_limit ?? 0;
              const currentBalance = account.current_balance ?? 0;
              
              // creditDetails.used_credit viene en PESOS (Decimal), NO en centavos
              const usedCredit = creditDetails?.used_credit ?? Math.abs(currentBalance);
              const currentDebt = creditDetails?.current_debt ? creditDetails.current_debt / 100 : currentBalance;
              const totalPaid = creditDetails?.total_paid ? creditDetails.total_paid / 100 : 0;
              
              // creditDetails.available_credit viene en PESOS (Decimal), NO en centavos
              let available = 0;
              if (creditDetails?.available_credit !== undefined && creditDetails.available_credit !== null) {
                available = creditDetails.available_credit;
              } else if (creditLimit > 0) {
                available = Math.max(0, creditLimit + currentBalance);
              }
              
              available = isNaN(available) || !isFinite(available) ? 0 : available;
              
              const usagePercentage = creditDetails?.utilization_percentage ?? 
                (creditLimit > 0 ? (usedCredit / creditLimit) * 100 : 0);

              const isExpanded = expandedCards[account.id!] === true;
              
              return (
                 <div 
                   key={account.id} 
                   className="relative overflow-hidden rounded-2xl shadow-lg transition-all hover:shadow-xl"
                   style={{
                     background: `linear-gradient(135deg, #8b5cf6 0%, #8b5cf6dd 100%)`,
                     minHeight: isExpanded ? 'auto' : '176px'
                   }}
                 >
                   <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                   <div className="relative p-4 text-white">
                     <div className="flex items-start justify-between mb-4">
                       <div className="flex items-center gap-2">
                         <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                           <CreditCard className="w-5 h-5" />
                         </div>
                         <div>
                           <div className="flex items-center gap-2">
                             <h3 className="font-bold text-base">{account.name}</h3>
                             {account.currency && (
                               <span className="inline-block px-1.5 py-0.5 bg-white/20 text-white rounded text-xs font-semibold">
                                 {account.currency_display || account.currency}
                               </span>
                             )}
                           </div>
                           {account.bank_name ? (
                             <p className="text-xs text-white/80">{account.bank_name}</p>
                           ) : (
                             <p className="text-xs text-white/60">Sin banco especificado</p>
                           )}
                         </div>
                       </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCardExpansion(account.id!)}
                          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                          title={isExpanded ? 'Contraer' : 'Expandir'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
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

                     <div className="mb-4">
                       <div className="flex items-center gap-2 mb-1.5">
                         <div className="w-10 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded flex items-center justify-center">
                           <div className="w-7 h-4 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-sm"></div>
                         </div>
                       </div>
                       <p className="text-xl font-mono font-bold tracking-wider mb-0.5">
                         {isBalanceVisible 
                           ? formatCardNumber(account.account_number || '')
                           : '•••• •••• •••• ••••'
                         }
                       </p>
                     </div>

                     <div className="grid grid-cols-2 gap-2 mb-3">
                       <div>
                         <p className="text-xs text-white/70 mb-0.5">Límite de crédito</p>
                         <p className="text-base font-bold">
                           {isBalanceVisible && creditLimit
                             ? formatCurrency(creditLimit, account.currency)
                             : '••••••'
                           }
                         </p>
                       </div>
                       <div className="text-right">
                         <p className="text-xs text-white/70 mb-0.5">Disponible</p>
                         <p className="text-base font-bold">
                           {isBalanceVisible && creditLimit
                             ? formatCurrency(available, account.currency)
                             : '••••••'
                           }
                         </p>
                       </div>
                     </div>

                    {/* Información detallada de uso - Solo visible cuando está expandida */}
                    {isExpanded && isBalanceVisible && (
                      <div className="mb-4 p-3 bg-white/10 rounded-lg backdrop-blur-sm space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-white/70 mb-0.5">Lo usado</p>
                            <p className="text-white font-semibold">{formatCurrency(usedCredit, account.currency)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white/70 mb-0.5">Lo que se debe</p>
                            <p className="text-white font-semibold">{formatCurrency(Math.abs(currentDebt), account.currency)}</p>
                          </div>
                        </div>
                        {totalPaid > 0 && (
                          <div className="pt-2 border-t border-white/20">
                            <p className="text-white/70 text-xs mb-0.5">Total pagado</p>
                            <p className="text-white font-semibold text-sm">
                              {formatCurrency(totalPaid, account.currency)}
                              {creditLimit > 0 && totalPaid > creditLimit && (
                                <span className="ml-1 text-yellow-300 text-xs">(incluye intereses)</span>
                              )}
                            </p>
                            {currentDebt < 0 && Math.abs(currentDebt) > 0 && (
                              <p className="text-white/60 text-xs mt-1">
                                Ha pagado {((totalPaid / Math.abs(currentDebt)) * 100).toFixed(1)}% de la deuda actual
                                {totalPaid > Math.abs(currentDebt) && (
                                  <span className="text-yellow-300"> (exceso por intereses acumulados)</span>
                                )}
                              </p>
                            )}
                          </div>
                        )}
                        {totalPaid === 0 && currentDebt < 0 && (
                          <div className="pt-2 border-t border-white/20">
                            <p className="text-white/70 text-xs mb-0.5">Total pagado</p>
                            <p className="text-white font-semibold text-sm">{formatCurrency(0, account.currency)}</p>
                            <p className="text-white/60 text-xs mt-1">No se han registrado pagos aún</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Información adicional y barra de uso - Solo visible cuando está expandida */}
                    {isExpanded && (
                      <>
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
                            <span className="font-semibold">
                              {isBalanceVisible 
                                ? `${usagePercentage.toFixed(1)}%`
                                : '•••%'
                              }
                            </span>
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                usagePercentage >= 90 ? 'bg-red-400' : 
                                usagePercentage >= 70 ? 'bg-yellow-400' : 
                                'bg-green-400'
                              }`}
                              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                            ></div>
                          </div>
                          {isBalanceVisible && (
                            <div className="flex items-center justify-between text-xs mt-1 text-white/60">
                              <span>Usado: {formatCurrency(usedCredit, account.currency)}</span>
                              <span>Disponible: {formatCurrency(isNaN(available) ? 0 : available, account.currency)}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                     <div className="flex gap-2 pt-3 border-t border-white/20">
                       <button
                         onClick={() => setSelectedCard(account)}
                         className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-xs font-medium transition-colors"
                       >
                         <ExternalLink className="w-3.5 h-3.5" />
                         Ver detalle
                       </button>
                       <button
                         onClick={async () => {
                           try {
                             const fullAccount = await accountService.getAccountById(account.id!);
                             setEditingAccount(fullAccount);
                             setShowNewAccountModal(true);
                           } catch {
                             setConfirmModal({
                               isOpen: true,
                               title: 'Error',
                               message: 'Error al cargar los detalles de la cuenta',
                               type: 'danger',
                               onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
                               cancelText: undefined,
                             });
                           }
                         }}
                         className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors"
                       >
                         <Edit2 className="w-3.5 h-3.5" />
                       </button>
                       <button
                         onClick={() => handleDeleteAccount(account.id!)}
                         className="px-2.5 py-1.5 bg-red-500/30 hover:bg-red-500/40 backdrop-blur-sm rounded-lg transition-colors"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
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
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                        style={{ 
                          backgroundColor: account.account_type === 'asset' ? '#3b82f6' : '#8b5cf6' 
                        }}
                      >
                        {getAccountIcon(account.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-gray-900">{account.name}</h3>
                          {account.currency && (
                            <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                              {account.currency_display || account.currency}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {getAccountTypeLabel(account.category)} • {account.account_type === 'asset' ? 'Activo' : 'Pasivo'}
                          {account.is_active !== true && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-medium">
                              Inactiva
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleBalanceVisibility(account.id!)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        {isBalanceVisible ? (
                          <Eye className="w-3.5 h-3.5 text-gray-600" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-gray-600" />
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
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-0.5">Balance</p>
                    <p className={`text-xl font-bold ${
                      (account.current_balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isBalanceVisible 
                        ? formatCurrency(Number(account.current_balance) || 0, account.currency)
                        : '••••••'
                      }
                    </p>
                  </div>

                  {/* Información compacta en grid */}
                  <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Moneda</p>
                      <p className="text-xs font-semibold text-gray-900">{account.currency}</p>
                    </div>
                    {account.gmf_exempt !== undefined && (
                      <div>
                        <p className="text-xs text-gray-600 mb-0.5">Exenta GMF</p>
                        <p className={`text-xs font-semibold ${account.gmf_exempt ? 'text-green-600' : 'text-orange-600'}`}>
                          {account.gmf_exempt ? 'Sí' : 'No'}
                        </p>
                      </div>
                    )}
                    {account.account_number && (
                      <div>
                        <p className="text-xs text-gray-600 mb-0.5">Número de cuenta</p>
                        <p className="text-xs font-mono text-gray-900">
                          {isBalanceVisible 
                            ? account.account_number 
                            : '•••• •••• ••••'
                          }
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Banco</p>
                      <p className="text-xs text-gray-900 font-medium truncate">{account.bank_name || 'No especificado'}</p>
                    </div>
                  </div>

                  {account.description && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-600 mb-0.5">Descripción</p>
                      <p className="text-xs text-gray-900 line-clamp-2">{account.description}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={async () => {
                        try {
                          const fullAccount = await accountService.getAccountById(account.id!);
                          setEditingAccount(fullAccount);
                          setShowNewAccountModal(true);
                        } catch {
                          setConfirmModal({
                            isOpen: true,
                            title: 'Error',
                            message: 'Error al cargar los detalles de la cuenta',
                            type: 'danger',
                            onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
                            cancelText: undefined,
                          });
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account.id!)}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Aceptar"
        cancelText={confirmModal.cancelText}
        type={confirmModal.type || 'warning'}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Accounts;

