import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, PieChart, Activity, Upload, FileText, Target, ChevronRight, Receipt, Percent, AlertCircle, User, LogOut, Users, Car, ReceiptText, Menu, X, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBudgets } from '../../context/BudgetContext';
import { MonthlySummaryResponse } from '../../services/budgetService';
import { dashboardService, FinancialDashboardData } from '../../services/dashboardService';
import { accountService, Account } from '../../services/accountService';
import { formatMoney, Currency } from '../../utils/currencyUtils';
import { lazy, Suspense } from 'react';
import RecentTransactions from '../../components/RecentTransactions';
import UpcomingBills from '../../components/UpcomingBills';

const Movements = lazy(() => import('../movements/Movements'));
const Budgets = lazy(() => import('../budgets/Budgets'));
const Reports = lazy(() => import('../reports/Reports'));
const Accounts = lazy(() => import('../accounts/Accounts'));
const CategoriesPage = lazy(() => import('../categories/Categories'));
const Goals = lazy(() => import('../goals/Goals'));
const Rules = lazy(() => import('../rules/Rules'));
const Analytics = lazy(() => import('../analytics/Analytics'));
const Vehicles = lazy(() => import('../vehicles/Vehicles'));
const SOATs = lazy(() => import('../soats/SOATs'));
const Bills = lazy(() => import('../bills/Bills'));

const ViewLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-gray-600 text-sm">Cargando...</p>
    </div>
  </div>
);
import NotificationCenter from '../../components/NotificationCenter';
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

