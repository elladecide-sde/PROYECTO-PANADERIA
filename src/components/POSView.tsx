import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../AppContext';
import { printTicketOrInvoice } from '../utils/exportUtils';
import {
  ShoppingCart,
  ScanBarcode,
  Search,
  Plus,
  Minus,
  Trash2,
  Cpu,
  ReceiptText,
  CreditCard,
  Sparkles,
  Wifi,
  X,
  Printer,
  FileDown,
  CircleAlert
} from 'lucide-react';
import { CategoryType, Product, Sale } from '../types';

export const POSView: React.FC = () => {
  const {
    products,
    addSale,
    gateways,
    activeUser,
    addSystemNotification,
    ingredients
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('efectivo');
  const [customerName, setCustomerName] = useState('');
  const [customerDoc, setCustomerDoc] = useState('');
  
  // Simulation states
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [latestInvoice, setLatestInvoice] = useState<Sale | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [simulateFailedPayment, setSimulateFailedPayment] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('');

  // Audio Beep generator
  const playBeep = (freq = 880, duration = 0.08) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.log('Audio disabled until user interacts with document.');
    }
  };

  // Add item to POS cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      addSystemNotification('❌ Sin Stock Disponible', `El producto ${product.name} no tiene stock suficiente para venderse en este momento.`, 'warning');
      playBeep(220, 0.25);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          addSystemNotification('⚠️ Límite de Stock', `No puedes agregar más de ${product.stock} unidades de ${product.name} (stock actual).`, 'warning');
          return prev;
        }
        playBeep(600, 0.05);
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      playBeep(1000, 0.05);
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Remove or subtract item
  const decreaseQuantity = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (!existing) return prev;
      playBeep(400, 0.05);
      if (existing.quantity === 1) {
        return prev.filter(item => item.product.id !== productId);
      }
      return prev.map(item =>
        item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const removeFromCart = (productId: string) => {
    playBeep(300, 0.1);
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Simulates barcode laser scan
  const startBarcodeScanSimulation = () => {
    if (isScanning) return;
    setIsScanning(true);
    playBeep(350, 0.1);
    
    setTimeout(() => {
      // Pick a random product from Catalog
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      if (randomProduct) {
        addToCart(randomProduct);
        addSystemNotification('📷 Barcode Escaneado', `Escáner láser leyó código: ${randomProduct.code} (${randomProduct.name})`, 'success');
        playBeep(1200, 0.08);
      }
      setIsScanning(false);
    }, 1200);
  };

  // Calculate prices
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const cartTax = cartSubtotal * 0.21; // IVA 21% included
  const cartTotal = cartSubtotal;

  // Process transaction
  const handlePayment = async () => {
    if (cart.length === 0) {
      addSystemNotification('⚠️ Carrito Vacío', 'Agrega algún producto para iniciar el cobro.', 'info');
      return;
    }

    setIsProcessingPayment(true);
    setProcessingStatusText('Conectando con pasarela...');
    playBeep(520, 0.1);

    const gatewayNames: Record<Sale['paymentMethod'], string> = {
      efectivo: 'Caja Local',
      tarjeta: 'Stripe API Gateway',
      mercado_pago: 'Mercado Pago Express',
      paypal: 'PayPal Checkout'
    };

    // Simulated cloud delay for high visual impact
    setTimeout(() => {
      setProcessingStatusText(`Autorizando cargo con ${gatewayNames[paymentMethod]}...`);
      playBeep(650, 0.1);
      
      setTimeout(() => {
        // Execute sale operations
        const result = addSale(
          cart.map(item => ({ productId: item.product.id, quantity: item.quantity })),
          paymentMethod,
          customerDoc,
          customerName,
          simulateFailedPayment
        );

        setIsProcessingPayment(false);
        setSimulateFailedPayment(false);

        if (result.success && result.invoice) {
          setLatestInvoice(result.invoice);
          setShowInvoiceModal(true);
          // Print ticket automatically on sound success
          printTicketOrInvoice(result.invoice, 'receipt');
          // Clear Cart
          setCart([]);
          setCustomerDoc('');
          setCustomerName('');
        } else if (result.invoice) {
          // Failure simulation record was created but transaction rejected
          setLatestInvoice(result.invoice);
          setShowInvoiceModal(true);
          setCart([]); // optionally clean cart on failure to represent reset or let it stay
        } else {
          // Business validations failed (e.g. stock issue)
          alert(`Error de validación de Inventario: ${result.error}`);
        }
      }, 1500);
    }, 1000);
  };

  // Filter products list
  const filteredProducts = products.filter(prod => {
    const matchesCategory = selectedCategory === 'todos' || prod.category === selectedCategory;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.code.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const categoriesList: { id: CategoryType | 'todos'; label: string; icon: string }[] = [
    { id: 'todos', label: 'Todos', icon: '🍪' },
    { id: 'panes', label: 'Panes', icon: '🥖' },
    { id: 'facturas', label: 'Facturas', icon: '🥐' },
    { id: 'pasteleria', label: 'Repostería', icon: '🍰' },
    { id: 'salados', label: 'Salados', icon: '🥪' },
    { id: 'bebidas', label: 'Bebidas', icon: '☕' }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-140px)] transition-all duration-300">
      
      {/* LEFT COLUMN: VISUAL POS GRILL (Big buttons McDonald's style) */}
      <div className="flex-1 bg-white dark:bg-zinc-900 border border-orange-100 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
        
        {/* Category filters (Big scrollable pills) */}
        <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-zinc-800 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label="croissant">🥖</span>
            <h2 className="font-extrabold text-gray-800 dark:text-zinc-100 text-lg">Selección de Panificados</h2>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Quick search & Laser simulation */}
            <div className="relative flex-1 sm:w-64">
              <input
                id="pos-search"
                type="text"
                placeholder="Buscar por nombre o cod..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-lg py-2 pl-8 pr-3 focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-850 dark:text-zinc-100"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            </div>

            <button
              id="btn-scan-trigger"
              onClick={startBarcodeScanSimulation}
              disabled={isScanning}
              className={`px-3 py-2 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isScanning
                  ? 'bg-amber-100 text-amber-700 animate-pulse border-amber-300'
                  : 'bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white hover:opacity-90 border-transparent shadow-xs'
              }`}
              title="Permite simular el escaneo con lector de barra físico en un click"
            >
              <ScanBarcode className="h-4 w-4" />
              {isScanning ? 'Escaneando...' : 'Escanear (Sim)'}
            </button>
          </div>
        </div>

        {/* Hot Horizontal list of Categories with counts */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categoriesList.map(cat => {
            const count = cat.id === 'todos' 
              ? products.length 
              : products.filter(p => p.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                id={`btn-cat-filter-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-extrabold whitespace-nowrap cursor-pointer transition-all duration-255 active:scale-95 border ${
                  isSelected
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md transform scale-102'
                    : 'bg-amber-50/50 hover:bg-amber-100/50 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-orange-100/30'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Big visual Grid Items */}
        <div className="flex-1 overflow-y-auto max-h-[60vh] pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
          {filteredProducts.length === 0 ? (
            <div className="text-center col-span-full py-16 text-gray-400 dark:text-zinc-500">
              <ShoppingCart className="h-12 w-12 mx-auto opacity-20 mb-3" />
              <p className="text-sm font-semibold">No se encontraron productos registrados</p>
              <p className="text-xs text-gray-400 mt-1">Registra nuevos productos en el catálogo o prueba otros filtros</p>
            </div>
          ) : (
            filteredProducts.map(prod => {
              const inStock = prod.stock > 0;
              const lowStock = prod.stock <= prod.minStock;
              const hasIngredients = prod.ingredients && prod.ingredients.length > 0;

              return (
                <button
                  key={prod.id}
                  id={`btn-pos-prod-${prod.id}`}
                  onClick={() => addToCart(prod)}
                  className={`relative flex flex-col justify-between text-left p-4 rounded-3xl border transition-all duration-300 transform active:scale-97 cursor-pointer hover:-translate-y-1 ${
                    !inStock
                      ? 'bg-gray-100 dark:bg-zinc-950/20 border-gray-300 dark:border-zinc-800 opacity-60'
                      : lowStock
                      ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/60 hover:bg-amber-50/70'
                      : 'bg-white dark:bg-zinc-850 hover:bg-orange-50/30 dark:hover:bg-zinc-800 border-amber-100/40 dark:border-zinc-850/50 hover:border-amber-200 shadow-xs'
                  }`}
                >
                  {/* Category overlay label */}
                  <span className="absolute top-2 right-2 text-2xl" img-emoji="true">
                    {prod.image}
                  </span>

                  <div>
                    {/* Item Stock badge */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`inline-block w-20 text-center py-0.5 rounded-full text-[9px] font-extrabold ${
                        !inStock
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/30'
                          : lowStock
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 font-bold'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 font-bold'
                      }`}>
                        {!inStock ? 'SIN STOCK' : `${prod.stock} UNID`}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-extrabold text-sm text-gray-800 dark:text-zinc-100 leading-snug line-clamp-2 pr-6">
                      {prod.name}
                    </h3>
                  </div>

                  {/* Pricing and Recipe helper bottom */}
                  <div className="mt-4 pt-2 border-t border-dotted border-gray-100 dark:border-zinc-800 flex items-center justify-between w-full">
                    <span className="text-sm font-extrabold text-amber-600 dark:text-amber-500">
                      ${prod.price.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono italic">
                      779123...{prod.code.slice(-4)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: POS CHECKOUT CART PANEL (Nueva Venta) */}
      <div className="w-full lg:w-[420px] bg-white dark:bg-zinc-900 border border-orange-100 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col overflow-visible">
        
        {/* Header detail */}
        <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-zinc-800 mb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-amber-500" />
            <h2 className="font-extrabold text-gray-800 dark:text-zinc-100 text-base">Nueva Venta</h2>
          </div>
          <span className="text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 font-bold px-2.5 py-1 rounded-full">
            Nº Comp: Auto-Gen
          </span>
        </div>

        {/* Client identity block (essential for commercial transaction) */}
        <div className="grid grid-cols-2 gap-2 mb-3 bg-gray-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-gray-100 dark:border-zinc-850">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide">Nombre Cliente</label>
            <input
              id="customer-name"
              type="text"
              placeholder="Consumidor Final"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1 w-full text-xs font-semibold bg-transparent border-b border-gray-200 dark:border-zinc-800 py-1 focus:outline-none focus:border-amber-500 text-gray-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide">DNI / CUIT</label>
            <input
              id="customer-doc"
              type="text"
              placeholder="Opcional"
              value={customerDoc}
              onChange={(e) => setCustomerDoc(e.target.value)}
              className="mt-1 w-full text-xs font-semibold bg-transparent border-b border-gray-200 dark:border-zinc-800 py-1 focus:outline-none focus:border-amber-500 text-gray-800 dark:text-zinc-100"
            />
          </div>
        </div>

        {/* Cart Item rows list */}
        <div className="flex-1 overflow-y-auto max-h-[35vh] pr-1 divide-y divide-gray-100 dark:divide-zinc-800 space-y-2 mb-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-zinc-500 border border-dashed border-gray-100 dark:border-zinc-800 rounded-xl">
              <span className="text-4xl block mb-2 opacity-50 font-emoji" role="img" aria-label="bread">🍞</span>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Espera de Selección</p>
              <p className="text-[11px] text-gray-400/80 mt-1">Pulsa un panificado o escanea un barcode para facturar</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="pt-2 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-800 dark:text-zinc-100 truncate">{item.product.name}</p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-500 font-semibold">${item.product.price.toFixed(2)} c/u</p>
                </div>
                
                {/* Item adjustments */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-200 dark:border-zinc-700 rounded-lg">
                    <button
                      id={`btn-cart-minus-${item.product.id}`}
                      onClick={() => decreaseQuantity(item.product.id)}
                      className="p-1 text-gray-500 px-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-2 font-bold font-mono text-gray-800 dark:text-zinc-100">{item.quantity}</span>
                    <button
                      id={`btn-cart-plus-${item.product.id}`}
                      onClick={() => addToCart(item.product)}
                      className="p-1 text-gray-500 px-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <button
                    id={`btn-cart-remove-${item.product.id}`}
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 cursor-pointer"
                    title="Eliminar de la orden de venta"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pricing Subtotals block */}
        <div className="bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 mb-4 space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Neto Gravado (Facturación):</span>
            <span className="font-semibold text-gray-700 dark:text-zinc-300">${(cartSubtotal - cartTax).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>IVA Factura (21.00%):</span>
            <span className="font-semibold text-gray-700 dark:text-zinc-300">${cartTax.toFixed(2)}</span>
          </div>
          <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex justify-between text-base font-extrabold text-gray-850 dark:text-zinc-50">
            <span>TOTAL DE COMPRA:</span>
            <span className="text-amber-600 dark:text-amber-500">${cartTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Gateways / Methods Picker */}
        <div className="mb-4">
          <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-2">Método de Cobro (Integrado)</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'efectivo', label: 'Efectivo', icon: '💵', gateName: null },
              { id: 'tarjeta', label: 'Tarjeta (Stripe)', icon: '💳', gateName: 'Strip' },
              { id: 'mercado_pago', label: 'Mercado Pago', icon: '🤝', gateName: 'Mercado Pago' },
              { id: 'paypal', label: 'PayPal Checkout', icon: '🌐', gateName: 'PayPal' }
            ].map((pm) => {
              const matchesSelected = paymentMethod === pm.id;
              
              // If it has a gateway name, let's look up its state inside the AppContext
              let isGatewayActive = true;
              if (pm.id === 'tarjeta') {
                const stripeGate = gateways.find(g => g.id === 'gate_stripe');
                isGatewayActive = stripeGate ? stripeGate.status === 'active' : true;
              } else if (pm.id === 'mercado_pago') {
                const mpGate = gateways.find(g => g.id === 'gate_mp');
                isGatewayActive = mpGate ? mpGate.status === 'active' : true;
              } else if (pm.id === 'paypal') {
                const ppGate = gateways.find(g => g.id === 'gate_paypal');
                isGatewayActive = ppGate ? ppGate.status === 'active' : true;
              }

              return (
                <button
                  key={pm.id}
                  id={`btn-pm-choice-${pm.id}`}
                  onClick={() => setPaymentMethod(pm.id as Sale['paymentMethod'])}
                  disabled={!isGatewayActive}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                    matchesSelected
                      ? 'bg-amber-100 hover:bg-amber-100/90 text-amber-900 border-amber-400'
                      : !isGatewayActive
                      ? 'bg-gray-100 dark:bg-zinc-950/20 text-gray-400 dark:text-zinc-650 border-gray-200 dark:border-zinc-800 opacity-40 cursor-not-allowed'
                      : 'bg-white dark:bg-zinc-850 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate flex items-center gap-1.5 shrink-0">
                      <span>{pm.icon}</span> <span>{pm.label}</span>
                    </p>
                    {!isGatewayActive && <span className="text-[8px] text-amber-600 block leading-tight">Inactiva</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Trigger to simulate failed bank authorization */}
          {paymentMethod !== 'efectivo' && (
            <div className="mt-3 flex items-center gap-2 bg-red-50 dark:bg-red-950/25 p-2 rounded-lg border border-red-100 dark:border-red-900/40">
              <input
                id="check-simulate-fail"
                type="checkbox"
                checked={simulateFailedPayment}
                onChange={(e) => setSimulateFailedPayment(e.target.checked)}
                className="rounded text-red-500 border-red-300 focus:ring-red-500 h-3.5 w-3.5"
              />
              <label htmlFor="check-simulate-fail" className="text-[10px] text-red-800 dark:text-red-300 font-extrabold cursor-pointer">
                Simular Error de Comunicación / Tarjeta Rechazada
              </label>
            </div>
          )}
        </div>

        {/* Submit Big checkout trigger button */}
        <button
          id="btn-pos-checkout"
          onClick={handlePayment}
          disabled={cart.length === 0 || isProcessingPayment}
          className={`w-full py-4 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md transform hover:-translate-y-0.5 active:translate-y-0 ${
            cart.length === 0 
              ? 'bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-zinc-650 cursor-not-allowed shadow-none border-transparent'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-b-4 border-amber-700'
          }`}
        >
          {isProcessingPayment ? (
            <>
              <Cpu className="h-4 w-4 animate-spin" />
              <span>{processingStatusText}</span>
            </>
          ) : (
            <>
              <CreditCard className="h-4.5 w-4.5" />
              <span>COBRAR Y AUTORIZAR ${cartTotal.toFixed(2)}</span>
            </>
          )}
        </button>

      </div>

      {/* MODAL / POPUP: TRANSACTION CONFIRMATION / PRINT PREVIEW */}
      {showInvoiceModal && latestInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 max-w-sm w-full overflow-hidden flex flex-col">
            
            {/* Header state banner */}
            <div className={`p-5 text-center text-white ${latestInvoice.paymentStatus === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
              <button
                id="btn-modal-close-upper"
                onClick={() => setShowInvoiceModal(false)}
                className="absolute top-3 right-3 text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="bg-white/20 p-3 rounded-full w-14 h-14 mx-auto flex items-center justify-center border border-white/20 mb-2">
                <ReceiptText className="h-8 w-8 text-white" />
              </div>

              <h3 className="font-extrabold text-lg leading-tight uppercase font-sans">
                {latestInvoice.paymentStatus === 'completed' ? '¡Operación Exitosa!' : '¡Transacción Declinada!'}
              </h3>
              <p className="text-[10px] text-white/80 mt-1 uppercase tracking-widest">
                Comp: {latestInvoice.invoiceNumber}
              </p>
            </div>

            {/* Simulated Receipt paper layout */}
            <div className="p-5 flex-1 overflow-y-auto max-h-[50vh] bg-amber-50/20 dark:bg-zinc-950/20 text-xs font-mono">
              <div className="text-center font-sans">
                <p className="font-extrabold uppercase">🥐 TRIGO DE ORO 🥐</p>
                <p className="text-[10px] text-gray-400">Av. San Martín 1542, CABA</p>
                <p className="text-[9px] text-gray-400 mt-1">Sincronizado vía Nube ERP</p>
              </div>

              <div className="border-b border-dashed border-gray-300 dark:border-zinc-800 my-3" />
              
              <div className="space-y-1">
                <p>Fecha: {new Date(latestInvoice.date).toLocaleString('es-AR')}</p>
                <p>Operador: {latestInvoice.operatorName}</p>
                <p>Cliente: {latestInvoice.customerName || 'Consumidor Final'}</p>
                {latestInvoice.customerDoc && <p>CUIT/DNI: {latestInvoice.customerDoc}</p>}
                <p>Método: {latestInvoice.paymentMethod.replace('_', ' ').toUpperCase()}</p>
              </div>

              <div className="border-b border-dashed border-gray-300 dark:border-zinc-800 my-3" />

              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 pb-1">
                    <th>Detalle</th>
                    <th className="text-right">Sub</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/40">
                  {latestInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1">{item.name} x{item.quantity}</td>
                      <td className="text-right py-1">${item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-b border-dashed border-gray-300 dark:border-zinc-800 my-3" />

              <div className="space-y-1 font-sans">
                <div className="flex justify-between">
                  <span>Neto Gravado:</span>
                  <span>${(latestInvoice.total - latestInvoice.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA Incluido (21%):</span>
                  <span>${latestInvoice.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold border-t pt-1.5 border-amber-200">
                  <span>TOTAL COMPRA:</span>
                  <span>${latestInvoice.total.toFixed(2)}</span>
                </div>
              </div>

              {latestInvoice.paymentStatus === 'failed' && (
                <div className="mt-3 bg-red-150 text-red-800 border border-red-300 p-2 rounded-lg font-sans text-center">
                  <p className="font-extrabold flex items-center justify-center gap-1"><CircleAlert className="h-3.5 w-3.5" /> ERROR PASARELA</p>
                  <p className="text-[10px] mt-0.5">El banco rechazó la transacción. No se descontó inventario.</p>
                </div>
              )}
            </div>

            {/* Bottom print control triggers */}
            <div className="p-4 bg-gray-50 dark:bg-zinc-950 flex items-center gap-2 border-t border-gray-100 dark:border-zinc-800">
              <button
                id="btn-print-receipt"
                onClick={() => printTicketOrInvoice(latestInvoice, 'receipt')}
                className="flex-1 py-2 px-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-bold text-gray-750 dark:text-zinc-200 cursor-pointer flex items-center justify-center gap-1.5"
                title="Genera impresión de ticket en papel de 80mm térmica"
              >
                <Printer className="h-4 w-4" /> Imp. Papel (Sim)
              </button>

              <button
                id="btn-print-invoice"
                onClick={() => printTicketOrInvoice(latestInvoice, 'invoice')}
                className="flex-1 py-2 px-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-bold text-gray-750 dark:text-zinc-200 cursor-pointer flex items-center justify-center gap-1.5"
                title="Genera factura electrónica formal en formato A4 PDF listo para imprimir o enviar"
              >
                <FileDown className="h-4 w-4" /> Ticket Digital (PDF)
              </button>
            </div>

            <div className="p-3 bg-gray-100 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-850">
              <button
                id="btn-modal-close-bottom"
                onClick={() => setShowInvoiceModal(false)}
                className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-200 dark:text-zinc-955 text-white rounded-xl text-xs font-bold hover:opacity-90 cursor-pointer transition-opacity"
              >
                Cerrar Comprobante
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
