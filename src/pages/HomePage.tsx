import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, PieChart, CheckCircle, DollarSign, FileText, CreditCard, BarChart3, AlertCircle, Download, Settings } from 'lucide-react';

export const HomePage: React.FC = () => {
    return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <img src="/horizontal.png" alt="eBalance" className="h-20 w-auto" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Toma control de tus finanzas personales
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Gestiona tus ingresos, gastos y presupuestos de manera inteligente. Visualiza tus patrones de consumo y alcanza tus metas financieras.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/register"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              Comenzar gratis
            </Link>
            <Link
              to="/login"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-all"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Seguimiento en tiempo real</h3>
            <p className="text-gray-600">
              Monitorea tus movimientos y presupuestos al instante. Actualizaciones inmediatas en KPIs, reportes y alertas.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Reportes inteligentes</h3>
            <p className="text-gray-600">
              Obtén insights sobre tus hábitos financieros con donas por categorías, comparativos y análisis de consumo.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Control de impuestos</h3>
            <p className="text-gray-600">
              Gestiona IVA, GMF y deducciones fácilmente. Desglose automático de base, impuestos y comisiones.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Consolidación inteligente</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Unifica datos de todas tus cuentas bancarias, billeteras y tarjetas en una vista única. Importa desde CSV/Excel con plantillas guardadas y detección automática de duplicados.
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Importación guiada con mapeo de columnas</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Prevención de duplicados automática</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Clasificación automática por reglas</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <CreditCard className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Manejo de tarjetas</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Separa correctamente compras, pagos, intereses y cuotas. Evita el doble conteo y gestiona planes de cuotas con desglose de principal e intereses.
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Separación automática de compras y pagos</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Plan de cuotas con intereses categorizados</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Sin doble conteo de gastos</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard y analítica</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Visualiza KPIs del período, donas de gastos por categoría, flujo de caja acumulado y panel fiscal. Conmuta entre vista solo base o base + impuestos.
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>KPIs en tiempo real (ingresos, gastos, balance)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Visualizaciones interactivas con tooltips</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Panel fiscal con IVA y GMF</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Presupuestos y alertas</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Controla tus límites mensuales por categoría con alertas al 80% y 100%. Proyección del cierre del mes considerando cuotas futuras.
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Alertas inteligentes por umbrales</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Proyección de cierre del mes</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Consideración de cuotas futuras</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-lg mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Más funcionalidades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Multi-moneda</h3>
              <p className="text-sm text-gray-600">Soporte para múltiples monedas con tipo de cambio configurable</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Exportación</h3>
              <p className="text-sm text-gray-600">Exporta movimientos y reportes en CSV y PDF</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Reglas personalizables</h3>
              <p className="text-sm text-gray-600">Crea reglas deterministas para clasificación automática</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Trazabilidad</h3>
              <p className="text-sm text-gray-600">Historial completo del porqué de cada clasificación</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">¿Listo para tomar control de tus finanzas?</h2>
          <p className="text-xl mb-8 opacity-90">
            Únete a eBalance y comienza a gestionar tu dinero de manera inteligente hoy mismo.
          </p>
          <Link
            to="/register"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg inline-block"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </div>
        </div>
    );
};