type ViewType = 'dashboard' | 'movements' | 'budgets' | 'reports' | 'accounts' | 'categories' | 'goals' | 'rules' | 'analytics' | 'vehicles' | 'soats' | 'bills';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  
  // Restaurar la última vista desde localStorage, o usar 'dashboard' por defecto
  const getInitialView = (): ViewType => {
    const savedView = localStorage.getItem('dashboard_last_view');
    const validViews: ViewType[] = ['dashboard', 'movements', 'budgets', 'reports', 'accounts', 'categories', 'goals', 'rules', 'analytics', 'vehicles', 'soats', 'bills'];
    if (savedView && validViews.includes(savedView as ViewType)) {
      return savedView as ViewType;
    }
    return 'dashboard';
  };
  
  const [currentView, setCurrentView] = useState<ViewType>(getInitialView());
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [includePending, setIncludePending] = useState(false);
  const [showTaxes, setShowTaxes] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  // Estado para el dashboard financiero
  const [dashboardData, setDashboardData] = useState<FinancialDashboardData | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  
  // Guardar la vista actual en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('dashboard_last_view', currentView);
  }, [currentView]);

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

  // Cargar lista de cuentas
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accountsList = await accountService.getAllAccounts();
        setAccounts(accountsList.filter(acc => acc.is_active !== false));
      } catch (error) {
        console.error('Error al cargar cuentas:', error);
      }
    };
    loadAccounts();
  }, []);

  // Cargar datos del dashboard financiero
  useEffect(() => {
    const loadFinancialDashboard = async () => {
      // Solo cargar si estamos en la vista dashboard
      if (currentView !== 'dashboard') return;
      
      try {
        setIsLoadingDashboard(true);
        setDashboardError(null);
        
        // Extraer año y mes del selectedMonth (formato: "2025-12")
        const [year, month] = selectedMonth.split('-').map(Number);
        
        const data = await dashboardService.getFinancialDashboard({
          year,
          month,
          account_id: selectedAccountId || undefined,
        });
        
        setDashboardData(data);
      } catch (error) {
        console.error('Error al cargar dashboard financiero:', error);
        setDashboardError(error instanceof Error ? error.message : 'Error al cargar los datos');
      } finally {
        setIsLoadingDashboard(false);
      }
    };
    
    loadFinancialDashboard();
  }, [selectedMonth, selectedAccountId, currentView]); // Recargar cuando cambie el mes, cuenta o vista

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
            <div className="flex items-center gap-4 md:gap-8">
              <img src="/logo.png" alt="eBalance" className="h-6 md:h-8 w-auto" />
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              {/* Desktop Navigation - Always visible on md+ */}
              <nav className="nav-tabs-responsive desktop-nav hidden md:flex md:flex-row md:relative md:bg-transparent md:border-0 md:p-0 md:shadow-none md:z-auto md:max-h-none md:overflow-visible gap-4 lg:gap-6">
                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press whitespace-nowrap ${
                    currentView === 'dashboard' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setCurrentView('movements');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press whitespace-nowrap ${
                    currentView === 'movements' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Movimientos
                </button>
                <button
                  onClick={() => {
                    setCurrentView('budgets');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press whitespace-nowrap ${
                    currentView === 'budgets' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Presupuestos
                </button>
                <button
                  onClick={() => {
                    setCurrentView('reports');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press whitespace-nowrap ${
                    currentView === 'reports' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Reportes
                </button>
                <button
                  onClick={() => {
                    setCurrentView('accounts');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press whitespace-nowrap ${
                    currentView === 'accounts' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Cuentas
                </button>
                <button
                  onClick={() => {
                    setCurrentView('categories');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press whitespace-nowrap ${
                    currentView === 'categories'
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Categorías
                </button>
                <button
                  onClick={() => {
                    setCurrentView('goals');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press whitespace-nowrap ${
                    currentView === 'goals'
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Metas
                </button>
                <button
                  onClick={() => {
                    setCurrentView('rules');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press whitespace-nowrap ${
                    currentView === 'rules'
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Reglas
                </button>
                <button
                  onClick={() => {
                    setCurrentView('analytics');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press whitespace-nowrap ${
                    currentView === 'analytics'
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => {
                    setCurrentView('vehicles');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press flex items-center gap-1 whitespace-nowrap ${
                    currentView === 'vehicles' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Car className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Vehículos</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentView('soats');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press flex items-center gap-1 whitespace-nowrap ${
                    currentView === 'soats' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Car className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>SOATs</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentView('bills');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press flex items-center gap-1 whitespace-nowrap ${
                    currentView === 'bills' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ReceiptText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Facturas</span>
                </button>
              </nav>

              {/* Mobile Navigation - Only visible when menu is open */}
              {showMobileMenu && (
                <nav className="nav-tabs-responsive mobile-nav md:hidden flex flex-col absolute top-16 left-0 right-0 bg-white border-b border-gray-200 p-4 shadow-lg z-50 max-h-[calc(100vh-4rem)] overflow-y-auto gap-4">
                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press whitespace-nowrap ${
                    currentView === 'dashboard' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setCurrentView('movements');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press whitespace-nowrap ${
                    currentView === 'movements' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Movimientos
                </button>
                <button
                  onClick={() => {
                    setCurrentView('budgets');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press whitespace-nowrap ${
                    currentView === 'budgets' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Presupuestos
                </button>
                <button
                  onClick={() => {
                    setCurrentView('reports');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press whitespace-nowrap ${
                    currentView === 'reports' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Reportes
                </button>
                <button
                  onClick={() => {
                    setCurrentView('accounts');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press whitespace-nowrap ${
                    currentView === 'accounts' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Cuentas
                </button>
                <button
                  onClick={() => {
                    setCurrentView('categories');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press whitespace-nowrap ${
                    currentView === 'categories'
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Categorías
                </button>
                <button
                  onClick={() => {
                    setCurrentView('goals');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press whitespace-nowrap ${
                    currentView === 'goals'
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Metas
                </button>
                <button
                  onClick={() => {
                    setCurrentView('rules');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press whitespace-nowrap ${
                    currentView === 'rules'
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Reglas
                </button>
                <button
                  onClick={() => {
                    setCurrentView('analytics');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press whitespace-nowrap ${
                    currentView === 'analytics'
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => {
                    setCurrentView('vehicles');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press flex items-center gap-1 whitespace-nowrap ${
                    currentView === 'vehicles' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Car className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Vehículos</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentView('soats');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press flex items-center gap-1 whitespace-nowrap ${
                    currentView === 'soats' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Car className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>SOATs</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentView('bills');
                    setShowMobileMenu(false);
                  }}
                  className={`text-xs sm:text-sm font-medium transition-smooth button-press flex items-center gap-1 whitespace-nowrap ${
                    currentView === 'bills' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ReceiptText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Facturas</span>
                </button>
                </nav>
              )}
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden sm:block">
                <NotificationCenter />
              </div>
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
                  <div className="profile-menu-responsive absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={handleViewProfile}
                      className="profile-menu-item w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Ver perfil
                    </button>
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => {
                          navigate('/admin/users');
                          setShowProfileMenu(false);
                        }}
                        className="profile-menu-item w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Users className="w-4 h-4" />
                        Administrar Usuarios
                      </button>
                    )}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 page-enter">
        {currentView === 'dashboard' && (
          <DashboardView
            user={user}
            monthData={monthData}
            categoryData={categoryData}
            showTaxes={showTaxes}
            selectedMonth={selectedMonth}
            selectedAccountId={selectedAccountId}
            accounts={accounts}
            includePending={includePending}
            setSelectedMonth={setSelectedMonth}
            setSelectedAccountId={setSelectedAccountId}
            setIncludePending={setIncludePending}
            setShowTaxes={setShowTaxes}
            setCurrentView={setCurrentView}
            dashboardData={dashboardData}
            isLoadingDashboard={isLoadingDashboard}
            dashboardError={dashboardError}
          />
        )}
        {currentView === 'movements' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <Movements showTaxes={showTaxes} setShowTaxes={setShowTaxes} onBack={() => setCurrentView('dashboard')} />
          </Suspense>
        )}
        {currentView === 'budgets' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <Budgets
              onBack={() => setCurrentView('dashboard')}
              onViewMovements={() => {
                setCurrentView('movements');
              }}
            />
          </Suspense>
        )}
        {currentView === 'reports' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <Reports showTaxes={showTaxes} setShowTaxes={setShowTaxes} onBack={() => setCurrentView('dashboard')} />
          </Suspense>
        )}
        {currentView === 'accounts' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <Accounts key="accounts" onBack={() => setCurrentView('dashboard')} />
          </Suspense>
        )}
        {currentView === 'categories' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <CategoriesPage onBack={() => setCurrentView('dashboard')} />
          </Suspense>
        )}
        {currentView === 'goals' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <Goals onBack={() => setCurrentView('dashboard')} />
          </Suspense>
        )}
        {currentView === 'rules' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <Rules onBack={() => setCurrentView('dashboard')} />
          </Suspense>
        )}
        {currentView === 'analytics' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <Analytics onBack={() => setCurrentView('dashboard')} />
          </Suspense>
        )}
        {currentView === 'vehicles' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <Vehicles />
          </Suspense>
        )}
        {currentView === 'soats' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <SOATs />
          </Suspense>
        )}
        {currentView === 'bills' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <Bills />
          </Suspense>
        )}
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
  selectedAccountId: number | null;
  accounts: Account[];
  includePending: boolean;
  setSelectedMonth: (month: string) => void;
  setSelectedAccountId: (id: number | null) => void;
  setIncludePending: (value: boolean) => void;
  setShowTaxes: (value: boolean) => void;
  setCurrentView: (view: ViewType) => void;
  dashboardData: FinancialDashboardData | null;
  isLoadingDashboard: boolean;
  dashboardError: string | null;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  monthData,
  categoryData,
  showTaxes,
  selectedMonth,
  selectedAccountId,
  accounts,
  includePending,
  setSelectedMonth,
  setSelectedAccountId,
  setIncludePending,
  setShowTaxes,
  setCurrentView,
  dashboardData,
  isLoadingDashboard,
  dashboardError
}) => {
  const { getMonthlySummary } = useBudgets();
  const [budgetSummary, setBudgetSummary] = React.useState<MonthlySummaryResponse | null>(null);

  React.useEffect(() => {
    const loadBudgetSummary = async () => {
      try {
        const summary = await getMonthlySummary();
        setBudgetSummary(summary);
      } catch {
        void 0;
      }
    };
    loadBudgetSummary();
  }, [getMonthlySummary]);

  const formatCurrency = (amount: number | string, currency: Currency = 'COP'): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return formatMoney(0, currency);
    return formatMoney(Math.abs(numAmount), currency);
  };

  const formatPercentage = (value: string | number): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `${numValue.toFixed(1)}%`;
  };

  const userName = user?.username || user?.email?.split('@')[0] || 'Usuario';
  
  // Encontrar el nombre de la cuenta seleccionada
  const selectedAccountName = selectedAccountId 
    ? accounts.find(acc => acc.id === selectedAccountId)?.name 
    : null;
  
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
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
          ¡Bienvenido de vuelta, {userName}!
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm sm:text-base text-gray-600">
            Aquí tienes un resumen rápido de tu cuenta — todo listo para continuar.
          </p>
          {selectedAccountName && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              📊 {selectedAccountName}
            </span>
          )}
        </div>
      </div>

      {/* Mostrar error si lo hay */}
      {dashboardError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-red-900 mb-1">Error al cargar el dashboard</h3>
              <p className="text-xs sm:text-sm text-red-800">{dashboardError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 sm:flex-none px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {(() => {
                const months = [];
                const currentDate = new Date();
                const currentYear = currentDate.getFullYear();
                const currentMonth = currentDate.getMonth();
                
                // Generar últimos 12 meses
                for (let i = 0; i < 12; i++) {
                  const date = new Date(currentYear, currentMonth - i, 1);
                  const year = date.getFullYear();
                  const month = date.getMonth() + 1;
                  const value = `${year}-${month.toString().padStart(2, '0')}`;
                  const label = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                  months.push(
                    <option key={value} value={value}>
                      {label.charAt(0).toUpperCase() + label.slice(1)}
                    </option>
                  );
                }
                return months;
              })()}
            </select>
          </div>
          <select 
            value={selectedAccountId || ''}
            onChange={(e) => setSelectedAccountId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full sm:w-auto px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las cuentas</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.currency})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
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

      <div className="stats-grid-responsive">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover-lift card-enter">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                <p className="text-xs sm:text-sm font-medium text-gray-700">Total Ingresos</p>
              </div>
            </div>
            {isLoadingDashboard ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : dashboardData ? (
              <>
                <p className="text-2xl sm:text-3xl font-bold text-green-600 mb-2 sm:mb-3">
                  {formatMoney(dashboardData.summary.total_income)} {dashboardData.summary.currency}
                </p>
                {incomeGoal > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Meta: {formatCurrency(incomeGoal)}</span>
                      <span className="text-gray-600">{incomeProgress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all progress-animated"
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
              </>
            ) : (
              <p className="text-2xl sm:text-3xl font-bold text-green-600">$0</p>
            )}
          </div>
          
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover-lift card-enter" style={{ animationDelay: '0.1s' }}>
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
                <p className="text-xs sm:text-sm font-medium text-gray-700">Total Gastos</p>
              </div>
            </div>
            {isLoadingDashboard ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : dashboardData ? (
              <>
                <p className="text-2xl sm:text-3xl font-bold text-red-600 mb-2 sm:mb-3">
                  {formatMoney(dashboardData.summary.total_expenses)} {dashboardData.summary.currency}
                </p>
                {showTaxes && dashboardData.summary.total_iva > 0 && (
                  <p className="text-xs text-gray-500 mb-3">
                    IVA: {formatMoney(dashboardData.summary.total_iva)} {dashboardData.summary.currency}
                  </p>
                )}
                {expenseGoal > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Meta presupuesto: {formatCurrency(expenseGoal)}</span>
                      <span className="text-gray-600">{expenseProgress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all progress-animated"
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
              </>
            ) : (
              <p className="text-2xl sm:text-3xl font-bold text-red-600">$0</p>
            )}
          </div>
          
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover-lift card-enter" style={{ animationDelay: '0.2s' }}>
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                <p className="text-xs sm:text-sm font-medium text-gray-700">Total Ahorros</p>
              </div>
            </div>
            {isLoadingDashboard ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : dashboardData ? (
              <>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2 sm:mb-3">
                  {formatMoney(dashboardData.summary.total_savings)} {dashboardData.summary.currency}
                </p>
                {savingsGoal > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Meta: {formatCurrency(savingsGoal)}</span>
                      <span className="text-gray-600">{savingsProgress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all progress-animated"
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
              </>
            ) : (
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">$0</p>
            )}
          </div>
        </div>

      {/* Resumen de Presupuestos */}
      {budgetSummary && budgetSummary.budgets && budgetSummary.budgets.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Resumen de Presupuestos</h3>
            </div>
            <button
              onClick={() => setCurrentView('budgets')}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Ver todos
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm flex-shrink-0"
                      style={{ backgroundColor: budget.category_color }}
                    >
                      {budget.category_icon ? (
                        <i className={`fa-solid ${budget.category_icon}`} aria-hidden="true"></i>
                      ) : (
                        budget.category_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{budget.category_name}</p>
                    </div>
                  </div>
                  <div className="mb-2 sm:mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Progreso</span>
                      <span className={`text-xs font-semibold ${statusTextColor}`}>
                        {formatPercentage(budget.spent_percentage)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                      <div
                        className={`h-full rounded-full transition-all ${statusColor}`}
                        style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500 text-xs">Límite</p>
                      <p className="font-semibold text-gray-900 text-xs sm:text-sm">{formatCurrency(budget.amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Gastado</p>
                      <p className="font-semibold text-red-600 text-xs sm:text-sm">{formatCurrency(budget.spent_amount)}</p>
                    </div>
                  </div>
                  {budget.projection && budget.projection.will_exceed && (
                    <div className="mt-2 sm:mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
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

      {showTaxes && dashboardData && (
        <div className="stats-grid-responsive">
          <div className="bg-amber-50 border border-amber-200 p-3 sm:p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0" />
              <p className="text-xs sm:text-sm font-medium text-amber-900">IVA Compras</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-amber-900">
              {formatMoney(dashboardData.summary.total_iva)} {dashboardData.summary.currency}
            </p>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 p-3 sm:p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
              <p className="text-xs sm:text-sm font-medium text-orange-900">GMF (4×1000)</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-orange-900">
              {formatMoney(dashboardData.summary.total_gmf)} {dashboardData.summary.currency}
            </p>
          </div>
        </div>
      )}

      {/* Movimientos Recientes */}
      {dashboardData && dashboardData.recent_transactions && dashboardData.recent_transactions.length > 0 && (
        <RecentTransactions transactions={dashboardData.recent_transactions} />
      )}

      {/* Próximas Facturas a Vencer */}
      {dashboardData && dashboardData.upcoming_bills && dashboardData.upcoming_bills.length > 0 && (
        <UpcomingBills bills={dashboardData.upcoming_bills} />
      )}

      {categoryData.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-amber-900 mb-1 sm:mb-2">Alertas de presupuesto</h3>
              <div className="text-xs sm:text-sm text-amber-800">
                No hay alertas disponibles
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Gráfico de Distribución de Gastos */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <PieChart className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Distribución de gastos</span>
            </h3>
            {showTaxes && (
              <span className="text-xs text-gray-500">Con impuestos</span>
            )}
          </div>
          {!dashboardData || !dashboardData.charts.expense_distribution.has_data || dashboardData.charts.expense_distribution.categories.length === 0 ? (
            <div className="h-48 sm:h-64 flex items-center justify-center text-gray-400">
              <p className="text-xs sm:text-sm">No hay datos disponibles</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center mb-4 overflow-x-auto">
                <svg className="w-full max-w-[200px] h-auto" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
                  {dashboardData.charts.expense_distribution.categories.map((cat, idx) => {
                    const prevPercentages = dashboardData.charts.expense_distribution.categories.slice(0, idx).reduce((sum, c) => sum + c.percentage, 0);
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
                {dashboardData.charts.expense_distribution.categories.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm hover:bg-gray-50 p-2 rounded cursor-pointer transition-colors" onClick={() => setCurrentView('movements')}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                      <span>{cat.icon && `${cat.icon} `}{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">{cat.percentage.toFixed(1)}%</span>
                      <div className="text-right">
                        <div className="font-medium">{formatMoney(cat.amount)} {dashboardData.summary.currency}</div>
                        <div className="text-xs text-gray-500">{cat.count} transacciones</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Gráfico de Flujo Diario */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span>Ingreso vs Gasto diario</span>
          </h3>
          {!dashboardData || !dashboardData.charts.daily_flow.has_data || dashboardData.charts.daily_flow.dates.length === 0 ? (
            <div className="h-48 sm:h-64 flex items-center justify-center text-gray-400">
              <p className="text-xs sm:text-sm">No hay datos disponibles</p>
            </div>
          ) : (
            <>
              <div className="h-48 sm:h-64 relative">
                <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                  {/* Línea de ingresos */}
                  <polyline
                    points={dashboardData.charts.daily_flow.dates.map((_, idx) => {
                      const x = (idx / (dashboardData.charts.daily_flow.dates.length - 1)) * 380 + 10;
                      const maxValue = Math.max(...dashboardData.charts.daily_flow.income, ...dashboardData.charts.daily_flow.expenses);
                      const y = 190 - ((dashboardData.charts.daily_flow.income[idx] / maxValue) * 170);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    className="transition-all"
                  />
                  {/* Línea de gastos */}
                  <polyline
                    points={dashboardData.charts.daily_flow.dates.map((_, idx) => {
                      const x = (idx / (dashboardData.charts.daily_flow.dates.length - 1)) * 380 + 10;
                      const maxValue = Math.max(...dashboardData.charts.daily_flow.income, ...dashboardData.charts.daily_flow.expenses);
                      const y = 190 - ((dashboardData.charts.daily_flow.expenses[idx] / maxValue) * 170);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    className="transition-all"
                  />
                </svg>
              </div>
              <div className="mt-4 flex justify-between text-xs text-gray-600">
                <span>{dashboardData.charts.daily_flow.dates[0]}</span>
                <span>{dashboardData.charts.daily_flow.dates[dashboardData.charts.daily_flow.dates.length - 1]}</span>
              </div>
            </>
          )}
          <div className="flex justify-center gap-4 mt-4 text-xs sm:text-sm">
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

      <div className="cards-grid">
        <button 
          onClick={() => setCurrentView('movements')}
          className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 hover-lift transition-smooth text-left group card-enter"
        >
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
          </div>
          <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Ver Movimientos</h4>
          <p className="text-xs sm:text-sm text-gray-600">Revisa todos tus ingresos y gastos</p>
        </button>

        <button 
          className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 hover-lift transition-smooth text-left group card-enter"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="flex items-center justify-between mb-2">
            <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0" />
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0" />
          </div>
          <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Importar Extracto</h4>
          <p className="text-xs sm:text-sm text-gray-600">Carga tu extracto bancario</p>
        </button>

        <button 
          onClick={() => setCurrentView('budgets')}
          className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 hover-lift transition-smooth text-left group card-enter"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0" />
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-amber-600 transition-colors flex-shrink-0" />
          </div>
          <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Presupuestos</h4>
          <p className="text-xs sm:text-sm text-gray-600">Gestiona tus límites mensuales</p>
        </button>
      </div>

      <div className="cards-grid mt-4">
        <button 
          onClick={() => setCurrentView('goals')}
          className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 hover-lift transition-smooth text-left group card-enter"
        >
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0" />
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0" />
          </div>
          <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Metas de Ahorro</h4>
          <p className="text-xs sm:text-sm text-gray-600">Define y alcanza tus objetivos financieros</p>
        </button>
      </div>
    </div>
    );
};

export default Dashboard;

