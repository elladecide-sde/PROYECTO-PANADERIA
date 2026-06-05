import React from 'react';
import { AppProvider, useApp } from './AppContext';
import { MainHeadLayout } from './components/MainHeadLayout';
import { Dashboard } from './components/Dashboard';
import { POSView } from './components/POSView';
import { InventoryView } from './components/InventoryView';
import { SalesHistoryView } from './components/SalesHistoryView';
import { AccountingView } from './components/AccountingView';
import { IntegrationsView } from './components/IntegrationsView';
import { CajeroMermaView } from './components/CajeroMermaView';
import { PanaderoSupplyView } from './components/PanaderoSupplyView';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ReceiptText,
  HandCoins,
  Globe,
  Settings,
  X,
  CreditCard,
  TrendingUp,
  Settings2
} from 'lucide-react';

function ERPLayout() {
  const { deviceMode, activeTab, setActiveTab, activeUser, darkMode } = useApp();

  // Helper trigger to switch visual component frames
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POSView />;
      case 'inventory':
        return <InventoryView />;
      case 'history':
        return <SalesHistoryView />;
      case 'accounting':
        return <AccountingView />;
      case 'integrations':
        return <IntegrationsView />;
      case 'merma_requests':
        return <CajeroMermaView />;
      case 'supply_requests':
        return <PanaderoSupplyView />;
      default:
        // Safe fallback if tab is not in list for this role
        if (activeUser.role === 'cajero') return <POSView />;
        if (activeUser.role === 'panadero') return <InventoryView />;
        return <Dashboard />;
    }
  };

  const getNavItemsByRole = () => {
    const role = activeUser?.role || 'admin';
    switch (role) {
      case 'cajero':
        return [
          { id: 'pos', label: 'Nueva Venta (POS)', icon: <ShoppingCart className="h-4.5 w-4.5" /> },
          { id: 'history', label: 'Historial de Caja', icon: <ReceiptText className="h-4.5 w-4.5" /> },
          { id: 'merma_requests', label: 'Solicitar Merma (Bajas)', icon: <X className="h-4.5 w-4.5 text-red-500 font-bold" /> }
        ];
      case 'panadero':
        return [
          { id: 'inventory', label: 'Inventario y Silos', icon: <Package className="h-4.5 w-4.5" /> },
          { id: 'supply_requests', label: 'Pedidos / Traslados', icon: <TrendingUp className="h-4.5 w-4.5 text-emerald-500 font-bold" /> }
        ];
      case 'admin':
      default:
        return [
          { id: 'dashboard', label: 'Tablero Analítico', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
          { id: 'pos', label: 'Nueva Venta (POS)', icon: <ShoppingCart className="h-4.5 w-4.5" /> },
          { id: 'inventory', label: 'Materia e Insumos', icon: <Package className="h-4.5 w-4.5" /> },
          { id: 'history', label: 'Historial de Caja', icon: <ReceiptText className="h-4.5 w-4.5" /> },
          { id: 'accounting', label: 'Egresos y Balance', icon: <HandCoins className="h-4.5 w-4.5" /> },
          { id: 'integrations', label: 'Pasarelas de Pago', icon: <Globe className="h-4.5 w-4.5" /> }
        ];
    }
  };

  const navItems = getNavItemsByRole();

  // Render differently based on emulate layout mode
  if (deviceMode === 'Tablet') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col font-sans transition-colors duration-300">
        <MainHeadLayout />
        
        {/* Streamlined Mobile view displays POS directly as a high-density Touchscreen teller terminal */}
        <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
          <div className="mb-4 bg-orange-500 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs border-b border-orange-700">
            <div className="flex items-center gap-2">
              <span className="text-xl" role="img" aria-label="croissant">🥐</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Modo Mesa de Pedidos Directa (Tablet/Móvil)</p>
                <p className="text-xs text-orange-100 mt-0.5">Optimizado para interacciones táctiles táctiles con hitboxes de gran tamaño.</p>
              </div>
            </div>
            <button
              id="btn-return-pc"
              onClick={() => setActiveTab('dashboard')}
              className="text-xs font-extrabold bg-white hover:bg-orange-50 text-orange-650 px-3 py-1.5 rounded-lg border border-transparent shadow-xs cursor-pointer transition-colors"
            >
              Cámara Administración Full (Ver PC) →
            </button>
          </div>
          
          <POSView />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col font-sans transition-colors duration-300">
      <MainHeadLayout />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 lg:p-6 gap-6">
        
        {/* Left Side Navigation menu for PC Office session */}
        <aside className="w-full md:w-64 bg-white dark:bg-zinc-900 border border-orange-100/40 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between h-fit gap-6 shadow-xs h-[calc(100vh-140px)] sticky top-6">
          <div className="space-y-4">
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-3 leading-none select-none">
              Módulos Operativos
            </p>
            <nav className="space-y-1 select-none">
              {navItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`btn-nav-tab-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-xs font-extrabold rounded-xl transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10 scale-[1.02]'
                        : 'text-gray-655 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-gray-100/60 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className={isActive ? 'text-white' : 'text-amber-500 dark:text-amber-400'}>
                      {item.icon}
                    </div>
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick operators statistics overview at footer */}
          <div className="bg-amber-50/40 dark:bg-amber-950/15 p-3 rounded-xl border border-amber-250/20 select-none">
            <p className="text-[9px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
              Sesión Iniciada por:
            </p>
            <p className="text-xs font-bold text-gray-805 dark:text-zinc-200 truncate">
              {activeUser.name}
            </p>
            <p className="text-[9px] text-gray-405 mt-0.5 leading-none">
              Permisos de Nivel: {activeUser.role.toUpperCase()}
            </p>
          </div>
        </aside>

        {/* Right Middle main frame dashboard */}
        <section className="flex-1 min-w-0">
          <div className="bg-white dark:bg-zinc-900 border border-orange-100/35 dark:border-zinc-850 rounded-3xl p-5 md:p-6 shadow-xs min-h-[calc(100vh-140px)] transition-all duration-300">
            {renderActiveView()}
          </div>
        </section>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ERPLayout />
    </AppProvider>
  );
}
