import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { exportSalesToCSV } from '../utils/exportUtils';
import {
  TrendingUp,
  LayoutDashboard,
  Wheat,
  Scale,
  Settings2,
  AlertTriangle,
  Receipt,
  ShoppingCart,
  Check,
  Plus,
  ArrowUpRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    sales,
    expenses,
    ingredients,
    products,
    activeUser,
    updateUserWidgets
  } = useApp();

  // Control customization modal visibility
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Available dashboards list configuration
  const ALL_WIDGET_OPTIONS = [
    { id: 'widget_facturacion', label: 'Resumen Rápido Finanzas', desc: 'Tarjetas bento con ingresos, egresos y neto calculado.' },
    { id: 'widget_contabilidad', label: 'Gráfico Analítico Mensual', desc: 'Histograma interactivo de facturación versus egresos.' },
    { id: 'widget_inventario', label: 'Seguimiento de Materia Prima', desc: 'Nivel crítico de existencias principales (Harina, Levadura, etc.).' },
    { id: 'widget_alertas', label: 'Monitor de Notificaciones y Alertas', desc: 'Registro de alertas activas o transacciones fallidas.' },
    { id: 'widget_historico', label: 'Últimos Comprobantes de Caja', desc: 'Historial express de las últimas 4 ventas concretadas.' }
  ];

  // Toggle widget membership
  const handleWidgetToggle = (widgetId: string) => {
    const isPresent = activeUser.customPanels.includes(widgetId);
    let updated: string[];
    if (isPresent) {
      // Don't let users empty all widgets so they don't see a blank screen
      if (activeUser.customPanels.length <= 1) {
        alert('Debes dejar al menos una sección activa para visualizar el tablero.');
        return;
      }
      updated = activeUser.customPanels.filter(id => id !== widgetId);
    } else {
      updated = [...activeUser.customPanels, widgetId];
    }
    updateUserWidgets(updated);
  };

  // Reorder shift down/up simulation
  const shiftWidgetOrderDetail = (widgetId: string, direction: 'up' | 'down') => {
    const idx = activeUser.customPanels.indexOf(widgetId);
    if (idx === -1) return;
    const items = [...activeUser.customPanels];
    
    if (direction === 'up' && idx > 0) {
      const temp = items[idx - 1];
      items[idx - 1] = items[idx];
      items[idx] = temp;
    } else if (direction === 'down' && idx < items.length - 1) {
      const temp = items[idx + 1];
      items[idx + 1] = items[idx];
      items[idx] = temp;
    }
    updateUserWidgets(items);
  };

  // 1. Math formulas for dashboard calculations
  const successfulSales = sales.filter(s => s.paymentStatus === 'completed');
  const totalRevenue = successfulSales.reduce((acc, s) => acc + s.total, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalInsumosSobrantesValue = ingredients.reduce((sum, ing) => sum + (ing.stock * ing.unitCost), 0);
  const lowIngredientsCount = ingredients.filter(i => i.stock <= i.minStock).length;

  {/* RENDER INDIVIDUAL WIDGET: FINANCIAL SUMMARY BENTO DECORATORS */}
  const renderWidgetFacturacion = () => {
    return (
      <div key="facturacion" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Rev */}
        <div className="bg-white dark:bg-zinc-900 border border-orange-100/40 dark:border-zinc-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-505 rounded-xl border border-emerald-100">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Ventas Cobradas</p>
              <p className="text-lg font-black text-gray-805 dark:text-zinc-50 mt-0.5">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
          <span className="text-xs text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/10 px-2 py-1 rounded">
            +{(totalRevenue > 0 ? 100 : 0)}%
          </span>
        </div>

        {/* Exp */}
        <div className="bg-white dark:bg-zinc-900 border border-orange-100/40 dark:border-zinc-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-505 rounded-xl border border-red-100 font-bold">
              📉
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Egresos / Gastos</p>
              <p className="text-lg font-black text-gray-850 dark:text-zinc-50 mt-0.5">${totalExpenses.toFixed(2)}</p>
            </div>
          </div>
          <span className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/10 px-2 py-1 rounded">
            -{(totalExpenses > 0 ? 100 : 0)}%
          </span>
        </div>

        {/* Insumos */}
        <div className="bg-white dark:bg-zinc-900 border border-orange-100/40 dark:border-zinc-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-650 rounded-xl border border-amber-100">
              🌾
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Valorización Insumo</p>
              <p className="text-lg font-black text-gray-850 dark:text-zinc-50 mt-0.5">${totalInsumosSobrantesValue.toFixed(2)}</p>
            </div>
          </div>
          <span className="text-xs text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/10 px-2 py-1 rounded">
            Reserva
          </span>
        </div>

      </div>
    );
  };

  {/* RENDER INDIVIDUAL WIDGET: ANALYTICAL INTERACTIVE HISTOGRAM */}
  const renderWidgetContabilidad = () => {
    // We will build a beautiful pixel perfect pure React-SVG bar chart tracking sales popularity
    // categories count: Panes, facturas, repostería, salados, bebidas
    const categoryStats = {
      panes: 0,
      facturas: 0,
      pasteleria: 0,
      salados: 0,
      bebidas: 0
    };

    successfulSales.forEach(sale => {
      sale.items.forEach(item => {
        // Find Category in original product catalog
        const cat = products.find(p => p.id === item.productId)?.category;
        if (cat && cat in categoryStats) {
          categoryStats[cat] += item.subtotal;
        }
      });
    });

    const categories = Object.keys(categoryStats) as (keyof typeof categoryStats)[];
    const maxVal = Math.max(...Object.values(categoryStats), 20);

    return (
      <div key="contabilidad" className="bg-white dark:bg-zinc-900 border border-orange-100/45 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-sm text-gray-850 dark:text-zinc-100 flex items-center gap-2">
            📊 Volumen de Facturación por Categoría de Panificados
          </h3>
          <span className="text-[10px] text-gray-400 font-bold">MONITOREO EN VIVO</span>
        </div>

        {/* SVG graph container */}
        <div className="relative h-56 w-full flex items-end justify-between gap-2 border-b border-gray-200 dark:border-zinc-800 pb-2 pt-4">
          {categories.map((catKey, idx) => {
            const val = categoryStats[catKey];
            const heightPct = Math.max((val / maxVal) * 80, 5); // at least 5% bar for nice visual baseline
            
            const titles: Record<string, string> = {
              panes: '🥖 Panes',
              facturas: '🥐 Facturas',
              pasteleria: '🍰 Pastelería',
              salados: '🥪 Salados',
              bebidas: '☕ Bebidas'
            };

            const colors: Record<string, string> = {
              panes: 'bg-amber-500',
              facturas: 'bg-orange-500',
              pasteleria: 'bg-rose-500',
              salados: 'bg-emerald-500',
              bebidas: 'bg-sky-500'
            };

            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                {/* Popover value */}
                <span className="text-[10px] font-mono font-bold text-gray-700 dark:text-zinc-300 mb-1.5">${val.toFixed(1)}</span>
                {/* Column block */}
                <div
                  className={`w-11 md:w-16 rounded-t-lg transition-all duration-500 ${colors[catKey]} shadow-xs hover:opacity-90 cursor-pointer`}
                  style={{ height: `${heightPct}%` }}
                  title={`${titles[catKey]}: $${val.toFixed(2)}`}
                />
                {/* Name label */}
                <span className="text-[10px] font-bold text-gray-500 mt-2 truncate max-w-full text-center">
                  {titles[catKey].split(' ')[1]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  {/* RENDER INDIVIDUAL WIDGET: RAW MATERIALS STOCK STATUS TRACKER */}
  const renderWidgetInventario = () => {
    return (
      <div key="inventario" className="bg-white dark:bg-zinc-900 border border-orange-100/40 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
        <h3 className="font-extrabold text-sm text-gray-850 dark:text-zinc-100 flex items-center gap-2 mb-4">
          🌾 Monitor de Materia Prima en Silos
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {ingredients.slice(0, 6).map(ing => {
            const isAlert = ing.stock <= ing.minStock;
            return (
              <div key={ing.id} className={`p-3 rounded-xl border ${isAlert ? 'bg-red-50/15 border-red-200 dark:bg-red-950/10' : 'bg-gray-50/50 dark:bg-zinc-950/30'}`}>
                <p className="text-[10px] text-gray-500 font-bold truncate">{ing.name}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-base font-black ${isAlert ? 'text-red-500' : 'text-gray-800 dark:text-zinc-100'}`}>
                    {ing.stock.toFixed(1)}
                  </span>
                  <span className="text-[9px] text-gray-400 font-bold">{ing.unit}</span>
                </div>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${isAlert ? 'bg-red-100 text-red-800 dark:bg-red-950/30' : 'bg-emerald-100 text-emerald-850 dark:bg-emerald-950/30'}`}>
                  {isAlert ? 'Comprar ya' : 'Suficiente'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  {/* RENDER INDIVIDUAL WIDGET: CRITICAL NOTIFICATIONS LOGS LIST */}
  const renderWidgetAlertas = () => {
    // Alerts lists
    const lowStockItems = ingredients.filter(i => i.stock <= i.minStock);
    const failedPaymentsCount = sales.filter(s => s.paymentStatus === 'failed').length;

    return (
      <div key="alertas" className="bg-white dark:bg-zinc-900 border border-orange-100/40 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
        <h3 className="font-extrabold text-sm text-gray-[850] dark:text-zinc-100 flex items-center gap-2 mb-3">
          🚨 Monitor de Alertas de Producción
        </h3>
        
        {lowStockItems.length === 0 && failedPaymentsCount === 0 ? (
          <div className="text-center py-8 text-emerald-600">
            <Check className="h-8 w-8 mx-auto mb-1 animate-bounce" />
            <p className="text-xs font-bold leading-none">Cero alertas activas</p>
            <p className="text-[10px] text-gray-400 mt-1">Todas las harinas y balanzas están óptimas</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {lowStockItems.map(item => (
              <div key={item.id} className="p-2 bg-red-50 dark:bg-red-950/15 border border-red-200/50 rounded-xl text-xs flex gap-2">
                <AlertTriangle className="h-4 w-4 text-red-550 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-red-850 dark:text-red-300 leading-snug">Stock crítico: {item.name}</p>
                  <p className="text-[10px] text-gray-500">Quedan {item.stock.toFixed(2)} {item.unit} (Umbral de aviso: {item.minStock} {item.unit})</p>
                </div>
              </div>
            ))}

            {failedPaymentsCount > 0 && (
              <div className="p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 rounded-xl text-xs flex gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-amber-800 dark:text-amber-350 leading-snug">{failedPaymentsCount} Rechazos Financieros</p>
                  <p className="text-[10px] text-gray-500">Operaciones con PayPal o Stripe fueron canceladas por falta de fondos simulada.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  {/* RENDER INDIVIDUAL WIDGET: RECENT TELLER COMPROBANTES EXP LOG */}
  const renderWidgetHistorico = () => {
    return (
      <div key="historico" className="bg-white dark:bg-zinc-900 border border-orange-100/40 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
        <h3 className="font-extrabold text-sm text-gray-850 dark:text-zinc-100 flex items-center gap-2 mb-3">
          🧾 Últimas Transacciones del Día
        </h3>
        <div className="divide-y divide-gray-100 dark:divide-zinc-800 space-y-2">
          {successfulSales.slice(0, 4).map((sale, i) => (
            <div key={i} className="pt-2 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-gray-800 dark:text-zinc-200">{sale.invoiceNumber}</p>
                <p className="text-[9px] text-gray-400 capitalize">{sale.customerName || 'Consumidor Final'} • {sale.paymentMethod.replace('_', ' ')}</p>
              </div>
              <span className="font-mono font-black text-amber-600 dark:text-amber-500">${sale.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Map of keys to actual renderer components
  const widgetMapping: Record<string, () => React.JSX.Element> = {
    widget_facturacion: renderWidgetFacturacion,
    widget_contabilidad: renderWidgetContabilidad,
    widget_inventario: renderWidgetInventario,
    widget_alertas: renderWidgetAlertas,
    widget_historico: renderWidgetHistorico
  };

  return (
    <div className="space-y-6 transition-all duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b pb-4 border-gray-100 dark:border-zinc-800 select-none">
        <div>
          <h2 className="text-xl font-extrabold text-gray-850 dark:text-zinc-50 flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-amber-500" /> Tablero de Inteligencia de Negocio
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            Analíticas consolidadas de producción, arqueo y ventas sincronizadas en la nube.
          </p>
        </div>

        {/* Customization launcher */}
        <button
          id="btn-customize-dashboard"
          onClick={() => setShowConfigModal(true)}
          className="py-2.5 px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 text-gray-600 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <Settings2 className="h-4.5 w-4.5 text-amber-500" /> Personalizar mi Panel
        </button>
      </div>

      {/* DYNAMIC WIDGETS DISPLAY (based on user custom preferred array!) */}
      <div className="space-y-6">
        {activeUser.customPanels.map(widgetId => {
          const renderer = widgetMapping[widgetId];
          if (!renderer) return null;

          return (
            <div key={widgetId} className="relative group">
              {/* Controls hovering overlay */}
              <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 flex gap-1 bg-white dark:bg-zinc-900 border border-gray-150 p-1.5 rounded-lg shadow-sm transition-opacity z-10 select-none">
                <button
                  id={`btn-widget-up-${widgetId}`}
                  onClick={() => shiftWidgetOrderDetail(widgetId, 'up')}
                  className="text-xs font-bold text-gray-500 hover:text-amber-500 p-1 cursor-pointer shrink-0"
                  title="Subir posición"
                >
                  ▲
                </button>
                <button
                  id={`btn-widget-down-${widgetId}`}
                  onClick={() => shiftWidgetOrderDetail(widgetId, 'down')}
                  className="text-xs font-bold text-gray-500 hover:text-amber-500 p-1 cursor-pointer shrink-0"
                  title="Bajar posición"
                >
                  ▼
                </button>
                <button
                  id={`btn-widget-hide-${widgetId}`}
                  onClick={() => handleWidgetToggle(widgetId)}
                  className="text-xs font-bold text-gray-450 hover:text-red-500 p-1 cursor-pointer shrink-0"
                  title="Ocultar de mi tablero personal"
                >
                  ✕
                </button>
              </div>

              {/* Render content */}
              {renderer()}
            </div>
          );
        })}
      </div>

      {/* CUSTOMIZATION DRAWER CONFIGURATION MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fade-in dialog-overlay">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5 border-gray-100 dark:border-zinc-800 select-none">
              <h3 className="font-extrabold text-base text-gray-850 dark:text-zinc-50 flex items-center gap-1.5">
                <Settings2 className="h-4.5 w-4.5 text-amber-500" /> Configurar Tablero de Analíticas
              </h3>
              <button
                id="btn-config-modal-close"
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed font-semibold">
              Seleccione las secciones que desea ver activas en su pantalla de inicio. Cada operador (Dueño, Cajera, Panadera) conserva su distribución predilecta.
            </p>

            <div className="space-y-2 select-none">
              {ALL_WIDGET_OPTIONS.map(opt => {
                const isActive = activeUser.customPanels.includes(opt.id);

                return (
                  <button
                    key={opt.id}
                    id={`btn-toggle-widget-choice-${opt.id}`}
                    type="button"
                    onClick={() => handleWidgetToggle(opt.id)}
                    className={`w-full p-3 rounded-2xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-50/70 border-amber-300 dark:bg-amber-950/20 dark:border-amber-900 text-amber-900 dark:text-amber-400 font-bold'
                        : 'bg-white dark:bg-zinc-850 border-gray-100 dark:border-zinc-805 hover:bg-gray-55 text-gray-700 dark:text-zinc-300'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-black">{opt.label}</p>
                      <p className="text-[10px] text-gray-450 dark:text-zinc-500 leading-tight font-medium mt-0.5">{opt.desc}</p>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isActive ? 'bg-amber-500 border-transparent text-white' : 'border-gray-300'}`}>
                      {isActive && <Check className="h-3 w-3" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-gray-155 select-none">
              <button
                id="btn-config-modal-confirm"
                onClick={() => setShowConfigModal(false)}
                className="w-full py-3 bg-zinc-900 dark:bg-zinc-200 dark:text-zinc-950 text-white rounded-2xl text-xs font-bold hover:opacity-90 cursor-pointer text-center"
              >
                Listo, Guardar Distribución
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
