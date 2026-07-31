import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, CheckCircle, AlertCircle, RefreshCw, ArrowLeft, UserPlus, Mail, Lock, Shield, Clock, Gift } from 'lucide-react';
import { toast } from 'react-toastify';
import Navbar2 from '../components/Navbar2';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get('reference') || localStorage.getItem('lastOrderReference');
  const [order, setOrder] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [polling, setPolling] = useState(false);
  const [showConvertOption, setShowConvertOption] = useState(false);
  const pollIntervalRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Clean up intervals and timeouts on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Check if user is temporary
  useEffect(() => {
    const checkUserStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const userData = response.data;
        setUser(userData);
        
        // Show convert option if user is temporary
        if (userData.is_temporary) {
          setShowConvertOption(true);
        }
      } catch (err) {
        console.error('Error checking user status:', err);
      }
    };
    
    if (order) {
      checkUserStatus();
    }
  }, [order]);

  const startPolling = (token) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    setPolling(true);
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        let pollResponse;
        
        // For guest orders (token is null), call without authentication
        if (token === null) {
          pollResponse = await axios.get(`${API_BASE_URL}/api/orders/verify/${reference}`);
        } else {
          // For authenticated users, use the token
          pollResponse = await axios.get(`${API_BASE_URL}/api/orders/verify/${reference}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        
        if (pollResponse.data.payment_status === 'completed') {
          setOrder(pollResponse.data);
          setPolling(false);
          clearInterval(pollIntervalRef.current);
          toast.success('Payment verified successfully!');
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    }, 5000); // Poll every 5 seconds
    
    // Clear interval after 2 minutes to prevent infinite polling
    timeoutRef.current = setTimeout(() => {
      clearInterval(pollIntervalRef.current);
      setPolling(false);
    }, 120000);
  };

  const handleRefresh = () => {
    setRetryCount(0);
    verifyOrder();
  };

  const verifyOrder = async () => {
    if (!reference) {
      setError('No order reference provided. Please check your email for order confirmation.');
      setLoading(false);
      return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        console.log(`📡 Fetching order for reference: ${reference}, attempt ${retryCount + 1}`);
        
        // For guest orders, we can verify without authentication
        if (!token) {
          const response = await axios.get(`${API_BASE_URL}/api/orders/verify/${reference}`);
          const orderData = response.data;
          setOrder(orderData);
          console.log('✅ Guest order verified:', orderData);
          
          // If payment is still pending, start polling with guest verification
          if (orderData.payment_status === 'pending') {
            startPolling(null); // Pass null token for guest polling
          }
          
          setLoading(false);
          return;
        }
        
        // For authenticated users, use the token
        const response = await axios.get(`${API_BASE_URL}/api/orders/verify/${reference}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      
      const orderData = response.data;
      setOrder(orderData);
      console.log('✅ Order verified:', orderData);
      
      // If payment is still pending, start polling
      if (orderData.payment_status === 'pending') {
        startPolling(token);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('❌ Error verifying order:', err.response?.data || err.message);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        // For guest users, don't redirect to login - allow them to stay on the page
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Order verification failed. Please try verifying manually or contact support.');
        } else {
          setError('Authentication failed. Please log in again.');
          navigate('/login', { state: { from: `/thank-you?reference=${reference}` } });
        }
      } else if (err.response?.status === 404) {
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          setTimeout(verifyOrder, 3000);
          return;
        }
        setError('Order not found. Payment may still be processing. Please try verifying manually.');
      } else {
        setError('Failed to verify order. Please try verifying manually.');
      }
      setLoading(false);
    }
  };
  
  useEffect(() => {
    verifyOrder();
  }, [reference, navigate, retryCount]);

  const handleManualVerify = async () => {
    if (!reference) return;
    
    setVerifying(true);
    try {
      const token = localStorage.getItem('token');
      let response;
      
      // For guest orders, call without authentication
      if (!token) {
        response = await axios.get(
          `${API_BASE_URL}/api/orders/verify/${reference}`
        );
      } else {
        // For authenticated users, use the token
        response = await axios.get(
          `${API_BASE_URL}/api/orders/verify/${reference}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      if (response.data.order) {
        setOrder(response.data.order);
        setError(null);
        toast.success('Payment verified successfully!');
      }
    } catch (err) {
      setError('Failed to verify payment. Please try again later or contact support.');
    } finally {
      setVerifying(false);
    }
  };

  const handleConvertAccount = () => {
    // Simply navigate to the forgot password page
    navigate('/forgot-password', { 
      state: { 
        isTemporary: true
      } 
    });
  };

  const formatTotal = () => {
    if (!order) return '';
    
    if (order.currency === 'NGN') {
      return `₦${order.total.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
    } else if (order.currency === 'USD') {
      const totalAmount = order.total > 1000 ? order.total / 100 : order.total;
      return `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
    return `${order.total} ${order.currency}`;
  };

  const isInternational = order && order.shipping_country !== 'Nigeria';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 md:h-16 md:w-16 animate-spin text-Primarycolor mx-auto mb-4" />
          <p className="text-base md:text-lg text-Accent font-PatrickHand">Verifying your payment...</p>
          {retryCount > 0 && (
            <p className="text-sm md:text-base text-Accent mt-2 font-PatrickHand">
              Retry attempt {retryCount} of 3
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="min-h-screen bg-gray-100 typography"
        style={{
          '--color-Primarycolor': '#1E1E1E',
          '--color-Secondarycolor': '#ffffff',
          '--color-Accent': '#6E6E6E',
          '--font-Manrope': '"Manrope", "sans-serif"',
          '--font-PatrickHand': '"Jost", "sans-serif"'
        }}
      >
        <Navbar2 />
        <div className="max-w-7xl xl:max-w-[90rem] 2xl:max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 md:h-16 md:w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-bold text-Primarycolor mb-4 font-Manrope">Payment Verification Issue</h2>
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 max-w-lg mx-auto">
              <p className="text-sm md:text-base text-red-700 font-PatrickHand">{error}</p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button
                onClick={handleManualVerify}
                disabled={verifying}
                className="w-full sm:w-auto font-PatrickHand"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin text-Primarycolor" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Verify Payment Manually
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleRefresh}
                variant="secondary"
                className="w-full sm:w-auto font-PatrickHand"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            </div>
            
            <div className="mt-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-sm md:text-base text-Accent hover:text-Primarycolor font-PatrickHand"
              >
                Return to Homepage
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div 
        className="min-h-screen bg-gray-100 typography"
        style={{
          '--color-Primarycolor': '#1E1E1E',
          '--color-Secondarycolor': '#ffffff',
          '--color-Accent': '#6E6E6E',
          '--font-Manrope': '"Manrope", "sans-serif"',
          '--font-PatrickHand': '"Jost", "sans-serif"'
        }}
      >
        <Navbar2 />
        <div className="max-w-7xl xl:max-w-[90rem] 2xl:max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 md:h-16 md:w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-bold text-Primarycolor mb-4 font-Manrope">Order Not Found</h2>
            <p className="text-sm md:text-base text-Accent mb-6 font-PatrickHand">We couldn't find your order details. Please try verifying your payment manually.</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button
                onClick={handleManualVerify}
                disabled={verifying}
                className="w-full sm:w-auto font-PatrickHand"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin text-Primarycolor" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Verify Payment Manually
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleRefresh}
                variant="secondary"
                className="w-full sm:w-auto font-PatrickHand"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            </div>
            
            <div className="mt-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-sm md:text-base text-Accent hover:text-Primarycolor font-PatrickHand"
              >
                Return to Homepage
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gray-100 typography"
      style={{
        '--color-Primarycolor': '#1E1E1E',
        '--color-Secondarycolor': '#ffffff',
        '--color-Accent': '#6E6E6E',
        '--font-Manrope': '"Manrope", "sans-serif"',
        '--font-PatrickHand': '"Jost", "sans-serif"'
      }}
    >
      <Navbar2 />
      <div className="max-w-7xl xl:max-w-[90rem] 2xl:max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 pb-8 md:pb-12">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 md:h-16 md:w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-Primarycolor mb-4 font-Manrope">
            {isInternational && !order.delivery_fee_paid
              ? 'Order Received - Awaiting Delivery Fee Email'
              : 'Order Confirmed'}
          </h2>
          
          {order && order.payment_status === 'pending' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 max-w-2xl mx-auto">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Loader2 className="h-5 w-5 text-yellow-400 animate-spin" />
                </div>
                <div className="ml-3">
                  <p className="text-sm md:text-base text-yellow-700 font-PatrickHand">
                    Payment is still being processed. This page will update automatically once payment is confirmed.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Enhanced Account Conversion Banner for Temporary Users */}
          {showConvertOption && (
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-1 mb-8 max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
              <div className="bg-white rounded-lg p-4 md:p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                    <UserPlus className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-Primarycolor mb-2 font-Manrope">Create Your Permanent Account</h3>
                  <p className="text-sm md:text-base text-Accent mb-6 max-w-md font-PatrickHand">
                    You're currently using a temporary account. Set up a password to convert it to a permanent account and unlock these benefits:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 w-full">
                    <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                      <Shield className="h-8 w-8 text-blue-600 mb-2" />
                      <span className="text-sm font-medium text-Primarycolor font-Manrope">Secure Access</span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                      <Clock className="h-8 w-8 text-blue-600 mb-2" />
                      <span className="text-sm font-medium text-Primarycolor font-Manrope">Order History</span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                      <Gift className="h-8 w-8 text-blue-600 mb-2" />
                      <span className="text-sm font-medium text-Primarycolor font-Manrope">Exclusive Offers</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleConvertAccount}
                    className="w-full sm:w-auto shadow-lg flex items-center justify-center font-Manrope"
                  >
                    <Lock className="h-5 w-5 mr-2" />
                    Set Up Password
                  </Button>
                  
                  <p className="text-xs md:text-sm text-Accent mt-3 font-PatrickHand">
                    This will convert your temporary account to a permanent one
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
            <p className="text-sm md:text-base text-Accent mb-4 font-PatrickHand">
              {isInternational && !order.delivery_fee_paid
                ? 'Thank you for your order! We will send you a delivery fee quote for your international order soon.'
                : 'Thank you for your order! You\'ll receive a confirmation email soon.'}
            </p>
            
            {isInternational && !order.delivery_fee_paid && (
              <p className="text-sm md:text-base text-Accent mb-6 font-PatrickHand">
                Please check your email for the delivery fee payment link.
              </p>
            )}
          </div>
          
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md text-left w-full max-w-md sm:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-sm text-Accent font-PatrickHand">Order ID</p>
                <p className="text-sm md:text-base font-medium text-Primarycolor font-PatrickHand">{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-Accent font-PatrickHand">Reference</p>
                <p className="text-sm md:text-base font-medium text-Primarycolor font-PatrickHand">{order.reference}</p>
              </div>
              <div>
                <p className="text-sm text-Accent font-PatrickHand">Total</p>
                <p className="text-sm md:text-base font-medium text-Primarycolor font-PatrickHand">{formatTotal()}</p>
              </div>
              <div>
                <p className="text-sm text-Accent font-PatrickHand">Payment Status</p>
                <p className={`text-sm md:text-base font-medium ${
                  order.payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                } font-PatrickHand`}>
                  {order.payment_status}
                  {polling && order.payment_status === 'pending' && (
                    <Loader2 className="h-3 w-3 ml-1 inline animate-spin text-Primarycolor" />
                  )}
                </p>
              </div>
              {isInternational && (
                <div>
                  <p className="text-sm text-Accent font-PatrickHand">Delivery Fee</p>
                  <p className={`text-sm md:text-base font-medium ${
                    order.delivery_fee_paid ? 'text-green-600' : 'text-yellow-600'
                  } font-PatrickHand`}>
                    {order.delivery_fee_paid ? 'Paid' : 'Pending'}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-Accent font-PatrickHand">Shipping Country</p>
                <p className="text-sm md:text-base font-medium text-Primarycolor font-PatrickHand">{order.shipping_country}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col justify-center items-center gap-4 w-full max-w-md mx-auto">
            {user && !user.is_temporary && (
              <Button
                onClick={() => navigate(`/orders?orderId=${order.id}`)}
                className="w-full font-PatrickHand"
              >
                View Order Details
              </Button>
            )}
            {user && user.is_temporary && (
              <div className="w-full bg-blue-50 border border-blue-200 rounded-md p-3 sm:p-4 text-center">
                <p className="text-xs md:text-sm text-blue-800 font-PatrickHand mb-2">
                  To view your order details and track future orders, please convert your guest account to a permanent account.
                </p>
                <Button
                  onClick={handleConvertAccount}
                  size="sm"
                  className="font-PatrickHand"
                >
                  Convert Account
                </Button>
              </div>
            )}
            {!user && (
              <div className="w-full bg-blue-50 border border-blue-200 rounded-md p-4 text-center">
                <p className="text-sm md:text-base text-blue-800 font-PatrickHand mb-4">
                  Made this order as a guest? Reset your password to convert your temporary account to a permanent one and access order history.
                </p>
                <Button
                  onClick={() => navigate('/forgot-password')}
                  className="w-full font-PatrickHand mb-3"
                >
                  Reset Password
                </Button>
              </div>
            )}
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full font-PatrickHand"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ThankYou;