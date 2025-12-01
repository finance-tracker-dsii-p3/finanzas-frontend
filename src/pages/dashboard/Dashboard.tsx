import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Calendar, PieChart, Activity, Upload, FileText, Target, ChevronRight, Receipt, Percent, CreditCard, AlertCircle, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBudgets } from '../../context/BudgetContext';
import { MonthlySummaryResponse } from '../../services/budgetService';
import Movements from '../movements/Movements';
import Budgets from '../budgets/Budgets';
import Reports from '../reports/Reports';
import Accounts from '../accounts/Accounts';
import CategoriesPage from '../categories/Categories';
import Goals from '../goals/Goals';
import Rules from '../rules/Rules';
import Analytics from '../analytics/Analytics';
import AlertCenter from '../../components/AlertCenter';
import './dashboard.css';

interface MonthData {
  income: number;
  expenses: number;
  balance: number;
  ivaCompras: number;
  ivaVentas: number;
  gmf: number;
  creditCardInterests: number;
}

interface CategoryData {
  name: string;
  value: number;
  base: number;
  iva: number;
  color: string;
  percentage: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'movements' | 'budgets' | 'reports' | 'accounts' | 'categories' | 'goals' | 'rules' | 'analytics'>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [includePending, setIncludePending] = useState(false);
  const [showTaxes, setShowTaxes] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [monthData] = useState<MonthData>({
    income: 0,
    expenses: 0,
    balance: 0,
    ivaCompras: 0,
    ivaVentas: 0,
    gmf: 0,
    creditCardInterests: 0
  });
  const [categoryData] = useState<CategoryData[]>([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleLogout = async () => {
    await logout();
  };

  const handleViewProfile = () => {
    setShowProfileMenu(false);
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <img src="/logo.png" alt="eBalance" className="h-8 w-auto" />
              <nav className="hidden md:flex gap-6">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`text-sm font-medium transition-colors ${
                    currentView === 'dashboard' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('movements')}
                  className={`text-sm font-medium transition-colors ${
                    currentView === 'movements' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Movimientos
                </button>
                <button
                  onClick={() => setCurrentView('budgets')}
                  className={`text-sm font-medium transition-colors ${
                    currentView === 'budgets' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Presupuestos
                </button>
                <button
                  onClick={() => setCurrentView('reports')}
                  className={`text-sm font-medium transition-colors ${
                    currentView === 'reports' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Reportes
                </button>
                <button
                  onClick={() => setCurrentView('accounts')}
                  className={`text-sm font-medium transition-colors ${
                    currentView === 'accounts' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Cuentas
                </button>
                <button
                  onClick={() => setCurrentView('categories')}
                  className={`text-sm font-medium transition-colors ${
                    currentView === 'categories'
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Categorías
                </button>
                <button
                  onClick={() => setCurrentView('goals')}
                  className={`text-sm font-medium transition-colors ${
                    currentView === 'goals'
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Metas
                </button>
                <button
                  onClick={() => setCurrentView('rules')}
                  className={`text-sm font-medium transition-colors ${
                    currentView === 'rules'
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Reglas
                </button>
                <button
                  onClick={() => setCurrentView('analytics')}
                  className={`text-sm font-medium transition-colors ${
                    currentView === 'analytics'
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Analytics
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <AlertCenter
                onViewBudget={() => {
                  setCurrentView('budgets');
                }}
              />
              <div className="relative" ref={profileMenuRef}>
                    <button 
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="profile-button p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="profile-button-avatar w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                        {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </button>
                
                {showProfileMenu && (
                  <div className="profile-menu absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={handleViewProfile}
                      className="profile-menu-item w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Ver perfil
                    </button>
                    <button
                      onClick={handleLogout}
                      className="profile-menu-item w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && (
          <DashboardView
            user={user}
            monthData={monthData}
            categoryData={categoryData}
            showTaxes={showTaxes}
            selectedMonth={selectedMonth}
            includePending={includePending}
            setSelectedMonth={setSelectedMonth}
            setIncludePending={setIncludePending}
            setShowTaxes={setShowTaxes}
            setCurrentView={setCurrentView}
          />
        )}
        {currentView === 'movements' && <Movements showTaxes={showTaxes} setShowTaxes={setShowTaxes} onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'budgets' && (
          <Budgets
            onBack={() => setCurrentView('dashboard')}
            onViewMovements={() => {
              setCurrentView('movements');
            }}
          />
        )}
        {currentView === 'reports' && <Reports showTaxes={showTaxes} setShowTaxes={setShowTaxes} onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'accounts' && <Accounts key="accounts" onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'categories' && <CategoriesPage onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'goals' && <Goals onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'rules' && <Rules onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'analytics' && <Analytics onBack={() => setCurrentView('dashboard')} />}
      </main>
    </div>
  );
};

interface DashboardViewProps {
  user: { username?: string; email?: string } | null;
  monthData: MonthData;
  categoryData: CategoryData[];
  showTaxes: boolean;
  selectedMonth: string;
  includePending: boolean;
  setSelectedMonth: (month: string) => void;
  setIncludePending: (value: boolean) => void;
  setShowTaxes: (value: boolean) => void;
  setCurrentView: (view: 'dashboard' | 'movements' | 'budgets' | 'reports' | 'accounts' | 'goals' | 'rules' | 'analytics') => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  monthData,
  categoryData,
  showTaxes,
  selectedMonth,
  includePending,
  setSelectedMonth,
  setIncludePending,
  setShowTaxes,
  setCurrentView
}) => {
  const { getMonthlySummary } = useBudgets();
  const [budgetSummary, setBudgetSummary] = React.useState<MonthlySummaryResponse | null>(null);

  React.useEffect(() => {
    const loadBudgetSummary = async () => {
      try {
        const summary = await getMonthlySummary();
        setBudgetSummary(summary);
      } catch {
        // Intentionally empty
      }
    };
    loadBudgetSummary();
  }, [getMonthlySummary]);

  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(Math.abs(numAmount));
  };

  const formatPercentage = (value: string | number): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `${numValue.toFixed(1)}%`;
  };

  const userName = user?.username || user?.email?.split('@')[0] || 'Usuario';
  const incomeGoal = monthData.income > 0 ? monthData.income * 1.2 : 0;
  const expenseGoal = monthData.expenses > 0 ? monthData.expenses * 1.1 : 0;
  const savingsGoal = monthData.balance > 0 ? monthData.balance * 1.5 : 0;
  
  const incomeProgress = incomeGoal > 0 ? (monthData.income / incomeGoal) * 100 : 0;
  const expenseProgress = expenseGoal > 0 ? (monthData.expenses / expenseGoal) * 100 : 0;
  const savingsProgress = savingsGoal > 0 ? (monthData.balance / savingsGoal) * 100 : 0;
  
  const incomeRemaining = incomeGoal - monthData.income;
  const expenseRemaining = expenseGoal - monthData.expenses;
  const savingsRemaining = savingsGoal - monthData.balance;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Bienvenido de vuelta, {userName}!
        </h2>
        <p className="text-gray-600">
          Aquí tienes un resumen rápido de tu cuenta — todo listo para continuar.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
            </select>
          </div>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>Todas las cuentas</option>
          </select>
        </div>
        <div className="flex gap-3 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={includePending}
              onChange={(e) => setIncludePending(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Incluir pendientes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showTaxes}
              onChange={(e) => setShowTaxes(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Mostrar impuestos</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-gray-700">Total Ingresos</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600 mb-3">{formatCurrency(monthData.income)}</p>
            {incomeGoal > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Meta: {formatCurrency(incomeGoal)}</span>
                  <span className="text-gray-600">{incomeProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(incomeProgress, 100)}%` }}
                  ></div>
                </div>
                {incomeRemaining > 0 && (
                  <p className="text-xs text-gray-600">
                    {formatCurrency(incomeRemaining)} para completar el objetivo
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                <p className="text-sm font-medium text-gray-700">Total Gastos</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-red-600 mb-3">{formatCurrency(monthData.expenses)}</p>
            {showTaxes && monthData.ivaCompras > 0 && (
              <p className="text-xs text-gray-500 mb-3">IVA: {formatCurrency(monthData.ivaCompras)}</p>
            )}
            {expenseGoal > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Meta presupuesto: {formatCurrency(expenseGoal)}</span>
                  <span className="text-gray-600">{expenseProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(expenseProgress, 100)}%` }}
                  ></div>
                </div>
                {expenseRemaining > 0 ? (
                  <p className="text-xs text-green-600">
                    {formatCurrency(expenseRemaining)} restantes del presupuesto
                  </p>
                ) : (
                  <p className="text-xs text-red-600">
                    Presupuesto excedido por {formatCurrency(Math.abs(expenseRemaining))}
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-gray-700">Total Ahorros</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-3">{formatCurrency(monthData.balance)}</p>
            {savingsGoal > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Meta: {formatCurrency(savingsGoal)}</span>
                  <span className="text-gray-600">{savingsProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(savingsProgress, 100)}%` }}
                  ></div>
                </div>
                {savingsRemaining > 0 && (
                  <p className="text-xs text-gray-600">
                    {formatCurrency(savingsRemaining)} para completar el objetivo
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

      {/* Resumen de Presupuestos */}
      {budgetSummary && budgetSummary.budgets && budgetSummary.budgets.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Resumen de Presupuestos</h3>
            </div>
            <button
              onClick={() => setCurrentView('budgets')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Ver todos
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgetSummary.budgets.slice(0, 6).map((budget) => {
              const spentPercentage = parseFloat(budget.spent_percentage);
              const statusColor =
                budget.status === 'exceeded'
                  ? 'bg-red-500'
                  : budget.status === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-green-500';
              const statusTextColor =
                budget.status === 'exceeded'
                  ? 'text-red-600'
                  : budget.status === 'warning'
                    ? 'text-amber-600'
                    : 'text-green-600';

              return (
                <div
                  key={budget.budget_id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: budget.category_color }}
                    >
                      {budget.category_icon ? (
                        <i className={`fa-solid ${budget.category_icon}`} aria-hidden="true"></i>
                      ) : (
                        budget.category_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{budget.category_name}</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Progreso</span>
                      <span className={`text-xs font-semibold ${statusTextColor}`}>
                        {formatPercentage(budget.spent_percentage)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-full rounded-full transition-all ${statusColor}`}
                        style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Límite</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(budget.amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Gastado</p>
                      <p className="font-semibold text-red-600">{formatCurrency(budget.spent_amount)}</p>
                    </div>
                  </div>
                  {budget.projection && budget.projection.will_exceed && (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                      <p className="font-semibold">⚠️ Proyección: Excederá el límite</p>
                      <p className="text-amber-700">
                        Estimado: {formatCurrency(budget.projection.projected_amount)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {budgetSummary.budgets.length > 6 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setCurrentView('budgets')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver {budgetSummary.budgets.length - 6} presupuesto{budgetSummary.budgets.length - 6 !== 1 ? 's' : ''} más
              </button>
            </div>
          )}
        </div>
      )}

      {showTaxes && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-5 h-5 text-amber-600" />
              <p className="text-sm font-medium text-amber-900">IVA Compras</p>
            </div>
            <p className="text-xl font-bold text-amber-900">{formatCurrency(monthData.ivaCompras)}</p>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-5 h-5 text-orange-600" />
              <p className="text-sm font-medium text-orange-900">GMF (4×1000)</p>
            </div>
            <p className="text-xl font-bold text-orange-900">{formatCurrency(monthData.gmf)}</p>
          </div>
          
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-red-900">Intereses Tarjetas</p>
            </div>
            <p className="text-xl font-bold text-red-900">{formatCurrency(monthData.creditCardInterests)}</p>
          </div>
        </div>
      )}

      {categoryData.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-2">Alertas de presupuesto</h3>
              <div className="text-sm text-amber-800">
                No hay alertas disponibles
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Distribución de gastos
            </h3>
            {showTaxes && (
              <span className="text-xs text-gray-500">Con impuestos</span>
            )}
          </div>
          {categoryData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p className="text-sm">No hay datos disponibles</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center mb-4">
                <svg width="200" height="200" viewBox="0 0 200 200">
                  {categoryData.map((cat, idx) => {
                    const prevPercentages = categoryData.slice(0, idx).reduce((sum, c) => sum + c.percentage, 0);
                    const startAngle = (prevPercentages / 100) * 360 - 90;
                    const endAngle = ((prevPercentages + cat.percentage) / 100) * 360 - 90;
                    const largeArc = cat.percentage > 50 ? 1 : 0;
                    
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;
                    const x1 = 100 + 70 * Math.cos(startRad);
                    const y1 = 100 + 70 * Math.sin(startRad);
                    const x2 = 100 + 70 * Math.cos(endRad);
                    const y2 = 100 + 70 * Math.sin(endRad);
                    
                    return (
                      <path
                        key={idx}
                        d={`M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={cat.color}
                        className="hover:opacity-80 cursor-pointer transition-opacity"
                        onClick={() => setCurrentView('movements')}
                      />
                    );
                  })}
                  <circle cx="100" cy="100" r="40" fill="white" />
                </svg>
              </div>
              <div className="space-y-2">
                {categoryData.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm hover:bg-gray-50 p-2 rounded cursor-pointer transition-colors" onClick={() => setCurrentView('movements')}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                  <span>{cat.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600">{cat.percentage}%</span>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(showTaxes ? cat.value : cat.base)}</div>
                    {showTaxes && cat.iva > 0 && (
                      <div className="text-xs text-gray-500">IVA: {formatCurrency(cat.iva)}</div>
                    )}
                  </div>
                </div>
              </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Ingreso vs Gasto diario
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <p className="text-sm">No hay datos disponibles</p>
          </div>
          <div className="flex justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Ingresos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Gastos</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => setCurrentView('movements')}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Ver Movimientos</h4>
          <p className="text-sm text-gray-600">Revisa todos tus ingresos y gastos</p>
        </button>

        <button 
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-2">
            <Upload className="w-6 h-6 text-purple-600" />
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Importar Extracto</h4>
          <p className="text-sm text-gray-600">Carga tu extracto bancario</p>
        </button>

        <button 
          onClick={() => setCurrentView('budgets')}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-2">
            <Target className="w-6 h-6 text-amber-600" />
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Presupuestos</h4>
          <p className="text-sm text-gray-600">Gestiona tus límites mensuales</p>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <button 
          onClick={() => setCurrentView('goals')}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-2">
            <Target className="w-6 h-6 text-purple-600" />
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Metas de Ahorro</h4>
          <p className="text-sm text-gray-600">Define y alcanza tus objetivos financieros</p>
        </button>
      </div>
    </div>
    );
};

export default Dashboard;

