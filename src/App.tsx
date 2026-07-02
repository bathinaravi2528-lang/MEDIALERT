import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  LogOut,
  LogIn,
  ShieldAlert,
  MapPin,
  Phone,
  Activity,
  Package,
  History,
  Filter,
  AlertTriangle,
  X,
  Sparkles,
  Building,
  Info,
  HeartHandshake,
  Bell,
  Lock,
  Mail,
  User,
  ArrowLeft,
  CreditCard,
  QrCode
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useApp } from './contexts/AppContext';
import { vizagLocations } from './data/medicines';
import { hospitals } from './data/hospitals';
import { orders as initialOrders } from './data/orders';
import MedicineCard from './components/MedicineCard';
import Logo from './components/Logo';
import Toast from './components/Toast';
import Badge from './components/Badge';
import { getDaysLeft, getExpiryStatus, formatDate, generateTransactionId } from './utils/helpers';
import { Medicine, Order, Notification } from './types';

export default function App() {
  const { user, isAuthenticated, login, logout, register, resetPassword } = useAuth();
  const {
    medicines: contextMedicines,
    selectedLocation,
    setSelectedLocation,
    searchQuery,
    setSearchQuery,
    showToast
  } = useApp();

  // Local state for interactive features
  const [localMedicinesList, setLocalMedicinesList] = useState<Medicine[]>(() => {
    const stored = localStorage.getItem('medicycle_medicines');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse local medicines', e);
      }
    }
    return contextMedicines;
  });
  const [localOrdersList, setLocalOrdersList] = useState<Order[]>(() => {
    const stored = localStorage.getItem('medicycle_orders');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse local orders', e);
      }
    }
    return initialOrders;
  });
  const [activeTab, setActiveTab] = useState<'browse' | 'list' | 'hospitals' | 'orders' | 'impact'>('browse');

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const stored = localStorage.getItem('medicycle_notifications');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse local notifications', e);
      }
    }
    return [];
  });
  const [showNotifDropdown, setShowNotifDropdown] = useState<boolean>(false);

  // Browse filtering state
  const [filterType, setFilterType] = useState<'all' | 'exchange' | 'donate' | 'sell'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'safe' | 'expiring' | 'urgent'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Detail Modal & Transaction Modal state
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [transactionMedicine, setTransactionMedicine] = useState<Medicine | null>(null);
  const [transactionQty, setTransactionQty] = useState<number>(1);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi' | 'card'>('razorpay');

  // Login form state
  const [usernameInput, setUsernameInput] = useState<string>('MedUser');
  const [passwordInput, setPasswordInput] = useState<string>('123456');
  const [loginError, setLoginError] = useState<string>('');

  // Registration form state
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regMobile, setRegMobile] = useState<string>('');
  const [regAddress, setRegAddress] = useState<string>('');
  const [regLocation, setRegLocation] = useState<string>('MVP Colony');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');

  // Forgot password form state
  const [forgotUsernameOrEmail, setForgotUsernameOrEmail] = useState<string>('');
  const [forgotNewPassword, setForgotNewPassword] = useState<string>('');
  const [forgotConfirmNewPassword, setForgotConfirmNewPassword] = useState<string>('');
  const [forgotError, setForgotError] = useState<string>('');
  const [forgotSuccess, setForgotSuccess] = useState<string>('');

  // Listing Form state
  const [formName, setFormName] = useState<string>('');
  const [formManufacturer, setFormManufacturer] = useState<string>('');
  const [formExpiryDate, setFormExpiryDate] = useState<string>('');
  const [formQuantity, setFormQuantity] = useState<number>(10);
  const [formCondition, setFormCondition] = useState<'Sealed' | 'Opened' | 'Good' | 'Fair'>('Sealed');
  const [formLocation, setFormLocation] = useState<string>('MVP Colony');
  const [formType, setFormType] = useState<'exchange' | 'donate' | 'sell'>('exchange');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formCategory, setFormCategory] = useState<string>('Pain Relief');
  const [formDescription, setFormDescription] = useState<string>('');

  // Filter lists & categories
  const categories = ['All', ...Array.from(new Set(localMedicinesList.map((m) => m.category)))];

  // Set default location input when user logs in or sets location
  useEffect(() => {
    if (user?.location) {
      setFormLocation(user.location);
    }
  }, [user]);

  // Persist state to LocalStorage
  useEffect(() => {
    localStorage.setItem('medicycle_medicines', JSON.stringify(localMedicinesList));
  }, [localMedicinesList]);

  useEffect(() => {
    localStorage.setItem('medicycle_orders', JSON.stringify(localOrdersList));
  }, [localOrdersList]);

  useEffect(() => {
    localStorage.setItem('medicycle_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = login(usernameInput, passwordInput);
    if (success) {
      showToast(`Welcome back, ${usernameInput}!`, 'success');
      // Clean inputs
      setPasswordInput('');
    } else {
      setLoginError('Invalid username or password. Use MedUser / 123456');
      showToast('Login failed', 'error');
    }
  };

  // Handle Register submission
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (regPassword.length < 6) {
      setLoginError('Password must be at least 6 characters.');
      showToast('Password is too short', 'error');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setLoginError('Passwords do not match.');
      showToast('Passwords do not match', 'error');
      return;
    }

    const result = register({
      username: regUsername,
      name: regName,
      email: regEmail,
      mobile: regMobile,
      address: regAddress,
      location: regLocation,
      password: regPassword,
    });

    if (result.success) {
      showToast('Registration successful! Please sign in.', 'success');
      setAuthMode('login');
      setUsernameInput(regUsername);
      setPasswordInput(regPassword);
      // Clear inputs
      setRegName('');
      setRegEmail('');
      setRegMobile('');
      setRegAddress('');
      setRegLocation('MVP Colony');
      setRegUsername('');
      setRegPassword('');
      setRegConfirmPassword('');
    } else {
      setLoginError(result.message);
      showToast(result.message, 'error');
    }
  };

  // Handle Forgot Password submission
  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotUsernameOrEmail.trim()) {
      setForgotError('Please enter your username or email.');
      return;
    }

    if (forgotNewPassword.length < 6) {
      setForgotError('Password must be at least 6 characters.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmNewPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    const res = resetPassword(forgotUsernameOrEmail.trim(), forgotNewPassword);
    if (res.success) {
      setForgotSuccess('Password reset successfully! Redirecting to login...');
      showToast('Password reset successful', 'success');
      // Clear inputs
      setForgotUsernameOrEmail('');
      setForgotNewPassword('');
      setForgotConfirmNewPassword('');
      // Auto switch back to login after 3 seconds
      setTimeout(() => {
        setAuthMode('login');
        setForgotSuccess('');
      }, 3000);
    } else {
      setForgotError(res.message);
      showToast(res.message, 'error');
    }
  };

  // Restrict actions if not logged in
  const requireAuthAction = (action: () => void) => {
    if (!isAuthenticated) {
      showToast('Please sign in to continue', 'info');
    } else {
      action();
    }
  };

  // MedicineCard Action handler
  const handleMedicineAction = (medicine: Medicine, action: string) => {
    if (action === 'details') {
      setSelectedMedicine(medicine);
    } else {
      if (user && medicine.listedBy === user.name) {
        showToast("You cannot request/buy your own listing.", 'error');
        return;
      }
      // It's exchange / donate / sell
      requireAuthAction(() => {
        setTransactionMedicine(medicine);
        setTransactionQty(1);
        setDeliveryAddress(user?.address || '');
      });
    }
  };

  // Handle Razorpay specifically
  const handleRazorpayPayment = () => {
    if (!transactionMedicine) return;
    const razorpayKey = 'rzp_test_dummykey123456'; 
      
    if (razorpayKey.includes('dummy')) {
      showToast('Simulating Razorpay Payment (Demo Mode)...', 'info');
      setTimeout(() => {
        setShowPaymentModal(false);
        processFinalTransaction();
      }, 1500);
      return;
    }

    const options = {
      key: razorpayKey,
      amount: (transactionMedicine.price! * transactionQty * 100).toString(),
      currency: 'INR',
      name: 'MEDIALERT',
      description: `Payment for ${transactionQty}x ${transactionMedicine.name}`,
      handler: function () {
        setShowPaymentModal(false);
        processFinalTransaction();
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.mobile || '',
      },
      theme: {
        color: '#10B981',
      },
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', function () {
      showToast('Payment failed. Please try again.', 'error');
    });
    rzp.open();
  };

  // Process manual fake payment (UPI / Card)
  const handleManualPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPaymentModal(false);
    processFinalTransaction();
  };

  // Complete exchange/buy/donate order
  const handleConfirmTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionMedicine) return;

    if (transactionQty <= 0 || transactionQty > transactionMedicine.quantity) {
      showToast(`Please enter a quantity between 1 and ${transactionMedicine.quantity}`, 'error');
      return;
    }

    if (transactionMedicine.type === 'sell') {
      setShowPaymentModal(true);
    } else {
      processFinalTransaction();
    }
  };

  const processFinalTransaction = () => {
    if (!transactionMedicine) return;

    const priceAmount = transactionMedicine.type === 'sell' && transactionMedicine.price 
      ? transactionMedicine.price * transactionQty 
      : 0;

    const newOrder: Order = {
      id: generateTransactionId(),
      medicineId: transactionMedicine.id,
      medicineName: transactionMedicine.name,
      status: 'confirmed',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
      address: deliveryAddress || 'Visakhapatnam Local Pickup',
      amount: priceAmount,
      date: new Date().toISOString().split('T')[0],
      userId: user?.id || 'u1'
    };

    // Update medicines list (decrease quantity or remove if empty)
    const updatedMeds = localMedicinesList.map((m) => {
      if (m.id === transactionMedicine.id) {
        return { ...m, quantity: m.quantity - transactionQty };
      }
      return m;
    }).filter((m) => m.quantity > 0);

    setLocalMedicinesList(updatedMeds);
    setLocalOrdersList([newOrder, ...localOrdersList]);

    // Generate notification for the seller
    const newNotification: Notification = {
      id: 'notif_' + Date.now(),
      recipientName: transactionMedicine.listedBy,
      message: `${user?.name || 'A user'} requested ${transactionQty}x ${transactionMedicine.name} (${transactionMedicine.type === 'sell' ? 'Purchase' : transactionMedicine.type === 'donate' ? 'Donation' : 'Exchange'}).`,
      date: formatDate(new Date().toISOString().split('T')[0]),
      read: false,
      type: 'success'
    };
    setNotifications([newNotification, ...notifications]);

    setTransactionMedicine(null);
    showToast(transactionMedicine.type === 'sell' ? `Payment successful! Order placed for ${transactionQty}x ${transactionMedicine.name}` : `Order placed for ${transactionQty}x ${transactionMedicine.name}!`, 'success');
    setActiveTab('orders');
  };

  // List new medicine
  const handleListMedicineSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName || !formManufacturer || !formExpiryDate) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    const daysLeft = getDaysLeft(formExpiryDate);
    if (daysLeft <= 0) {
      showToast('Medicine must have a future expiry date', 'error');
      return;
    }

    const status = getExpiryStatus(daysLeft);

    const newMedicine: Medicine = {
      id: 'm_' + Date.now(),
      name: formName,
      manufacturer: formManufacturer,
      quantity: formQuantity,
      expiryDate: formExpiryDate,
      condition: formCondition,
      location: formLocation,
      type: formType,
      price: formType === 'sell' ? formPrice : undefined,
      category: formCategory,
      daysLeft: daysLeft,
      status: status,
      listedBy: user?.name || 'Anonymous',
      description: formDescription
    };

    setLocalMedicinesList([newMedicine, ...localMedicinesList]);
    showToast(`${formName} listed successfully!`, 'success');

    // Reset Form
    setFormName('');
    setFormManufacturer('');
    setFormExpiryDate('');
    setFormQuantity(10);
    setFormCondition('Sealed');
    setFormPrice(0);
    setFormDescription('');

    // Switch to browse
    setActiveTab('browse');
  };

  // Filtered medicines logic
  const filteredMedicines = localMedicinesList.filter((m) => {
    // 1. Location match (MVP Colony is the default / user-selected)
    const matchesLocation = m.location === selectedLocation;
    
    // 2. Search query match
    const matchesSearch = searchQuery
      ? m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    // 3. Type match
    const matchesType = filterType === 'all' ? true : m.type === filterType;

    // 4. Status match
    const matchesStatus = filterStatus === 'all' ? true : m.status === filterStatus;

    // 5. Category match
    const matchesCategory = selectedCategory === 'All' ? true : m.category === selectedCategory;

    return matchesLocation && matchesSearch && matchesType && matchesStatus && matchesCategory;
  });

  // Notifications logic
  const userNotifications = user ? notifications.filter(n => n.recipientName === user.name) : [];
  const unreadCount = userNotifications.filter(n => !n.read).length;

  // Filter transactions to only show the logged-in user's transaction history
  const userOrders = isAuthenticated ? localOrdersList.filter(ord => ord.userId === user?.id) : [];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 font-inter bg-slate-950 text-slate-100 overflow-x-hidden">
        {/* Left Side: Brand Promo (hidden on mobile) */}
        <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 border-r border-slate-800">
          {/* Radial glow background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_50%)]" />
          
          <div className="relative z-10 flex-shrink-0">
            <Logo size="lg" variant="light" />
          </div>

          <div className="relative z-10 my-auto space-y-6 max-w-md text-left">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 text-xs font-semibold text-emerald-400 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              Vizag's Safe Medicine Sharing Portal
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-white font-poppins">
              Save Costs. <br />
              Prevent Bio-Waste. <br />
              Support Your Community.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              MEDIALERT connects households in Visakhapatnam to share near-expiry sealed medicines. Join our voluntary peer network to exchange formulations safely.
            </p>

            {/* Micro Stats */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-800">
              <div>
                <p className="text-2xl font-bold text-white">4.8 Tons</p>
                <p className="text-xs text-slate-400">Waste Prevented</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">2.4k+</p>
                <p className="text-xs text-slate-400">Medicines Shared</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex-shrink-0 text-slate-500 text-xs font-medium text-left">
            © 2026 MEDIALERT Visakhapatnam. All rights reserved.
          </div>
        </div>

        {/* Right Side: Auth Forms Card */}
        <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12 relative min-h-screen w-full bg-slate-950">
          {/* Mobile-only header logo */}
          <div className="lg:hidden mb-8 self-start">
            <Logo size="md" variant="light" />
          </div>

          <div className="w-full max-w-md bg-slate-900/40 border border-slate-800 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
            {/* Soft decorative light */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Tabs / Heading */}
            <div className="mb-6 text-left">
              <h2 className="font-poppins font-bold text-2xl text-white">
                {authMode === 'login' && "Welcome Back"}
                {authMode === 'register' && "Join the Network"}
                {authMode === 'forgot_password' && "Reset Password"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {authMode === 'login' && "Sign in to access Vizag's medicine exchange portal"}
                {authMode === 'register' && "Create an account to start listing and requesting"}
                {authMode === 'forgot_password' && "Provide details to restore your password credentials"}
              </p>
            </div>

            {/* Error alerts */}
            {authMode === 'login' && loginError && (
              <div className="bg-red-950/40 border border-red-900/60 text-red-300 text-xs p-3.5 rounded-2xl flex items-center gap-2 mb-4 animate-slide-in text-left">
                <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {authMode === 'register' && loginError && (
              <div className="bg-red-950/40 border border-red-900/60 text-red-300 text-xs p-3.5 rounded-2xl flex items-center gap-2 mb-4 animate-slide-in text-left">
                <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {authMode === 'forgot_password' && forgotError && (
              <div className="bg-red-950/40 border border-red-900/60 text-red-300 text-xs p-3.5 rounded-2xl flex items-center gap-2 mb-4 animate-slide-in text-left">
                <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {authMode === 'forgot_password' && forgotSuccess && (
              <div className="bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs p-3.5 rounded-2xl flex items-center gap-2 mb-4 animate-slide-in text-left">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* MODES */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-350">Username</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Enter username"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-150 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-350">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot_password');
                        setLoginError('');
                        setForgotError('');
                        setForgotSuccess('');
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-350 font-semibold bg-transparent border-0 cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-150 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* Pre-fill credentials helper */}
                <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl text-[11px] text-slate-400 space-y-1 leading-relaxed">
                  <p className="font-bold text-slate-300">💡 Demo Credentials:</p>
                  <p>Username: <code className="bg-slate-950 border border-slate-800 px-1 py-0.5 rounded font-bold text-emerald-400">MedUser</code></p>
                  <p>Password: <code className="bg-slate-950 border border-slate-800 px-1 py-0.5 rounded font-bold text-emerald-400">123456</code></p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md shadow-emerald-500/10"
                >
                  Sign In
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setLoginError('');
                    }}
                    className="text-xs text-emerald-450 hover:text-emerald-400 font-bold transition-all bg-transparent border-0 cursor-pointer"
                  >
                    Don't have an account? Register here
                  </button>
                </div>
              </form>
            )}

            {authMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-350">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Ravi Kumar"
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-150 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-350">Username *</label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="Choose username"
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-150 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-350">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-150 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-350">Mobile Number *</label>
                    <input
                      type="text"
                      required
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-150 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-350">Locality in Vizag *</label>
                  <select
                    value={regLocation}
                    onChange={(e) => setRegLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-150 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {vizagLocations.map((loc) => (
                      <option key={loc} value={loc} className="bg-slate-900 text-slate-100">
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-350">Detailed Address *</label>
                  <textarea
                    required
                    rows={2}
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="e.g. House No, Building, Street..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-150 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-350">Password *</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-150 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-350">Confirm Password *</label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-150 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md shadow-emerald-500/10 mt-2"
                >
                  Register & Sign Up
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setLoginError('');
                    }}
                    className="text-xs text-emerald-450 hover:text-emerald-400 font-bold transition-all bg-transparent border-0 cursor-pointer"
                  >
                    Already have an account? Sign In
                  </button>
                </div>
              </form>
            )}

            {authMode === 'forgot_password' && (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-left">
                <div className="space-y-1 bg-slate-900/50 border border-slate-800/40 p-3 rounded-2xl text-[11px] text-slate-400 leading-normal mb-2">
                  <p className="text-slate-300 font-bold mb-0.5">ℹ️ Resetting Account Password</p>
                  Input your registered username or email to verify, then specify your new password. This works for both newly registered accounts and the default demo account (<code className="text-emerald-400">MedUser</code>).
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-350">Username or Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={forgotUsernameOrEmail}
                      onChange={(e) => setForgotUsernameOrEmail(e.target.value)}
                      placeholder="Enter username or email"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-150 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-350">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-150 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-350">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={forgotConfirmNewPassword}
                      onChange={(e) => setForgotConfirmNewPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-150 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md shadow-emerald-500/10"
                >
                  Reset Password
                </button>

                <div className="text-center pt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setForgotError('');
                      setForgotSuccess('');
                    }}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-all font-semibold bg-transparent border-0 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col font-inter">
      {/* Toast Handler */}
      <Toast />

      {/* Floating Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Logo */}
            <div className="flex-shrink-0 cursor-pointer" onClick={() => setActiveTab('browse')}>
              <Logo size="md" variant="dark" />
            </div>

            {/* Main Tabs Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'browse'
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Activity className="w-4.5 h-4.5" />
                Browse Exchange
              </button>
              <button
                onClick={() => requireAuthAction(() => setActiveTab('list'))}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'list'
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Plus className="w-4.5 h-4.5" />
                List Medicine
              </button>
              <button
                onClick={() => setActiveTab('hospitals')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'hospitals'
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Building className="w-4.5 h-4.5" />
                Vizag Hospitals
              </button>
              <button
                onClick={() => requireAuthAction(() => setActiveTab('orders'))}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'orders'
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <History className="w-4.5 h-4.5" />
                My Transactions
              </button>
              <button
                onClick={() => setActiveTab('impact')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'impact'
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <HeartHandshake className="w-4.5 h-4.5" />
                Community Impact
              </button>
            </nav>

            {/* Search, Location, and Auth Actions */}
            <div className="flex items-center gap-3 flex-1 lg:flex-initial justify-end">
              {/* Search Bar (Only shown in Browse mode) */}
              {activeTab === 'browse' && (
                <div className="relative max-w-xs w-full hidden sm:block">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search medicines..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                    aria-label="Search near-expiry medicines"
                  />
                </div>
              )}

              {/* Location Picker */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <select
                  value={selectedLocation}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    showToast(`Switched view to ${e.target.value}`, 'info');
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1"
                  aria-label="Select Visakhapatnam locality"
                >
                  {vizagLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notification Bell */}
              {isAuthenticated && user && (
                <div className="relative">
                  <button
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    className="p-2 text-slate-500 hover:text-emerald-600 transition-colors rounded-xl hover:bg-slate-100 relative"
                    title="Notifications"
                    aria-label="View notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown menu */}
                  {showNotifDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-4 animate-scale-up">
                      <div className="flex items-center justify-between border-b border-slate-50 pb-2 mb-3">
                        <span className="font-bold text-slate-800 text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => {
                              const updated = notifications.map(n => 
                                n.recipientName === user.name ? { ...n, read: true } : n
                              );
                              setNotifications(updated);
                            }}
                            className="text-[11px] text-emerald-600 font-bold hover:text-emerald-700"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {userNotifications.length > 0 ? (
                          userNotifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                const updated = notifications.map(notif => 
                                  notif.id === n.id ? { ...notif, read: true } : notif
                                );
                                setNotifications(updated);
                              }}
                              className={`p-2.5 rounded-xl border text-xs cursor-pointer text-left transition-all ${
                                n.read 
                                  ? 'bg-slate-50/50 border-slate-100 text-slate-500' 
                                  : 'bg-emerald-50/20 border-emerald-100 text-slate-800 font-medium'
                              }`}
                            >
                              <p className="leading-normal">{n.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{n.date}</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-slate-400 text-xs">
                            No notifications yet
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Profile / Login */}
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-500 leading-none">{user.location}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      showToast('Logged out successfully', 'info');
                      setActiveTab('browse');
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-slate-50"
                    title="Logout"
                    aria-label="Log out"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {}}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-emerald-500/10"
                  aria-label="Sign In"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Tab Selector (Visible on small screens) */}
      <div className="lg:hidden sticky top-16 z-30 bg-white border-b border-slate-100 flex overflow-x-auto scrollbar-none py-2 px-4 gap-2">
        <button
          onClick={() => setActiveTab('browse')}
          className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'browse' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600'
          }`}
        >
          Browse
        </button>
        <button
          onClick={() => requireAuthAction(() => setActiveTab('list'))}
          className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'list' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600'
          }`}
        >
          List Medicine
        </button>
        <button
          onClick={() => setActiveTab('hospitals')}
          className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'hospitals' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600'
          }`}
        >
          Hospitals
        </button>
        <button
          onClick={() => requireAuthAction(() => setActiveTab('orders'))}
          className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'orders' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600'
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveTab('impact')}
          className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'impact' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600'
          }`}
        >
          Impact
        </button>
      </div>

      {/* Main Content Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB 1: BROWSE MEDICINES */}
        {activeTab === 'browse' && (
          <div className="space-y-8 animate-slide-in">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">
              {/* Background patterns */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 to-blue-700/80 z-10" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-400 via-transparent to-transparent opacity-40 z-0" />
              
              <div className="relative z-20 px-6 py-10 sm:p-12 md:max-w-2xl text-left space-y-4">
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-xs font-semibold text-emerald-100">
                  <Sparkles className="w-3.5 h-3.5" />
                  Visakhapatnam Medical Sharing Network
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold font-poppins tracking-tight leading-tight">
                  Exchange Near-Expiry Medicines Safely
                </h1>
                <p className="text-slate-100 text-sm sm:text-base leading-relaxed">
                  Join Vizag's local community web-portal to exchange excess sealed medicines, request free donations for urgent needs, or sell near-expiry formulations at steep discounts.
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold text-emerald-100">
                  <div className="flex items-center gap-1.5 bg-black/15 px-3 py-1.5 rounded-xl">
                    <span className="text-white text-base font-extrabold">{localMedicinesList.length}</span> Listed Items
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/15 px-3 py-1.5 rounded-xl">
                    <span className="text-white text-base font-extrabold">12</span> Vizag Localities
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/15 px-3 py-1.5 rounded-xl">
                    <span className="text-white text-base font-extrabold">2.4k+</span> Completed Exchanges
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              {/* Top row: search + title */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="font-poppins font-bold text-slate-800 text-lg">Browse Medicines in {selectedLocation}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Showing verified community listings nearby</p>
                </div>

                {/* Mobile Search input */}
                <div className="relative sm:hidden w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search medicines..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                    aria-label="Search near-expiry medicines mobile"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2.5">
                  <button
                    onClick={() => requireAuthAction(() => setActiveTab('list'))}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    List Medicine
                  </button>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Filtering Controls */}
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                {/* Left controls: types & status filters */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Type buttons */}
                  <div className="bg-slate-100 p-0.5 rounded-xl flex gap-0.5">
                    {(['all', 'exchange', 'donate', 'sell'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                          filterType === type
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-600 hover:text-slate-800'
                        }`}
                      >
                        {type === 'donate' ? 'Donation' : type}
                      </button>
                    ))}
                  </div>

                  {/* Status buttons */}
                  <div className="bg-slate-100 p-0.5 rounded-xl flex gap-0.5">
                    {(['all', 'safe', 'expiring', 'urgent'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                          filterStatus === status
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-600 hover:text-slate-800'
                        }`}
                      >
                        {status === 'all' ? 'All Alerts' : status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right controls: Category drop menu */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600">Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 focus:outline-none cursor-pointer"
                    aria-label="Filter by category"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Medicines Grid */}
            {filteredMedicines.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMedicines.map((medicine) => (
                  <MedicineCard
                    key={medicine.id}
                    medicine={medicine}
                    onAction={handleMedicineAction}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-poppins font-bold text-slate-800 text-base">No matching medicines found</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    There are no listings matching your criteria in <b>{selectedLocation}</b> right now. Try switching the location or removing search filters.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFilterType('all');
                    setFilterStatus('all');
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-5 py-2.5 rounded-xl transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LIST MEDICINE */}
        {activeTab === 'list' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-slide-in">
            <div className="text-left">
              <h2 className="font-poppins font-bold text-slate-900 text-2xl">List a Medicine for Exchange/Donation</h2>
              <p className="text-sm text-slate-500 mt-1">Provide information about your medicine to help your neighbors in Vizag.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Instructions Sidebar */}
              <div className="bg-emerald-900 text-white rounded-3xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-emerald-300" />
                  </div>
                  <h3 className="font-poppins font-bold text-base leading-tight">Safe Listing Guidelines</h3>
                  <ul className="space-y-3.5 text-xs text-emerald-100 list-disc list-inside">
                    <li>Only list medicines with a valid future expiry date.</li>
                    <li>Verify that the medicine blister packaging or container seal is intact.</li>
                    <li>Explicitly specify whether the package has been opened.</li>
                    <li>Upload accurate details about the dosage and chemical configuration.</li>
                    <li>Always recommend that receivers crosscheck with a registered medical practitioner.</li>
                  </ul>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 text-[11px] text-emerald-200 border border-white/5">
                  <b>Safety First:</b> Exchange and donation are strictly peer-managed. Consult a doctor before administration.
                </div>
              </div>

              {/* Form Card */}
              <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
                <form onSubmit={handleListMedicineSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Medicine Name */}
                    <div className="space-y-1 text-left">
                      <label className="text-xs font-bold text-slate-700">Medicine Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Paracetamol 650mg"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    {/* Manufacturer */}
                    <div className="space-y-1 text-left">
                      <label className="text-xs font-bold text-slate-700">Manufacturer <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formManufacturer}
                        onChange={(e) => setFormManufacturer(e.target.value)}
                        placeholder="e.g. Cipla, Sun Pharma"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Expiry Date */}
                    <div className="space-y-1 text-left">
                      <label className="text-xs font-bold text-slate-700">Expiry Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        required
                        value={formExpiryDate}
                        onChange={(e) => setFormExpiryDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1 text-left">
                      <label className="text-xs font-bold text-slate-700">Quantity (Units) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formQuantity}
                        onChange={(e) => setFormQuantity(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1 text-left">
                      <label className="text-xs font-bold text-slate-700">Category</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        <option value="Pain Relief">Pain Relief</option>
                        <option value="Antibiotic">Antibiotic</option>
                        <option value="Diabetes">Diabetes</option>
                        <option value="Gastric">Gastric</option>
                        <option value="Vitamins">Vitamins</option>
                        <option value="Antihistamine">Antihistamine</option>
                        <option value="Oral Rehydration">Oral Rehydration</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Condition */}
                    <div className="space-y-1 text-left">
                      <label className="text-xs font-bold text-slate-700">Condition</label>
                      <select
                        value={formCondition}
                        onChange={(e) => setFormCondition(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                      >
                        <option value="Sealed">Sealed Box / Blister</option>
                        <option value="Opened">Opened Box (Sealed Tablets)</option>
                        <option value="Good">Good Condition</option>
                        <option value="Fair">Fair Condition</option>
                      </select>
                    </div>

                    {/* Listing Type */}
                    <div className="space-y-1 text-left">
                      <label className="text-xs font-bold text-slate-700">Listing Type</label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                      >
                        <option value="exchange">Exchange</option>
                        <option value="donate">Donation / Free</option>
                        <option value="sell">Sell (Near Expiry Discount)</option>
                      </select>
                    </div>

                    {/* Location */}
                    <div className="space-y-1 text-left">
                      <label className="text-xs font-bold text-slate-700">Location Locality</label>
                      <select
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                      >
                        {vizagLocations.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Price if Sell */}
                  {formType === 'sell' && (
                    <div className="space-y-1 text-left animate-slide-in">
                      <label className="text-xs font-bold text-slate-700">Price (INR) <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">₹</span>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formPrice}
                          onChange={(e) => setFormPrice(parseInt(e.target.value) || 0)}
                          className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-slate-700">Description / Exchange Requirements</label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      rows={3}
                      placeholder="e.g. Blister pack has 8 out of 10 tablets remaining. Kept in refrigerator. Looking to exchange for ORS packets."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-emerald-500/10"
                    >
                      Publish Listing
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VIZAG HOSPITALS */}
        {activeTab === 'hospitals' && (
          <div className="space-y-8 animate-slide-in">
            <div className="text-left">
              <h2 className="font-poppins font-bold text-slate-900 text-2xl">Vizag Hospitals & Healthcare Centres</h2>
              <p className="text-sm text-slate-500 mt-1">Directory of emergency hospitals in Visakhapatnam for donation drop-off or medical query verification.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hospitals.map((hosp) => (
                <div key={hosp.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="font-poppins font-bold text-slate-800 text-base leading-tight">{hosp.name}</h3>
                        <p className="text-xs text-emerald-600 font-semibold mt-0.5">{hosp.type}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        hosp.emergency 
                          ? 'bg-red-50 text-red-700 ring-1 ring-red-200' 
                          : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'
                      }`}>
                        {hosp.emergency ? '🚨 24/7 ER' : 'Standard'}
                      </span>
                    </div>

                    {/* Ratings and Beds */}
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-600 mb-4 bg-slate-50/50 p-2 rounded-xl">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500 text-base">★</span> {hosp.rating} Rating
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-slate-400" /> {hosp.beds} Beds
                      </div>
                    </div>

                    {/* Location & Address */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-start gap-2 text-xs text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span>{hosp.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{hosp.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`tel:${hosp.phone.replace(/[\s\+]/g, '')}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call Hospital
                    </a>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hosp.name + ', ' + hosp.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm"
                    >
                      Get Directions
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Emergency SOS Banner */}
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4 text-left">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-6 h-6 text-red-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-poppins font-bold text-red-900 text-lg">Medical Emergency?</h3>
                  <p className="text-sm text-red-700 max-w-xl">
                    MEDIALERT is strictly a medicine sharing network. For medical urgencies, contact Vizag Local EMS or visit the nearest 24/7 Emergency Room immediately.
                  </p>
                </div>
              </div>
              <a
                href="tel:108"
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-6 py-3.5 rounded-xl transition-all shadow-md shadow-red-600/10"
              >
                🚨 Dial 108 (EMS Vizag)
              </a>
            </div>
          </div>
        )}

        {/* TAB 4: MY ORDERS & TRANSACTIONS */}
        {activeTab === 'orders' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-slide-in">
            <div className="text-left">
              <h2 className="font-poppins font-bold text-slate-900 text-2xl">My Transactions & Orders</h2>
              <p className="text-sm text-slate-500 mt-1">Track the status of requested, exchanged, or purchased medicines.</p>
            </div>

            {userOrders.length > 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                        <th className="px-6 py-4">Transaction ID</th>
                        <th className="px-6 py-4">Medicine</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Address</th>
                        <th className="px-6 py-4">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {userOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-950">{ord.id}</td>
                          <td className="px-6 py-4 font-semibold text-slate-800">{ord.medicineName}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              ord.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' :
                              ord.status === 'dispatched' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' :
                              ord.status === 'verified' ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-200' :
                              'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                            }`}>
                              {ord.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium">{formatDate(ord.date)}</td>
                          <td className="px-6 py-4 font-medium max-w-xs truncate" title={ord.address}>{ord.address}</td>
                          <td className="px-6 py-4 font-bold text-slate-950">
                            {ord.amount > 0 ? `₹${ord.amount}` : 'Free / Exchange'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center max-w-md mx-auto shadow-sm space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                  <History className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-poppins font-bold text-slate-800 text-base">No transactions yet</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    You haven't requested or exchanged any medicines yet. Browse listings to request one.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all"
                >
                  Browse Medicines
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: COMMUNITY IMPACT */}
        {activeTab === 'impact' && (
          <div className="max-w-4xl mx-auto space-y-10 animate-slide-in">
            {/* Header info */}
            <div className="text-left">
              <h2 className="font-poppins font-bold text-slate-900 text-2xl">Community Impact in Visakhapatnam</h2>
              <p className="text-sm text-slate-500 mt-1">Measuring the ecological and financial savings from our local exchange network.</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 text-left space-y-2">
                <span className="text-3xl">🌱</span>
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Bio-Waste Prevented</h3>
                <p className="text-2xl font-bold font-poppins text-slate-900">4.8 Tons</p>
                <p className="text-xs text-slate-400">Chemical waste kept away from local aquifers.</p>
              </div>
              <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 text-left space-y-2">
                <span className="text-3xl">🤝</span>
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider font-inter">Medicines Shared</h3>
                <p className="text-2xl font-bold font-poppins text-slate-900">2,410 Units</p>
                <p className="text-xs text-slate-400">Medicines directly handed over to those in need.</p>
              </div>
              <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 text-left space-y-2">
                <span className="text-3xl">💰</span>
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Financial Savings</h3>
                <p className="text-2xl font-bold font-poppins text-slate-900">₹3.6 Lakhs</p>
                <p className="text-xs text-slate-400">Money saved by the households exchanging medicines.</p>
              </div>
            </div>

            {/* Detailed guide layout */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 sm:p-8 space-y-6 text-left">
              <h3 className="font-poppins font-bold text-slate-800 text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-600" />
                Guidelines for Disposal & Expiry
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-600">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800">Why Exchange?</h4>
                  <p className="leading-relaxed">
                    Millions of rupees worth of medicines are thrown into the bin every year in Visakhapatnam. These compounds dissolve into landfill soils, infiltrating groundwater networks and poisoning marine biology off our coast.
                  </p>
                  <p className="leading-relaxed">
                    Sharing un-opened, dry formulations with at least 30 days left allows low-income families to access prescription items safely, reducing waste and financial burdens.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800">What is NOT listable?</h4>
                  <ul className="space-y-2.5 list-disc list-inside text-xs">
                    <li>Medicines requiring continuous refrigerator storage (like insulin) unless verified.</li>
                    <li>Syrups or liquid mixtures that have had their primary caps unscrewed.</li>
                    <li>Controlled substances under Schedule X or Schedule H (narcotics, high-grade sedatives).</li>
                    <li>Medicines with completely illegible manufacturer or expiry printings.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-8 text-center text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex justify-center">
            <Logo size="sm" variant="light" />
          </div>
          <p>
            MediCycle Connect Vizag is a peer-to-peer voluntary portal. The network does not trade, buy, or prescribe drugs directly.
          </p>
          <p>© 2026 MediCycle Connect Visakhapatnam. Keeping our hills green and healthcare accessible.</p>
        </div>
      </footer>

      {/* MODAL 1: MEDICINE DETAILS */}
      {selectedMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-scale-up text-left">
            {/* Colored top band */}
            <div className={`h-2 w-full ${
              selectedMedicine.status === 'safe' ? 'bg-emerald-500' : 
              selectedMedicine.status === 'expiring' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />

            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-poppins font-bold text-slate-900 text-lg leading-tight">{selectedMedicine.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">Manufactured by {selectedMedicine.manufacturer}</p>
                </div>
                <button
                  onClick={() => setSelectedMedicine(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all"
                  aria-label="Close details dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status and Category badges */}
              <div className="flex flex-wrap gap-2">
                <Badge
                  label={selectedMedicine.status === 'safe' ? '🟢 Safe' : selectedMedicine.status === 'expiring' ? '🟡 Expiring Soon' : '🔴 Urgent Expiry'}
                  variant={selectedMedicine.status}
                />
                <Badge label={selectedMedicine.type.toUpperCase()} variant={selectedMedicine.type} />
                <Badge label={selectedMedicine.category} />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl text-xs text-slate-600">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-400">Available Quantity</span>
                  <p className="font-bold text-slate-800 text-sm">{selectedMedicine.quantity} units</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-slate-400">Storage Condition</span>
                  <p className="font-bold text-slate-800 text-sm">{selectedMedicine.condition}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-slate-400">Expires On</span>
                  <p className="font-bold text-slate-800 text-sm">{formatDate(selectedMedicine.expiryDate)}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-slate-400">Remaining Period</span>
                  <p className="font-bold text-slate-850 text-sm">{selectedMedicine.daysLeft} days left</p>
                </div>
              </div>

              {/* Description */}
              {selectedMedicine.description && (
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-slate-600">Notes from Lister:</span>
                  <p className="text-slate-500 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    {selectedMedicine.description}
                  </p>
                </div>
              )}

              {/* Lister Profile */}
              <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                  {selectedMedicine.listedBy[0]}
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-800">Listed by {selectedMedicine.listedBy}</p>
                  <p className="text-slate-400">Location: {selectedMedicine.location}</p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedMedicine(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl transition-all"
                >
                  Close
                </button>
                {user && selectedMedicine.listedBy === user.name ? (
                  <button
                    disabled
                    className="flex-1 bg-slate-100 text-slate-400 text-xs font-bold py-3 rounded-xl cursor-not-allowed border border-slate-200 text-center"
                  >
                    Your Listing
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const med = selectedMedicine;
                      setSelectedMedicine(null);
                      handleMedicineAction(med, med.type);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md shadow-emerald-500/10"
                  >
                    {selectedMedicine.type === 'sell' ? 'Buy Now' : selectedMedicine.type === 'donate' ? 'Request Item' : 'Exchange Item'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PAYMENT OPTIONS */}
      {showPaymentModal && transactionMedicine && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scale-up text-left">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-poppins font-bold text-base">Select Payment Method</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Amount to pay: ₹{transactionMedicine.price! * transactionQty}</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-white hover:text-slate-300 p-1 rounded-lg transition-colors"
                aria-label="Close payment modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${paymentMethod === 'razorpay' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
                >
                  Razorpay
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${paymentMethod === 'upi' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
                >
                  <QrCode className="w-3.5 h-3.5" /> UPI
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${paymentMethod === 'card' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Card
                </button>
              </div>

              {paymentMethod === 'razorpay' && (
                <div className="text-center py-4 space-y-4">
                  <div className="text-sm text-slate-600 font-medium">Pay securely with Razorpay checkout</div>
                  <button
                    onClick={handleRazorpayPayment}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md"
                  >
                    Pay with Razorpay
                  </button>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <form onSubmit={handleManualPayment} className="text-center py-2 space-y-4 animate-fade-in">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 inline-block">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=dummy@upi&pn=MEDIALERT&am=${transactionMedicine.price! * transactionQty}`}
                      alt="UPI QR Code"
                      className="w-32 h-32 mx-auto mix-blend-multiply"
                    />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Scan this QR code with any UPI app</p>
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md"
                  >
                    I have paid ₹{transactionMedicine.price! * transactionQty}
                  </button>
                </form>
              )}

              {paymentMethod === 'card' && (
                <form onSubmit={handleManualPayment} className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Card Number</label>
                    <input
                      type="text"
                      required
                      placeholder="1111 2222 3333 4444"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        required
                        placeholder="12/28"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">CVV</label>
                      <input
                        type="password"
                        required
                        placeholder="123"
                        maxLength={3}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Name on Card</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md mt-2"
                  >
                    Pay ₹{transactionMedicine.price! * transactionQty} Securely
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TRANSACTION FLOW (REQUEST / EXCHANGE / BUY) */}
      {transactionMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scale-up text-left">
            <div className="gradient-header p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-poppins font-bold text-base">
                  {transactionMedicine.type === 'sell' ? 'Purchase Medicine' : 
                   transactionMedicine.type === 'donate' ? 'Request Free Donation' : 'Initiate Medicine Exchange'}
                </h3>
                <p className="text-[11px] text-emerald-100 mt-0.5">{transactionMedicine.name}</p>
              </div>
              <button
                onClick={() => setTransactionMedicine(null)}
                className="text-white hover:text-emerald-100 p-1 rounded-lg transition-colors"
                aria-label="Close request modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmTransaction} className="p-6 space-y-5">
              {/* Product Info Summary */}
              <div className="bg-slate-50 p-3.5 rounded-2xl flex items-center justify-between text-xs text-slate-600">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800">{transactionMedicine.name}</span>
                  <p className="text-[10px] text-slate-400">{transactionMedicine.manufacturer} · {transactionMedicine.location}</p>
                </div>
                {transactionMedicine.type === 'sell' && transactionMedicine.price && (
                  <span className="font-bold text-emerald-600 text-sm">₹{transactionMedicine.price} / unit</span>
                )}
              </div>

              {/* Quantity Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex justify-between">
                  <span>Quantity Needed</span>
                  <span className="text-slate-400 font-normal">Available: {transactionMedicine.quantity} units</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={transactionMedicine.quantity}
                  value={transactionQty}
                  onChange={(e) => setTransactionQty(Math.min(transactionMedicine.quantity, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Delivery Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Delivery Address / Pickup Location</label>
                <textarea
                  required
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter full address for dispatch or pickup coordination."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Cost Summary (if applicable) */}
              {transactionMedicine.type === 'sell' && transactionMedicine.price && (
                <div className="flex justify-between items-center border-t border-slate-100 pt-4 text-slate-700 font-semibold text-xs">
                  <span>Subtotal Cost</span>
                  <span className="font-bold text-slate-900 text-base">₹{transactionMedicine.price * transactionQty}</span>
                </div>
              )}

              {/* Form Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTransactionMedicine(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md shadow-emerald-500/10"
                >
                  {transactionMedicine.type === 'sell' ? 'Proceed to Pay' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
