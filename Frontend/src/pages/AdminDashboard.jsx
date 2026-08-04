import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDiscounts from '../components/AdminDiscounts';
import {
  Package,
  ShoppingCart,
  Users,
  CurrencyNgn,
  TrendUp,
  Envelope,
  SignOut,
  Tag,
  CircleNotch,
  WarningCircle,
  SquaresFour
} from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'react-toastify';
import InventoryManager from '../components/InventoryManager';
import BundleCreator from '../components/BundleCreator';
import AdminUploader from '../components/AdminUploader';
import Orders from '../components/Orders';
import Customers from '../components/Customers';
import AdminNewsletterDashboard from '../components/AdminNewsletterDashboard';
import { useAdminAuth } from '../context/AdminAuthContext';
import SEO from '../components/SEO';
import { AdminDashboardSkeleton } from '../components/skeletons';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}`.replace(/\/api$/, '')
  : 'https://prechi-ecommerce.onrender.com';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
    revenueGrowth: 0,
    customerGrowth: 0,
    orderGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { admin, adminLoading, adminLogout } = useAdminAuth();

  const getAuthAxios = () => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      throw new Error('Admin not authenticated');
    }
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });
  };

  useEffect(() => {
    if (adminLoading) return;
    if (!admin || !admin.isAdmin) {
      setError('Admin access only');
      setLoading(false);
      toast.error('Admin access only');
      setTimeout(() => navigate('/admin/login'), 2000);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const authAxios = getAuthAxios();
        const response = await authAxios.get('/api/admin/analytics');
        setAnalytics(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          setError('Authentication expired. Please log in again.');
          adminLogout();
          setTimeout(() => navigate('/admin/login'), 2000);
        } else {
          setError('Failed to load analytics data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [admin, adminLoading, adminLogout, navigate]);

  const handleLogout = () => {
    adminLogout();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: SquaresFour },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'discounts', label: 'Discounts', icon: Tag },
    { id: 'newsletter', label: 'Newsletter', icon: Envelope },
  ];

  const renderDashboard = () => (
    <div className="space-y-8 font-display">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-sm flex items-center gap-2 text-rose-800 text-xs">
          <WarningCircle size={16} className="text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <AdminDashboardSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="bg-Secondarycolor border border-border p-5 rounded-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between text-xs text-text-tertiary uppercase tracking-[0.08em] font-medium">
              <span>Total Revenue</span>
              <CurrencyNgn size={18} className="text-Primarycolor" />
            </div>
            <div>
              <p className="text-2xl font-semibold font-display text-Primarycolor tabular-nums">
                {formatCurrency(analytics.totalRevenue)}
              </p>
              <p className="text-[0.7rem] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                <TrendUp size={12} />
                +{analytics.revenueGrowth}% month-over-month
              </p>
            </div>
          </div>

          {/* Orders */}
          <div className="bg-Secondarycolor border border-border p-5 rounded-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between text-xs text-text-tertiary uppercase tracking-[0.08em] font-medium">
              <span>Total Orders</span>
              <ShoppingCart size={18} className="text-Primarycolor" />
            </div>
            <div>
              <p className="text-2xl font-semibold font-display text-Primarycolor tabular-nums">
                {analytics.totalOrders}
              </p>
              <p className="text-[0.7rem] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                <TrendUp size={12} />
                +{analytics.orderGrowth}% month-over-month
              </p>
            </div>
          </div>

          {/* Customers */}
          <div className="bg-Secondarycolor border border-border p-5 rounded-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between text-xs text-text-tertiary uppercase tracking-[0.08em] font-medium">
              <span>Total Customers</span>
              <Users size={18} className="text-Primarycolor" />
            </div>
            <div>
              <p className="text-2xl font-semibold font-display text-Primarycolor tabular-nums">
                {analytics.totalCustomers}
              </p>
              <p className="text-[0.7rem] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                <TrendUp size={12} />
                +{analytics.customerGrowth}% month-over-month
              </p>
            </div>
          </div>

          {/* Avg Order */}
          <div className="bg-Secondarycolor border border-border p-5 rounded-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between text-xs text-text-tertiary uppercase tracking-[0.08em] font-medium">
              <span>Average Order Value</span>
              <CurrencyNgn size={18} className="text-Primarycolor" />
            </div>
            <div>
              <p className="text-2xl font-semibold font-display text-Primarycolor tabular-nums">
                {formatCurrency(analytics.avgOrderValue)}
              </p>
              <p className="text-[0.7rem] text-text-tertiary mt-1">Average cart valuation</p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Action Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <AdminUploader />
        <BundleCreator />
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col font-display">
      <SEO title="Admin Console | Prechi" description="Prechi management system" />

      {/* Linear-style Header */}
      <header className="bg-Secondarycolor border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-Primarycolor text-white rounded-sm flex items-center justify-center font-bold text-xs uppercase">
              P
            </div>
            <span className="text-xs uppercase tracking-[0.12em] font-semibold text-Primarycolor">
              Prechi Console
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-text-secondary hover:text-Primarycolor transition-colors uppercase tracking-[0.08em] font-medium"
          >
            <SignOut size={16} />
            <span>Logout</span>
          </button>
        </div>

        {/* Tab Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto border-t border-border/40 scrollbar-none">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-medium uppercase tracking-[0.08em] transition-all border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-Primarycolor text-Primarycolor font-semibold'
                    : 'border-transparent text-text-tertiary hover:text-Primarycolor'
                }`}
              >
                <Icon size={16} weight={isActive ? "fill" : "regular"} />
                {label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'orders' && <Orders />}
        {activeTab === 'customers' && <Customers />}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'discounts' && <AdminDiscounts />}
        {activeTab === 'newsletter' && <AdminNewsletterDashboard />}
      </main>
    </div>
  );
};

export default AdminDashboard;