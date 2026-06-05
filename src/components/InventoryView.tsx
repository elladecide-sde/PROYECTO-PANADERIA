import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { exportIngredientsToCSV } from '../utils/exportUtils';
import {
  Download,
  Plus,
  Package,
  Wheat,
  Activity,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Search,
  CheckCircle,
  X
} from 'lucide-react';
import { Ingredient, Product, CategoryType, ProductIngredient } from '../types';

export const InventoryView: React.FC = () => {
  const {
    ingredients,
    products,
    addIngredient,
    updateIngredientStock,
    addProduct,
    updateProductStock,
    addSystemNotification
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'insumos' | 'productos'>('insumos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Insumo creation form modal
  const [showInsumoModal, setShowInsumoModal] = useState(false);
  const [insumoName, setInsumoName] = useState('');
  const [insumoUnit, setInsumoUnit] = useState<Ingredient['unit']>('kg');
  const [insumoStock, setInsumoStock] = useState(10);
  const [insumoMinStock, setInsumoMinStock] = useState(5);
  const [insumoCost, setInsumoCost] = useState(1.5);

  // Product creation form modal & dynamic recipe builder
  const [showProductModal, setShowProductModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<CategoryType>('panes');
  const [prodPrice, setProdPrice] = useState(1.5);
  const [prodCost, setProdCost] = useState(0.5);
  const [prodStock, setProdStock] = useState(50);
  const [prodMinStock, setProdMinStock] = useState(10);
  const [prodImage, setProdImage] = useState('🥖');
  const [selectedRecipeIngredients, setSelectedRecipeIngredients] = useState<{ ingredientId: string; quantity: number }[]>([]);

  // Individual stock adjust
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<number>(0);

  // Handle ingredient addition
  const handleCreateInsumoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insumoName.trim()) return;

    addIngredient({
      name: insumoName,
      unit: insumoUnit,
      stock: Number(insumoStock),
      minStock: Number(insumoMinStock),
      unitCost: Number(insumoCost)
    });

    // Reset fields
    setInsumoName('');
    setInsumoUnit('kg');
    setInsumoStock(10);
    setInsumoMinStock(5);
    setInsumoCost(1.5);
    setShowInsumoModal(false);
  };

  // Add ingredient requirement line to Product recipe builder
  const toggleRecipeIngredientItem = (ingredientId: string, quantity: number) => {
    setSelectedRecipeIngredients(prev => {
      const exists = prev.find(i => i.ingredientId === ingredientId);
      if (exists) {
        return prev.filter(i => i.ingredientId !== ingredientId);
      } else {
        return [...prev, { ingredientId, quantity }];
      }
    });
  };

  const updateRecipeIngredientQuantity = (ingredientId: string, val: number) => {
    setSelectedRecipeIngredients(prev =>
      prev.map(item =>
        item.ingredientId === ingredientId ? { ...item, quantity: val } : item
      )
    );
  };

  // Handle product addition
  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    addProduct({
      name: prodName,
      category: prodCategory,
      price: Number(prodPrice),
      cost: Number(prodCost),
      stock: Number(prodStock),
      minStock: Number(prodMinStock),
      image: prodImage,
      ingredients: selectedRecipeIngredients
    });

    // Reset controls
    setProdName('');
    setProdCategory('panes');
    setProdPrice(1.5);
    setProdCost(0.5);
    setProdStock(50);
    setProdMinStock(10);
    setProdImage('🥖');
    setSelectedRecipeIngredients([]);
    setShowProductModal(false);
  };

  // Quick replenish helper
  const triggerIncrementStockVal = (ing: Ingredient, incAmount: number) => {
    updateIngredientStock(ing.id, ing.stock + incAmount);
  };

  const currentIngredientsInventoryValue = ingredients.reduce((sum, ing) => sum + (ing.stock * ing.unitCost), 0);
  const currentProductsInventoryValue = products.reduce((sum, prod) => sum + (prod.stock * prod.price), 0);
  const totalLowStockInsumos = ingredients.filter(i => i.stock <= i.minStock).length;
  const totalLowStockProducts = products.filter(p => p.stock <= p.minStock).length;

  return (
    <div className="space-y-6 transition-all duration-300">
      
      {/* HEADER SECTION WITH STATS COUNTER */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b pb-4 border-gray-100 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-extrabold text-gray-850 dark:text-zinc-50 flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-500" /> Control de Inventario en Tiempo Real
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            Administración coordinada de insumos primarios y productos terminados listos para mostrador.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {activeSubTab === 'insumos' ? (
            <button
              id="btn-add-insumo-trigger"
              onClick={() => setShowInsumoModal(true)}
              className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow-md h-9 shrink-0 transition-all"
            >
              <Plus className="h-4 w-4" /> Registrar Materia Prima
            </button>
          ) : (
            <button
              id="btn-add-product-trigger"
              onClick={() => setShowProductModal(true)}
              className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow-md h-9 shrink-0 transition-all"
            >
              <Plus className="h-4 w-4" /> Registrar Pan Elaborado Mismo
            </button>
          )}

          <button
            id="btn-export-insumos"
            onClick={() => exportIngredientsToCSV(ingredients)}
            className="py-2 px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 h-9 shrink-0 transition-all cursor-pointer"
            title="Exportar inventario del ERP a formato de datos CSV"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* THREE BENTO CARDS OF INVENTORY BALANCES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: Valor Insumos */}
        <div className="bg-white dark:bg-zinc-900 border border-orange-100/40 dark:border-zinc-800 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900">
            <Wheat className="h-6 w-6 text-amber-600 dark:text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-tight">Valor Físico Insumos</p>
            <p className="text-xl font-extrabold text-gray-850 dark:text-zinc-50 mt-1">
              ${currentIngredientsInventoryValue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">Estimado en base a costos netos</p>
          </div>
        </div>

        {/* Card 2: Valor Sucursal Mostrador */}
        <div className="bg-white dark:bg-zinc-900 border border-orange-100/40 dark:border-zinc-800 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900">
            <Activity className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-tight">Valor Venta Mostrador</p>
            <p className="text-xl font-extrabold text-gray-850 dark:text-zinc-50 mt-1">
              ${currentProductsInventoryValue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">Mercadería disponible para la venta</p>
          </div>
        </div>

        {/* Card 3: Alertas de Quiebre de Stock */}
        <div className="bg-white dark:bg-zinc-900 border border-orange-100/40 dark:border-zinc-800 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-tight">Quiebre / Stock Bajo</p>
            <p className="text-xl font-extrabold text-gray-850 dark:text-zinc-50 mt-1">
              {totalLowStockInsumos + totalLowStockProducts} Alertas
            </p>
            <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1 font-bold">
              {totalLowStockInsumos} insumos • {totalLowStockProducts} horneados restantes
            </p>
          </div>
        </div>

      </div>

      {/* FILTER SUB-BAR (Insumos vs Productos Elaborados) */}
      <div className="bg-white dark:bg-zinc-900 border border-orange-100/30 dark:border-zinc-850 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
        <div className="bg-gray-100 dark:bg-zinc-950 p-0.5 rounded-xl flex border border-gray-200 dark:border-zinc-800 select-none">
          <button
            id="btn-subtab-insumos"
            onClick={() => setActiveSubTab('insumos')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'insumos'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700'
            }`}
          >
            Materia Prima / Insumos de Panadería
          </button>
          <button
            id="btn-subtab-productos"
            onClick={() => setActiveSubTab('productos')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'productos'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700'
            }`}
          >
            Productos Elaborados (Venta Final)
          </button>
        </div>

        <div className="relative w-full sm:w-64 select-none">
          <input
            id="stock-search"
            type="text"
            placeholder="Filtrar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-gray-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800 rounded-lg py-2 pl-8 pr-3 focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-800 dark:text-zinc-100"
          />
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
        </div>
      </div>

      {/* LIST OR CARDS VIEW IN REAL TIME */}
      {activeSubTab === 'insumos' ? (
        <div className="bg-white dark:bg-zinc-900 border border-orange-100/40 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-zinc-950 text-[10px] font-bold text-gray-500 uppercase tracking-wider select-none">
                <tr>
                  <th className="py-4 px-5">Insumo</th>
                  <th className="py-4 px-5">Costo Unitario ($)</th>
                  <th className="py-4 px-5">Tipo Unidad</th>
                  <th className="py-4 px-5 text-center">Nivel Crítico</th>
                  <th className="py-4 px-5 text-right">Stock de Reserva</th>
                  <th className="py-4 px-5 text-right">Restablecer / Sumar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 font-semibold text-gray-800 dark:text-zinc-200">
                {ingredients
                  .filter(ing => ing.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(ing => {
                    const isAlert = ing.stock <= ing.minStock;
                    const stockPercentage = Math.min((ing.stock / (ing.minStock * 3)) * 100, 100);

                    return (
                      <tr key={ing.id} className={`hover:bg-gray-50/50 dark:hover:bg-zinc-850/30 ${isAlert ? 'bg-red-50/10' : ''}`}>
                        <td className="py-4 px-5">
                          <div>
                            <p className="font-bold text-gray-850 dark:text-zinc-100">{ing.name}</p>
                            <p className="text-[10px] text-gray-450 dark:text-zinc-500 font-mono italic">ID: {ing.id}</p>
                          </div>
                        </td>
                        <td className="py-4 px-5 font-mono">${ing.unitCost.toFixed(2)}</td>
                        <td className="py-4 px-5 capitalize text-gray-500 font-medium">{ing.unit}</td>
                        <td className="py-4 px-5 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isAlert
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/30'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20'
                          }`}>
                            {isAlert ? '⚠️ CRÍTICO' : '☕ ÓPTIMO'}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right font-mono">
                          <div className="inline-block text-right">
                            <span className={`font-extrabold text-sm ${isAlert ? 'text-red-500' : 'text-gray-800 dark:text-zinc-50'}`}>
                              {ing.stock.toFixed(2)} {ing.unit}
                            </span>
                            <div className="w-24 bg-gray-100 dark:bg-zinc-800 h-1.5 rounded-full mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isAlert ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${stockPercentage}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-gray-400 block mt-0.5 leading-none">Mín: {ing.minStock} {ing.unit}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1 select-none">
                            <button
                              id={`btn-replenish-10-${ing.id}`}
                              onClick={() => triggerIncrementStockVal(ing, 10)}
                              className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 text-[10px] font-bold text-amber-700 dark:text-amber-400 cursor-pointer"
                              title="Suma 10 unidades al stock físico del insumo de inmediato"
                            >
                              +10 {ing.unit}
                            </button>
                            <button
                              id={`btn-replenish-50-${ing.id}`}
                              onClick={() => triggerIncrementStockVal(ing, 50)}
                              className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 text-[10px] font-bold text-amber-700 dark:text-amber-400 cursor-pointer"
                              title="Suma 50 unidades al stock físico del insumo de inmediato"
                            >
                              +50 {ing.unit}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(prod => {
              const isAlert = prod.stock <= prod.minStock;
              const hasRecipe = prod.ingredients && prod.ingredients.length > 0;

              return (
                <div
                  key={prod.id}
                  className={`p-4 rounded-2xl border bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 shadow-xs flex flex-col justify-between ${
                    isAlert ? 'border-l-4 border-l-red-500' : ''
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl" img-emoji="true">{prod.image}</span>
                        <div>
                          <h3 className="font-extrabold text-sm text-gray-850 dark:text-zinc-50">{prod.name}</h3>
                          <span className="text-[10px] bg-amber-100/60 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase font-bold text-[9px]">
                            {prod.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs font-extrabold text-emerald-500">${prod.price.toFixed(2)}</p>
                        <p className="text-[9px] text-gray-400 leading-tight">Costo: ${prod.cost.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Stock indicator row */}
                    <div className="mt-4 flex items-center justify-between text-xs bg-gray-50 dark:bg-zinc-950/30 p-2 rounded-xl">
                      <span className="text-gray-500">Stock Mostrador:</span>
                      <div className="text-right font-mono">
                        <span className={`font-extrabold ${isAlert ? 'text-red-500' : 'text-gray-800 dark:text-zinc-50'}`}>
                          {prod.stock} unidades
                        </span>
                        <span className="text-[9px] text-gray-400 block font-sans">Crítico: {prod.minStock}</span>
                      </div>
                    </div>

                    {/* Recipe lists info block */}
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-4">Ingredientes de Elaboración (Costo)</p>
                    <div className="mt-1 space-y-1">
                      {hasRecipe ? (
                        prod.ingredients.map((recipe, idx) => {
                          const originalIng = ingredients.find(i => i.id === recipe.ingredientId);
                          return (
                            <div key={idx} className="flex justify-between text-[11px] font-medium text-gray-600 dark:text-zinc-400">
                              <span className="truncate">🌾 {originalIng?.name || 'Insumo Eliminado'}</span>
                              <span className="font-mono text-zinc-400 shrink-0">
                                {recipe.quantity} {originalIng?.unit}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-[10px] text-gray-400 italic">No requiere insumos directos (venta directa de terceros)</p>
                      )}
                    </div>
                  </div>

                  {/* Increment finished baked good stock counts directly */}
                  <div className="mt-5 pt-3 border-t border-gray-150 dark:border-zinc-800 flex items-center gap-2 select-none">
                    <button
                      id={`btn-prod-replenish-10-${prod.id}`}
                      onClick={() => updateProductStock(prod.id, prod.stock + 10)}
                      className="flex-1 py-1 px-1 text-center bg-gray-50 hover:bg-gray-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 rounded text-[10px] font-bold text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-750 cursor-pointer"
                      title="Horneada rápida: suma 10 unidades al stock disponible"
                    >
                      Sumar +10 {prod.image}
                    </button>
                    <button
                      id={`btn-prod-replenish-50-${prod.id}`}
                      onClick={() => updateProductStock(prod.id, prod.stock + 50)}
                      className="flex-1 py-1 px-1 text-center bg-gray-50 hover:bg-gray-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 rounded text-[10px] font-bold text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-750 cursor-pointer"
                      title="Horneada completa: suma 50 unidades al stock disponible"
                    >
                      Sumar +50 {prod.image}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* MODAL 1: ADD NEW INSUMO */}
      {showInsumoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fade-in">
          <form
            onSubmit={handleCreateInsumoSubmit}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 max-w-sm w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2.5 border-gray-100 dark:border-zinc-800">
              <h3 className="font-extrabold text-base text-gray-850 dark:text-zinc-50 flex items-center gap-1.5">
                <Wheat className="h-4.5 w-4.5 text-amber-500" /> Registrar Materia Prima
              </h3>
              <button
                type="button"
                id="btn-insumo-modal-close"
                onClick={() => setShowInsumoModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Nombre del Insumo / Harina</label>
              <input
                id="modal-insumo-name"
                type="text"
                required
                placeholder="Por ej: Harina Integral Organica"
                value={insumoName}
                onChange={(e) => setInsumoName(e.target.value)}
                className="w-full text-xs font-semibold bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-705 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-850 dark:text-zinc-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Tipo Unidad</label>
                <select
                  id="modal-insumo-unit"
                  value={insumoUnit}
                  onChange={(e) => setInsumoUnit(e.target.value as Ingredient['unit'])}
                  className="w-full text-xs bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-705 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-850 dark:text-zinc-100"
                >
                  <option value="kg">kilogramos (kg)</option>
                  <option value="g">gramos (g)</option>
                  <option value="L">litros (L)</option>
                  <option value="ml">mililitros (ml)</option>
                  <option value="unidades">unidades (u)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Costo Unitario ($)</label>
                <input
                  id="modal-insumo-cost"
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={insumoCost}
                  onChange={(e) => setInsumoCost(Number(e.target.value))}
                  className="w-full text-xs bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-705 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-850 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Stock Inicial</label>
                <input
                  id="modal-insumo-stock"
                  type="number"
                  step="0.1"
                  required
                  min="0"
                  value={insumoStock}
                  onChange={(e) => setInsumoStock(Number(e.target.value))}
                  className="w-full text-xs bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-705 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-850 dark:text-zinc-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Alerta de Stock (Mín)</label>
                <input
                  id="modal-insumo-minstock"
                  type="number"
                  step="0.1"
                  required
                  min="0.1"
                  value={insumoMinStock}
                  onChange={(e) => setInsumoMinStock(Number(e.target.value))}
                  className="w-full text-xs bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-705 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-850 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center gap-2">
              <button
                type="button"
                id="btn-insumo-modal-cancel"
                onClick={() => setShowInsumoModal(false)}
                className="flex-1 py-3 text-xs font-bold ring-1 ring-gray-200 dark:ring-zinc-850 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-insumo-modal-submit"
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Guardar Insumo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: ADD NEW BAKERY PRODUCT & ATTACH DYNAMIC INGREDIENTS FORMULA */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fade-in dialog-overlay">
          <form
            onSubmit={handleCreateProductSubmit}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-2.5 border-gray-100 dark:border-zinc-800">
              <h3 className="font-extrabold text-base text-gray-850 dark:text-zinc-50 flex items-center gap-1.5 font-sans">
                👑 Agregar Panificado / Producto Especial
              </h3>
              <button
                type="button"
                id="btn-prod-modal-close"
                onClick={() => setShowProductModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Nombre del Producto</label>
                <input
                  id="modal-prod-name"
                  type="text"
                  required
                  placeholder="Por ej: Pan Dulce Especial"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-705 rounded-xl p-3 focus:outline-none text-gray-850 dark:text-zinc-100 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Categoría</label>
                <select
                  id="modal-prod-category"
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value as CategoryType)}
                  className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-705 rounded-xl p-3 focus:outline-none text-gray-850 dark:text-zinc-100"
                >
                  <option value="panes">Panes (loaves)</option>
                  <option value="facturas">Facturas / Dulces</option>
                  <option value="pasteleria">Pastelería y Tortas</option>
                  <option value="bebidas">Cafetaría y Bebidas</option>
                  <option value="salados">Salados y Sándwiches</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Ícono Emojí</label>
                <select
                  id="modal-prod-emoji"
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-705 rounded-xl p-3 focus:outline-none text-gray-850 dark:text-zinc-100"
                >
                  <option value="🥖">🥖 pan flauta / baguette</option>
                  <option value="🥐">🥐 croissant / medialuna</option>
                  <option value="🍞">🍞 pancito</option>
                  <option value="🥯">🥯 bagel / dona</option>
                  <option value="🧁">🧁 muffin / magdalena</option>
                  <option value="🍰">🍰 tarta / torta dulce</option>
                  <option value="🍩">🍩 dona decorada</option>
                  <option value="🥪">🥪 sandwich salado</option>
                  <option value="☕">☕ café caliente</option>
                  <option value="🍊">🍊 exprimido natural</option>
                  <option value="🥨">🥨 vigilantes / cuernitos</option>
                  <option value="🍫">🍫 budín chocolate</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Precio de Venta Mostrador ($)</label>
                <input
                  id="modal-prod-price"
                  type="number"
                  step="0.01"
                  required
                  min="0.05"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(Number(e.target.value))}
                  className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-705 rounded-xl p-3 focus:outline-none text-gray-850 dark:text-zinc-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Costo Estimado Producción ($)</label>
                <input
                  id="modal-prod-cost"
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={prodCost}
                  onChange={(e) => setProdCost(Number(e.target.value))}
                  className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-705 rounded-xl p-3 focus:outline-none text-gray-850 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Stock Inicial Horneado</label>
                <input
                  id="modal-prod-stock"
                  type="number"
                  required
                  min="0"
                  value={prodStock}
                  onChange={(e) => setProdStock(Number(e.target.value))}
                  className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-705 rounded-xl p-3 focus:outline-none text-gray-850 dark:text-zinc-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Alerta Quiebre Stock (Mín)</label>
                <input
                  id="modal-prod-minstock"
                  type="number"
                  required
                  min="1"
                  value={prodMinStock}
                  onChange={(e) => setProdMinStock(Number(e.target.value))}
                  className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-705 rounded-xl p-3 focus:outline-none text-gray-850 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* INTERACTIVE FORMULA CREATOR SECTION */}
            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 space-y-2">
              <label className="text-[11px] font-extrabold text-amber-600 dark:text-amber-500 uppercase tracking-wider block">
                Fórmula de Consumo (Ingredientes consumidos por unidad vendida)
              </label>
              
              <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-zinc-800 p-3 rounded-xl divide-y divide-gray-100 dark:divide-zinc-850 space-y-1 bg-gray-50/50 dark:bg-zinc-950/40">
                {ingredients.map(ing => {
                  const activeRecipeItem = selectedRecipeIngredients.find(r => r.ingredientId === ing.id);
                  const isChecked = !!activeRecipeItem;

                  return (
                    <div key={ing.id} className="flex items-center justify-between text-xs py-2 select-none">
                      <div className="flex items-center gap-2">
                        <input
                          id={`modal-recipe-check-${ing.id}`}
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRecipeIngredientItem(ing.id, 0.05)}
                          className="rounded text-amber-500 border-gray-300 focus:ring-amber-500 h-3.5 w-3.5"
                        />
                        <span className="font-semibold text-gray-800 dark:text-zinc-200">{ing.name} ({ing.unit})</span>
                      </div>
                      
                      {isChecked && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400">Gasto:</span>
                          <input
                            id={`modal-recipe-amount-${ing.id}`}
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={activeRecipeItem.quantity}
                            onChange={(e) => updateRecipeIngredientQuantity(ing.id, Number(e.target.value))}
                            className="w-20 font-mono bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 py-1 px-2 rounded-lg text-xs leading-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center gap-2">
              <button
                type="button"
                id="btn-prod-modal-cancel"
                onClick={() => setShowProductModal(false)}
                className="flex-1 py-3 text-xs font-bold ring-1 ring-gray-200 dark:ring-zinc-850 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-prod-modal-submit"
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Guardar Nuevo Horneado
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
