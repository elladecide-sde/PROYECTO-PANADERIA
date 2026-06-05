import React, { createContext, useContext, useState, useEffect } from 'react';
import { Ingredient, Product, Sale, Expense, User, PushNotification, PaymentGateway, UserRole } from './types';
import {
  INITIAL_INGREDIENTS,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_EXPENSES,
  USERS,
  INITIAL_NOTIFICATIONS,
  PAYMENT_GATEWAYS
} from './initialData';

interface AppContextType {
  ingredients: Ingredient[];
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  users: User[];
  notifications: PushNotification[];
  gateways: PaymentGateway[];
  activeUser: User;
  deviceMode: 'PC' | 'Tablet';
  darkMode: boolean;
  activeTab: string;
  
  // State setter wraps
  setActiveUserRole: (role: UserRole) => void;
  setDeviceMode: (mode: 'PC' | 'Tablet') => void;
  setDarkMode: (dark: boolean) => void;
  setActiveTab: (tab: string) => void;
  
  // Actions
  addSale: (items: { productId: string; quantity: number }[], paymentMethod: Sale['paymentMethod'], customDoc?: string, customName?: string, simulateFail?: boolean) => { success: boolean; invoice?: Sale; error?: string };
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  updateIngredientStock: (id: string, newStock: number) => void;
  addProduct: (product: Omit<Product, 'id' | 'code'>) => void;
  updateProductStock: (id: string, newStock: number) => void;
  toggleGateway: (id: string) => void;
  updateUserWidgets: (widgets: string[]) => void;
  addSystemNotification: (title: string, message: string, type: PushNotification['type']) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from local storage or defaults
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem('pan_erp_ingredients');
    return saved ? JSON.parse(saved) : INITIAL_INGREDIENTS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('pan_erp_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('pan_erp_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('pan_erp_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('pan_erp_users');
    return saved ? JSON.parse(saved) : USERS;
  });

