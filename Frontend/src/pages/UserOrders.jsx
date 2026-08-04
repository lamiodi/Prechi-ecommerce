import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Package, X, WarningCircle, CaretRight, CircleNotch } from '@phosphor-icons/react';
import Navbar2 from '../components/Navbar2';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';
import { Button } from '../components/ui/button';
import { SkeletonPulse, UserOrdersSkeleton } from '../components/skeletons';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://prechi-ecommerce.onrender.com';

const UserOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        setOrdersError('');
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/users/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(response.data);
        const orderId = searchParams.get('orderId');
        if (orderId) {
          const order = response.data.find((o) => o.id === parseInt(orderId));
          setSelectedOrder(order || null);
        }
      } catch (error) {
        setOrdersError(error.response?.data?.error || 'Failed to fetch orders');
        toast.error('Failed to fetch orders');
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [user, navigate, searchParams]);

  const formatCurrency = (amount, currency) => {
    if (currency === 'NGN') {
      return `₦${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
    } else if (currency === 'USD') {
      const totalAmount = amount > 1000 ? amount / 100 : amount;
      return `$${Number(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
    return `${amount} ${currency}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!user) return null;
  if (ordersLoading) return <UserOrdersSkeleton />;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-Secondarycolor">
      <SEO title="My Orders" description="View your Prechi Clothing order history and status." url="/orders" />
      <Navbar2 />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 md:pb-20">
        <div className="section-container">
          {/* Header */}
          <div className="mb-8 md:mb-12">
            <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight text-Primarycolor">
              Order history
            </h1>
            <p className="mt-2 text-sm text-text-secondary font-display">
              Track and view details of your past purchases.
            </p>
          </div>

          {/* Orders card */}
          {ordersError && (
            <div className="flex items-center gap-2 p-4 bg-error/10 border border-error/20 rounded-sm mb-6">
              <WarningCircle size={18} className="text-error flex-shrink-0" weight="fill" />
              <p className="text-sm font-display text-error">{ordersError}</p>
            </div>
          )}

          {ordersLoading ? (
            <div className="bg-surface border border-border overflow-hidden rounded-sm p-6 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <SkeletonPulse className="h-4 w-32" />
                <SkeletonPulse className="h-4 w-24" />
              </div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border/50">
                  <SkeletonPulse className="h-4 w-20" />
                  <SkeletonPulse className="h-4 w-28" />
                  <SkeletonPulse className="h-4 w-16" />
                  <SkeletonPulse className="h-6 w-24 rounded-full" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 text-center bg-surface rounded-sm border border-border">
              <Package size={32} weight="light" className="text-text-tertiary mx-auto mb-3" />
              <p className="text-base font-display font-medium text-Primarycolor mb-1">No orders yet</p>
              <p className="text-xs font-display text-text-tertiary mb-6">When you place an order, it will appear here.</p>
              <Button onClick={() => navigate('/shop')} size="sm">
                Start shopping
              </Button>
            </div>
          ) : (
            <div className="bg-surface border border-border overflow-hidden rounded-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-Secondarycolor/50 text-[0.75rem] font-display font-medium uppercase tracking-[0.08em] text-text-tertiary">
                      <th className="py-3.5 px-6">Order</th>
                      <th className="py-3.5 px-6">Date</th>
                      <th className="py-3.5 px-6">Total</th>
                      <th className="py-3.5 px-6">Payment</th>
                      <th className="py-3.5 px-6 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm font-display">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/50 transition-colors">
                        <td className="py-4 px-6 font-medium text-Primarycolor">#{order.id}</td>
                        <td className="py-4 px-6 text-text-secondary">{formatDate(order.created_at)}</td>
                        <td className="py-4 px-6 text-Primarycolor tabular-nums">{formatCurrency(order.total, order.currency)}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            order.payment_status === 'completed'
                              ? 'bg-success/10 text-success'
                              : 'bg-warning/10 text-warning'
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setSearchParams({ orderId: order.id });
                            }}
                            className="h-8 px-2 text-xs uppercase tracking-[0.04em]"
                          >
                            View
                            <CaretRight size={14} weight="bold" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-Primarycolor/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm border border-border max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
              <div>
                <span className="text-xs font-display font-medium uppercase tracking-[0.08em] text-text-tertiary block mb-1">
                  Order details
                </span>
                <h2 className="text-xl font-display font-semibold text-Primarycolor">
                  #{selectedOrder.id}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedOrder(null);
                  setSearchParams({});
                }}
                className="h-8 w-8 text-text-tertiary hover:text-Primarycolor"
                aria-label="Close"
              >
                <X size={20} weight="light" />
              </Button>
            </div>

            <div className="space-y-6 font-display">
              {/* Summary grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-surface rounded-sm border border-border text-xs">
                <div>
                  <span className="text-text-tertiary block mb-1">Reference</span>
                  <span className="font-medium text-Primarycolor truncate block">{selectedOrder.reference}</span>
                </div>
                <div>
                  <span className="text-text-tertiary block mb-1">Date</span>
                  <span className="font-medium text-Primarycolor">{formatDate(selectedOrder.created_at)}</span>
                </div>
                <div>
                  <span className="text-text-tertiary block mb-1">Total</span>
                  <span className="font-medium text-Primarycolor tabular-nums">{formatCurrency(selectedOrder.total, selectedOrder.currency)}</span>
                </div>
                <div>
                  <span className="text-text-tertiary block mb-1">Status</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize text-Primarycolor">{selectedOrder.payment_status}</span>
                    {selectedOrder.payment_status === 'pending' && (
                      <button
                        onClick={() => navigate(`/thank-you?reference=${selectedOrder.reference}`)}
                        className="text-[11px] px-2 py-1 bg-Primarycolor text-white rounded hover:bg-black transition-colors"
                      >
                        Pay / Verify
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-text-tertiary block mb-1">Country</span>
                  <span className="font-medium text-Primarycolor">{selectedOrder.shipping_country}</span>
                </div>
              </div>

              {/* Shipping address */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-text-tertiary mb-2">
                  Shipping Address
                </h3>
                {selectedOrder.shipping_address_title ? (
                  <div className="text-xs text-text-secondary space-y-0.5 p-3 bg-surface rounded-sm">
                    <p className="font-medium text-Primarycolor">{selectedOrder.shipping_address_title}</p>
                    <p>{selectedOrder.shipping_address_line_1}</p>
                    {selectedOrder.shipping_address_landmark && <p>Landmark: {selectedOrder.shipping_address_landmark}</p>}
                    <p>{selectedOrder.shipping_address_city}, {selectedOrder.shipping_address_state || ''} {selectedOrder.shipping_address_zip_code}</p>
                    <p>{selectedOrder.shipping_address_country}</p>
                  </div>
                ) : (
                  <p className="text-xs text-text-tertiary">No shipping address provided</p>
                )}
              </div>

              {/* Items */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-text-tertiary mb-3">
                  Items ({selectedOrder.items?.length || 0})
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-surface rounded-sm border border-border">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="w-14 h-18 object-cover rounded-sm border border-border flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-18 bg-Secondarycolor rounded-sm border border-border flex items-center justify-center flex-shrink-0">
                          <Package size={20} weight="light" className="text-text-tertiary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-Primarycolor truncate">{item.product_name}</p>
                        <div className="text-xs text-text-secondary space-y-0.5 mt-1">
                          <p>Qty: {item.quantity} &times; {formatCurrency(item.price, selectedOrder.currency)}</p>
                          {item.color_name && <p>Color: {item.color_name}</p>}
                          {item.size_name && <p>Size: {item.size_name}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-Primarycolor tabular-nums">
                          {formatCurrency(item.price * item.quantity, selectedOrder.currency)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default UserOrders;