  const [notifications, setNotifications] = useState<PushNotification[]>(() => {
    const saved = localStorage.getItem('pan_erp_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [gateways, setGateways] = useState<PaymentGateway[]>(() => {
    const saved = localStorage.getItem('pan_erp_gateways');
    return saved ? JSON.parse(saved) : PAYMENT_GATEWAYS;
  });

  const [activeUserId, setActiveUserId] = useState<string>(() => {
    return localStorage.getItem('pan_erp_active_user_id') || 'user_admin';
  });

  const [deviceMode, setDeviceMode] = useState<'PC' | 'Tablet'>(() => {
    return (localStorage.getItem('pan_erp_device_mode') as 'PC' | 'Tablet') || 'PC';
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('pan_erp_dark_mode') === 'true';
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Save changes to localStorage on any state update
  useEffect(() => {
    localStorage.setItem('pan_erp_ingredients', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem('pan_erp_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pan_erp_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('pan_erp_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('pan_erp_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('pan_erp_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('pan_erp_gateways', JSON.stringify(gateways));
  }, [gateways]);

  useEffect(() => {
    localStorage.setItem('pan_erp_active_user_id', activeUserId);
  }, [activeUserId]);

  useEffect(() => {
    localStorage.setItem('pan_erp_device_mode', deviceMode);
  }, [deviceMode]);

  useEffect(() => {
    localStorage.setItem('pan_erp_dark_mode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Derive active user
  const activeUser = users.find(u => u.id === activeUserId) || users[0];

  const setActiveUserRole = (role: UserRole) => {
    const found = users.find(u => u.role === role);
    if (found) {
      setActiveUserId(found.id);
    }
  };

  // Trigger audio alert / browser notifications mock
  const playAlertSound = (type: PushNotification['type']) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      if (type === 'error') {
        // Red double beep
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
        setTimeout(() => {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.frequency.setValueAtTime(180, audioCtx.currentTime);
          gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.2);
        }, 200);
      } else if (type === 'warning') {
        // Flat warning beep
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else if (type === 'success') {
        // Upward pleasant notification chime
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.stop(audioCtx.currentTime + 0.3);
        setTimeout(() => {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
          gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
          osc2.start();
          gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
          osc2.stop(audioCtx.currentTime + 0.35);
        }, 120);
      } else {
        // Subtle informative click
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      }
    } catch (e) {
      // Audio context issue (e.g. user hasn't interacted yet)
      console.log('Audio notification delayed due to browser interaction policies.');
    }
  };

  const addSystemNotification = (title: string, message: string, type: PushNotification['type']) => {
    const newNot: PushNotification = {
      id: `not_${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNot, ...prev].slice(0, 50)); // cap at 50 logs
    playAlertSound(type);
  };

  // Actions
  const addSale = (
    cartItems: { productId: string; quantity: number }[],
    paymentMethod: Sale['paymentMethod'],
    customDoc?: string,
    customName?: string,
    simulateFail: boolean = false
  ) => {
    if (cartItems.length === 0) {
      return { success: false, error: 'La venta está vacía.' };
    }

    // Check if the chosen payment gateway is active (if it is a gateway payment)
    if (paymentMethod === 'tarjeta' || paymentMethod === 'mercado_pago' || paymentMethod === 'paypal') {
      const gMap: Record<Sale['paymentMethod'], string> = {
        tarjeta: 'gate_stripe',
        mercado_pago: 'gate_mp',
        paypal: 'gate_paypal',
        efectivo: ''
      };
      const gateId = gMap[paymentMethod];
      const gate = gateways.find(g => g.id === gateId);
      if (gate && gate.status === 'inactive') {
        const errMsg = `La pasarela de pago para ${gate.name} está inactiva. Habilítala desde Configuración.`;
        addSystemNotification('❌ Error de Pago', errMsg, 'error');
        return { success: false, error: errMsg };
      }
    }

    // Check and deduct stock of final products and sub-ingredients
    const updatedProducts = [...products];
    const updatedIngredients = [...ingredients];
    const saleLineItems: Sale['items'] = [];
    const lowStockAlerts: string[] = [];

    if (simulateFail) {
      // Create a failed invoice record
      const invoiceNum = `FC-X-${Date.now().toString().slice(-4)}-${Math.floor(100000 + Math.random() * 900000)}`;
      const failedSalePayload: Sale = {
        id: `sale_fail_${Date.now()}`,
        invoiceNumber: invoiceNum,
        date: new Date().toISOString(),
        items: cartItems.map(cart => {
          const prod = products.find(p => p.id === cart.productId);
          return {
            productId: cart.productId,
            name: prod?.name || 'Producto Desconocido',
            quantity: cart.quantity,
            price: prod?.price || 0,
            subtotal: (prod?.price || 0) * cart.quantity
          };
        }),
        total: cartItems.reduce((acc, c) => acc + ((products.find(p => p.id === c.productId)?.price || 0) * c.quantity), 0),
        tax: cartItems.reduce((acc, c) => acc + ((products.find(p => p.id === c.productId)?.price || 0) * c.quantity), 0) * 0.21,
        paymentMethod,
        paymentStatus: 'failed',
        operatorRole: activeUser.role,
        operatorName: activeUser.name,
        customerName: customName || 'Cliente de Caja',
        customerDoc: customDoc
      };

      setSales(prev => [failedSalePayload, ...prev]);
      addSystemNotification('❌ Transacción Fallida', `Pago con ${paymentMethod.replace('_', ' ').toUpperCase()} rechazado por el banco. Importe: $${failedSalePayload.total.toFixed(2)}`, 'error');
      return { success: false, invoice: failedSalePayload, error: 'Transacción denegada por la pasarela de pagos.' };
    }

    // Evaluate stock pre-requisites
    for (const item of cartItems) {
      const prodIdx = updatedProducts.findIndex(p => p.id === item.productId);
      if (prodIdx === -1) return { success: false, error: `El producto ${item.productId} no existe.` };
      const product = updatedProducts[prodIdx];

      // Product stock check
      if (product.stock < item.quantity) {
        return { success: false, error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}` };
      }

      // Ingredients check
      for (const recipeIng of product.ingredients) {
        const ingIdx = updatedIngredients.findIndex(i => i.id === recipeIng.ingredientId);
        if (ingIdx !== -1) {
          const ing = updatedIngredients[ingIdx];
          const totalIngNeeded = recipeIng.quantity * item.quantity;
          if (ing.stock < totalIngNeeded) {
            return {
              success: false,
              error: `Materia prima insuficiente para producir ${product.name}. Falta ${ing.name} (Necesitado: ${totalIngNeeded.toFixed(2)}${ing.unit}, Disponible: ${ing.stock.toFixed(2)}${ing.unit})`
            };
          }
        }
      }
    }

    // Process actual stock deductions
    for (const item of cartItems) {
      const prodIdx = updatedProducts.findIndex(p => p.id === item.productId);
      const product = updatedProducts[prodIdx];
      
      // Deduct product stock
      product.stock -= item.quantity;
      if (product.stock <= product.minStock) {
        lowStockAlerts.push(`Stock bajo de ${product.name}: quedan ${product.stock} unidades.`);
      }

      // Deduct recipe ingredients stock
      for (const recipeIng of product.ingredients) {
        const ingIdx = updatedIngredients.findIndex(i => i.id === recipeIng.ingredientId);
        if (ingIdx !== -1) {
          const ing = updatedIngredients[ingIdx];
          ing.stock -= recipeIng.quantity * item.quantity;
          if (ing.stock <= ing.minStock) {
            lowStockAlerts.push(`Peligro: Materia prima baja en "${ing.name}" (${ing.stock.toFixed(2)}${ing.unit} restante).`);
          }
        }
      }

      saleLineItems.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        subtotal: product.price * item.quantity
      });
    }

    // Generate Invoice details
    const subtotalTotal = saleLineItems.reduce((acc, curr) => acc + curr.subtotal, 0);
    const calculatedTax = parseFloat((subtotalTotal * 0.21).toFixed(2)); // standard 21% IVA
    
    // Auto increment sequential invoice
    const dateToday = new Date();
    const sequenceStr = String(sales.filter(s => s.paymentStatus === 'completed').length + 346).padStart(7, '0');
    const invoiceNumber = `FC-A-001-${sequenceStr}`;

    const newSaleInstance: Sale = {
      id: `sale_${Date.now()}`,
      invoiceNumber,
      date: dateToday.toISOString(),
      items: saleLineItems,
      total: parseFloat(subtotalTotal.toFixed(2)),
      tax: calculatedTax,
      paymentMethod,
      paymentStatus: 'completed',
      operatorRole: activeUser.role,
      operatorName: activeUser.name,
      customerName: customName || 'Consumidor Final',
      customerDoc: customDoc
    };

    setProducts(updatedProducts);
    setIngredients(updatedIngredients);
    setSales(prev => [newSaleInstance, ...prev]);

    // Success notifications
    addSystemNotification(
      '💸 Nueva Venta Registrada',
      `Factura ${invoiceNumber} generada con éxito por $${newSaleInstance.total.toFixed(2)}`,
      'success'
    );

    // Alert about low stock elements
    lowStockAlerts.forEach(alertMessage => {
      // Trigger warning delays or separate logs
      addSystemNotification('⚠️ Alerta de Inventario', alertMessage, 'warning');
    });

    return { success: true, invoice: newSaleInstance };
  };

  const addExpense = (newExp: Omit<Expense, 'id' | 'date'>) => {
    const expenseInstance: Expense = {
      ...newExp,
      id: `exp_${Date.now()}`,
      date: new Date().toISOString()
    };
    setExpenses(prev => [expenseInstance, ...prev]);
    addSystemNotification(
      '📉 Gasto Registrado',
      `Se registró un egreso por $${expenseInstance.amount.toFixed(2)} bajo el concepto: ${expenseInstance.concept}`,
      'info'
    );
  };

  const addIngredient = (newIng: Omit<Ingredient, 'id'>) => {
    const ingId = `ing_${newIng.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const item: Ingredient = {
      ...newIng,
      id: ingId
    };
    setIngredients(prev => [...prev, item]);
    addSystemNotification('🌾 Nueva Materia Prima', `Se incorporó ${item.name} (${item.unitCost} $/unidad) al catálogo.`, 'success');
  };

  const updateIngredientStock = (id: string, newStock: number) => {
    setIngredients(prev =>
      prev.map(ing => {
        if (ing.id === id) {
          const diff = newStock - ing.stock;
          if (diff !== 0) {
            addSystemNotification(
              '🔄 Stock Actualizado',
              `Materia prima "${ing.name}" ajustada de ${ing.stock.toFixed(1)}${ing.unit} a ${newStock.toFixed(1)}${ing.unit}`,
              'info'
            );
          }
          return { ...ing, stock: newStock };
        }
        return ing;
      })
    );
  };

  const addProduct = (newProd: Omit<Product, 'id' | 'code'>) => {
    const prodId = `prod_${newProd.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const code = `77912345${Math.floor(10000 + Math.random() * 90000)}`;
    const productInstance: Product = {
      ...newProd,
      id: prodId,
      code
    };
    setProducts(prev => [...prev, productInstance]);
    addSystemNotification('🥐 Nuevo Producto', `Se agregó "${productInstance.name}" al catálogo de panadería.`, 'success');
  };

  const updateProductStock = (id: string, newStock: number) => {
    setProducts(prev =>
      prev.map(prod => {
        if (prod.id === id) {
          return { ...prod, stock: newStock };
        }
        return prod;
      })
    );
  };

  const toggleGateway = (id: string) => {
    setGateways(prev =>
      prev.map(gate => {
        if (gate.id === id) {
          const targetStatus = gate.status === 'active' ? 'inactive' : 'active';
          addSystemNotification(
            '🌐 Integración de Pagos',
            `Pasarela ${gate.name} ahora se encuentra: ${targetStatus.toUpperCase()}`,
            targetStatus === 'active' ? 'success' : 'warning'
          );
          return { ...gate, status: targetStatus };
        }
        return gate;
      })
    );
  };

  const updateUserWidgets = (updatedWidgets: string[]) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === activeUser.id) {
          return { ...u, customPanels: updatedWidgets };
        }
        return u;
      })
    );
    addSystemNotification('📋 Tablero Personalizado', `Se guardó tu distribución preferida de analíticas para ${activeUser.name}.`, 'info');
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const resetAllData = () => {
    localStorage.removeItem('pan_erp_ingredients');
    localStorage.removeItem('pan_erp_products');
    localStorage.removeItem('pan_erp_sales');
    localStorage.removeItem('pan_erp_expenses');
    localStorage.removeItem('pan_erp_users');
    localStorage.removeItem('pan_erp_notifications');
    localStorage.removeItem('pan_erp_gateways');
    localStorage.removeItem('pan_erp_active_user_id');
    localStorage.removeItem('pan_erp_device_mode');
    localStorage.removeItem('pan_erp_dark_mode');

    setIngredients(INITIAL_INGREDIENTS);
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setExpenses(INITIAL_EXPENSES);
    setUsers(USERS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setGateways(PAYMENT_GATEWAYS);
    setActiveUserId('user_admin');
    setDeviceMode('PC');
    setDarkMode(false);
    setActiveTab('dashboard');

    addSystemNotification('⚙️ Sistema Reiniciado', 'La base de datos original ha sido restablecida en tiempo real.', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        ingredients,
        products,
        sales,
        expenses,
        users,
        notifications,
        gateways,
        activeUser,
        deviceMode,
        darkMode,
        activeTab,
        setActiveUserRole,
        setDeviceMode,
        setDarkMode,
        setActiveTab,
        addSale,
        addExpense,
        addIngredient,
        updateIngredientStock,
        addProduct,
        updateProductStock,
        toggleGateway,
        updateUserWidgets,
        addSystemNotification,
        markNotificationAsRead,
        clearNotifications,
        resetAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
