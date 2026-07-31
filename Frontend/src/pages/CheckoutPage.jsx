import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CaretLeft,
  WarningCircle,
  CheckCircle,
  Trash,
  CurrencyBtc,
  WhatsappLogo,
  Truck,
  MapPin,
  PencilSimple,
  Plus,
  CreditCard,
  CircleNotch,
  ShieldCheck,
  Check
} from '@phosphor-icons/react';
import Navbar2 from '../components/Navbar2';
import Footer from '../components/Footer';
import GuestCheckoutModal from '../components/checkout/GuestCheckoutModal';
import OrderSummary from '../components/checkout/OrderSummary';
const BillingAddressForm = React.lazy(() => import('../components/BillingAddressForm'));
const ShippingAddressForm = React.lazy(() => import('../components/ShippingAddressForm'));
import { useAuth } from '../context/AuthContext';
import { useUserManager } from '../hooks/useUserManager';
import { CurrencyContext } from './CurrencyContext';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import PaystackPop from '@paystack/inline-js';
import SEO from '../components/SEO';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}`.replace(/\/api$/, '')
  : 'https://prechi-ecommerce.onrender.com';
const WHATSAPP_NUMBER = '2349016420903';

const CheckoutPage = () => {
  const { user: authUser, loading: authLoading } = useAuth();
  const { user: hookUser, refreshUser, refreshCount } = useUserManager();
  const user = hookUser || authUser;

  let currencyContext;
  try {
    currencyContext = useContext(CurrencyContext);
  } catch (error) {
    currencyContext = { currency: 'NGN', exchangeRate: 1, country: 'Nigeria', contextLoading: false };
  }

  const { currency = 'NGN', exchangeRate = 1, country = 'Nigeria', contextLoading = false } = currencyContext || {};
  const navigate = useNavigate();

  const [cart, setCart] = useState({ cartId: null, subtotal: 0, tax: 0, total: 0, items: [] });
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [billingAddresses, setBillingAddresses] = useState([]);
  const [shippingAddressId, setShippingAddressId] = useState(null);
  const [billingAddressId, setBillingAddressId] = useState(null);
  const [shippingMethod, setShippingMethod] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderNote, setOrderNote] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [shippingAddressLoading, setShippingAddressLoading] = useState(false);
  const [billingAddressLoading, setBillingAddressLoading] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [editingShippingAddress, setEditingShippingAddress] = useState(null);
  const [editingBillingAddress, setEditingBillingAddress] = useState(null);
  const [showBitcoinInstructions, setShowBitcoinInstructions] = useState(false);

  const [shippingForm, setShippingForm] = useState({
    title: '',
    address_line_1: '',
    landmark: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Nigeria',
    phone_number: '',
  });

  const [billingForm, setBillingForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    address_line_1: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Nigeria',
  });

  const [billingAddressOption, setBillingAddressOption] = useState('same');
  const [firstOrderDiscount, setFirstOrderDiscount] = useState(0);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const [userDataRefreshed, setUserDataRefreshed] = useState(false);
  const [isGuest, setIsGuest] = useState(() => !localStorage.getItem('token'));
  const [guestForm, setGuestForm] = useState(() => {
    try {
      const saved = localStorage.getItem('prechi_guest_info');
      return saved ? JSON.parse(saved) : { name: '', email: '', phone_number: '' };
    } catch (e) {
      return { name: '', email: '', phone_number: '' };
    }
  });
  const [createdUserId, setCreatedUserId] = useState(() => localStorage.getItem('prechi_guest_id') || null);
  const [guestFormSubmitted, setGuestFormSubmitted] = useState(() => !!localStorage.getItem('prechi_guest_id'));
  const [showGuestModal, setShowGuestModal] = useState(() => !localStorage.getItem('token') && !localStorage.getItem('prechi_guest_id'));
  const [guestFormErrors, setGuestFormErrors] = useState({});
  const [existingUserType, setExistingUserType] = useState(null);
  const [requiredForm, setRequiredForm] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [missingFieldsSummary, setMissingFieldsSummary] = useState([]);
  const [idempotencyKey] = useState(() => uuidv4());

  const validateStep1 = () => {
    const missing = [];
    if (isGuest && !guestFormSubmitted) missing.push("Guest contact information is required");
    const hasShipping = isAuthenticated()
      ? (shippingAddressId && shippingAddresses.length > 0) || shippingForm.address_line_1
      : shippingForm.address_line_1;
    if (!hasShipping) {
      missing.push("Shipping address is missing");
      setRequiredForm('shipping');
    }
    const addressCountry = shippingForm.country || country;
    const isNigeria = addressCountry.toLowerCase() === 'nigeria';
    if (isNigeria && !shippingMethod) missing.push("Delivery method is required");

    if (missing.length > 0) {
      setMissingFieldsSummary(missing);
      return false;
    }
    setMissingFieldsSummary([]);
    return true;
  };

  const validateStep2 = () => {
    const missing = [];
    const hasBilling = isAuthenticated()
      ? (billingAddressOption === 'same' && (shippingAddressId || shippingForm.address_line_1)) || (billingAddressId && billingAddresses.length > 0)
      : (billingAddressOption === 'same' ? shippingForm.address_line_1 : billingForm.address_line_1);

    if (!hasBilling) {
      missing.push("Billing address is missing");
      setRequiredForm('billing');
    }
    if (missing.length > 0) {
      setMissingFieldsSummary(missing);
      return false;
    }
    setMissingFieldsSummary([]);
    return true;
  };

  const handleNextStep = (step) => {
    if (step === 2) {
      if (validateStep1()) setCurrentStep(2);
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 3) {
      if (validateStep2()) setCurrentStep(3);
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGuestFormChange = useCallback((field, value) => {
    setGuestForm(prev => ({ ...prev, [field]: value }));
    if (field === 'name' || field === 'email') setExistingUserType(null);
  }, []);

  const handleOrderNoteChange = useCallback((e) => {
    setOrderNote(e.target.value);
  }, []);

  const handleLoginRedirect = useCallback(() => {
    navigate('/login', { state: { from: '/checkout' } });
  }, [navigate]);

  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(jsonPayload);
    } catch (err) {
      return null;
    }
  };

  const getToken = () => {
    if (user && user.token) return user.token;
    return localStorage.getItem('token');
  };

  const getUserId = () => {
    const token = getToken();
    if (!token) return null;
    const tokenData = decodeToken(token);
    return tokenData?.id;
  };

  const isAuthenticated = () => !!getToken();

  const refreshUserData = async () => {
    try {
      const updatedUser = await refreshUser();
      if (updatedUser) {
        setUserDataRefreshed(true);
        return updatedUser;
      }
    } catch (err) {}
    return null;
  };

  useEffect(() => {
    const refreshUserDataOnMount = async () => {
      if (user && isAuthenticated() && !userDataRefreshed) {
        try { await refreshUserData(); } catch (err) {}
      }
    };
    refreshUserDataOnMount();
  }, [user, userDataRefreshed]);

  useEffect(() => {
    const currentSubtotal = cart.subtotal;
    if (isGuest) {
      setFirstOrderDiscount(0);
    } else if (user && (user.first_order === true || user.first_order === 1) && currentSubtotal > 0) {
      setFirstOrderDiscount(Number((currentSubtotal * 0.05).toFixed(2)));
    } else {
      setFirstOrderDiscount(0);
    }
  }, [user?.first_order, cart.subtotal, userDataRefreshed, refreshCount, isGuest]);

  const shippingOptions = [
    {
      id: 2,
      method: 'Delivery within Lagos Mainland',
      total_cost: 4000,
      estimated_delivery: '5–7 business days',
      icon: 'package',
      description: 'Reliable delivery within Lagos Mainland'
    },
    {
      id: 1,
      method: 'Delivery within Lagos Island',
      total_cost: 6000,
      estimated_delivery: '3–5 business days',
      icon: 'truck',
      description: 'Fast delivery within Lagos Island'
    },
    {
      id: 3,
      method: 'Outside Lagos',
      total_cost: 7000,
      estimated_delivery: '7–10 business days',
      icon: 'home',
      description: 'Delivery outside Lagos state'
    },
  ];

  const validateGuestForm = useCallback(() => {
    const errors = {};
    if (!guestForm.name.trim()) errors.name = 'Please enter your full name';
    if (!guestForm.email.trim()) errors.email = 'Please enter your email address';
    else if (!/\S+@\S+\.\S+/.test(guestForm.email)) errors.email = 'Please enter a valid email';
    if (!guestForm.phone_number.trim()) errors.phone_number = 'Please enter your phone number';

    if (Object.keys(errors).length > 0) {
      setGuestFormErrors(errors);
      return false;
    }
    setGuestFormErrors({});
    return true;
  }, [guestForm]);

  const handleGuestFormSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!validateGuestForm()) {
      setRequiredForm('guest');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/create-temp-user`, {
        name: guestForm.name,
        email: guestForm.email,
        phone_number: guestForm.phone_number
      });

      const { user, isExisting } = response.data;
      const userId = user.id;

      setCreatedUserId(userId);
      setShowGuestModal(false);
      setGuestFormSubmitted(true);
      localStorage.setItem('prechi_guest_info', JSON.stringify(guestForm));
      localStorage.setItem('prechi_guest_id', userId);

      if (isExisting) {
        setExistingUserType('temporary');
        toast.success('Welcome back!');
      } else {
        setExistingUserType(null);
        toast.success('Account created successfully!');
      }

      setShippingForm(prev => ({
        ...prev,
        title: 'Home',
        phone_number: guestForm.phone_number
      }));

      setBillingForm(prev => ({
        ...prev,
        full_name: guestForm.name,
        email: guestForm.email,
        phone_number: guestForm.phone_number,
      }));

      setBillingAddressOption('same');
      return userId;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to create guest account';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setShippingAddressLoading(false);
    }
  }, [guestForm, validateGuestForm]);

  const generateOrderReference = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const processOrder = useCallback(async (guestUserId = null) => {
    const userId = guestUserId || createdUserId || getUserId();
    if (!guestUserId && isGuest && !guestFormSubmitted) {
      setError('Please complete the guest form to continue');
      setRequiredForm('guest');
      setLoading(false);
      return;
    }

    const hasShippingAddress = isAuthenticated()
      ? (shippingAddressId && shippingAddresses.length > 0) || shippingForm.address_line_1
      : shippingForm.address_line_1;

    if (!hasShippingAddress) {
      setError('Please add a shipping address');
      setRequiredForm('shipping');
      setLoading(false);
      return;
    }

    const hasBillingAddress = isAuthenticated()
      ? (billingAddressOption === 'same' && hasShippingAddress) || (billingAddressId && billingAddresses.length > 0)
      : billingForm.address_line_1;

    if (!hasBillingAddress) {
      setError('Please add a billing address');
      setRequiredForm('billing');
      setLoading(false);
      return;
    }

    const addressCountry = shippingForm.country;
    const isNigeria = addressCountry.toLowerCase() === 'nigeria';

    if (isNigeria && !shippingMethod) {
      setError('Please select a shipping method');
      setLoading(false);
      return;
    }

    if (!cart?.items?.length) {
      setError('Cart is empty');
      toast.error('Cart is empty');
      setLoading(false);
      return;
    }

    try {
      const baseSubtotal = Number(cart?.subtotal) || 0;
      const baseFirstOrderDiscount = firstOrderDiscount;
      const baseCouponDiscount = couponDiscount;
      const baseTotalDiscount = Number((baseFirstOrderDiscount + baseCouponDiscount).toFixed(2));
      const baseFinalDiscount = Math.min(baseTotalDiscount, baseSubtotal);
      const baseTax = isNigeria ? 0 : Number((baseSubtotal * 0.05).toFixed(2));
      const baseShippingCost = isNigeria ? shippingMethod?.total_cost || 0 : 0;
      const baseDiscountedSubtotal = Number((baseSubtotal - baseFinalDiscount).toFixed(2));
      const baseTotal = Number((baseDiscountedSubtotal + baseTax + baseShippingCost).toFixed(2));

      const orderData = {
        user_id: userId,
        shipping_data: !isAuthenticated() ? shippingForm : null,
        billing_data: !isAuthenticated()
          ? (billingAddressOption === 'same'
            ? {
              ...shippingForm,
              full_name: guestForm.name || billingForm.full_name,
              email: guestForm.email || billingForm.email,
              phone_number: guestForm.phone_number || shippingForm.phone_number,
            }
            : billingForm)
          : null,
        address_id: isAuthenticated() ? parseInt(shippingAddressId) : null,
        billing_address_id: isAuthenticated() ?
          (billingAddressOption === 'same' ? parseInt(shippingAddressId) : parseInt(billingAddressId)) : null,
        cart_id: isAuthenticated() ? cart.cartId : null,
        total: baseTotal,
        discount: baseFinalDiscount,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        delivery_option: isNigeria ? 'standard' : 'international',
        shipping_method_id: isNigeria ? shippingMethod?.id : null,
        shipping_cost: baseShippingCost,
        shipping_country: addressCountry,
        payment_method: paymentMethod,
        currency: 'NGN',
        reference: generateOrderReference(),
        items: cart.items.map(item => {
          const basePrice = Number(item.item?.price || 0);
          const resolvedVariantId = item.item?.is_product
            ? (item.variant_id ?? item.item?.variant?.variant_id ?? null)
            : null;
          const resolvedBundleId = item.item?.is_product ? null : (item.bundle_id ?? item.item?.id ?? null);
          const resolvedSizeId = item.size_id ?? item.item?.size_id ?? null;

          const resolveImgUrl = (raw) => {
            if (!raw) return null;
            if (typeof raw === 'string') return raw;
            if (typeof raw === 'object') return raw?.image_url || raw?.url || null;
            return null;
          };

          const orderItem = {
            variant_id: resolvedVariantId,
            bundle_id: resolvedBundleId,
            quantity: item.quantity || 1,
            price: basePrice,
            size_id: resolvedSizeId,
            image_url: resolveImgUrl(item.item?.image) ||
              resolveImgUrl(item.item?.image_url) ||
              resolveImgUrl(item.item?.is_product
                ? item.item?.variant?.images?.[0]
                : item.item?.images?.[0]) ||
              null,
            product_name: item.item?.name || 'Unknown Item',
            color_name: item.item?.color || item.item?.variant?.color_name || null,
            size_name: item.item?.size || item.size_name || null,
          };

          const bundleItems = item.item?.items;
          if (!item.item?.is_product && Array.isArray(bundleItems) && bundleItems.length > 0) {
            orderItem.bundle_items = bundleItems.map(bundleItem => ({
              variant_id: bundleItem.variant_id,
              size_id: bundleItem.size_id
            }));
          }
          return orderItem;
        }),
        note: orderNote,
        exchange_rate: 1,
        base_currency_total: baseTotal,
        converted_total: baseTotal,
        tax: baseTax,
      };

      let orderResponse;
      try {
        orderResponse = await axios.post(`${API_BASE_URL}/api/orders`, orderData, {
          headers: { 'X-Idempotency-Key': idempotencyKey }
        });
        if (orderResponse.data.message === 'Order already exists with pending payment') {
          orderResponse = { data: { order: { id: orderResponse.data.order.id, reference: orderResponse.data.order.reference } } };
        }
      } catch (err) {
        if (err.response?.status === 409 && err.response?.data?.order_id) {
          const existingOrderId = err.response.data.order_id;
          if (err.response.data.payment_status === 'completed') {
            toast.success('Order already exists with completed payment');
            navigate(`/thank-you?reference=${err.response.data.reference || orderData.reference}&orderId=${existingOrderId}`);
            return;
          }
          orderResponse = { data: { order: { id: existingOrderId, reference: err.response.data.reference || orderData.reference } } };
        } else {
          throw err;
        }
      }

      const orderId = orderResponse.data.order?.id || orderResponse.data.id || orderResponse.data.data?.id;
      if (!orderId) throw new Error('Order ID not found');

      const paymentData = {
        order_id: orderId,
        reference: orderResponse.data.order?.reference || orderData.reference,
        email: billingForm.email || guestForm.email || user?.email || user?.login || JSON.parse(localStorage.getItem('user') || '{}')?.email || null,
        amount: Math.round(baseTotal * 100),
        currency: 'NGN',
        callback_url: `${window.location.origin}/thank-you?reference=${orderResponse.data.order?.reference || orderData.reference}&orderId=${orderId}`,
      };

      if (!paymentData.email || !paymentData.email.includes('@')) {
        throw new Error('No valid email address found for payment.');
      }

      let paymentResponse = await axios.post(`${API_BASE_URL}/api/paystack/initialize`, paymentData);
      let paymentInfo = paymentResponse.data.data || paymentResponse.data;

      if (isGuest) localStorage.removeItem('guestCart');
      toast.success('Order placed!');
      localStorage.setItem('lastOrderReference', orderResponse.data.order?.reference || orderData.reference);
      localStorage.setItem('pendingOrderId', orderId);

      const accessCode = paymentInfo.access_code;
      const authorizationUrl = paymentInfo.authorization_url;

      if (accessCode) {
        const paystack = new PaystackPop();
        paystack.newTransaction({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email: paymentData.email,
          amount: paymentData.amount,
          currency: paymentData.currency,
          reference: paymentData.reference,
          callback: () => {
            toast.success('Payment successful!');
            navigate(`/thank-you?reference=${paymentData.reference}&orderId=${orderId}`);
          },
          onClose: () => {
            if (isGuest) navigate(`/thank-you?reference=${paymentData.reference}&orderId=${orderId}`);
            else navigate(`/orders/${orderId}`);
          }
        });
      } else if (authorizationUrl) {
        window.location.href = authorizationUrl;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to process order';
      setError(`Order processing error: ${errorMessage}`);
      toast.error(`Order processing error: ${errorMessage}`);
      setLoading(false);
    }
  }, [createdUserId, getUserId, isGuest, guestFormSubmitted, isAuthenticated, shippingAddressId, shippingAddresses.length, shippingForm, billingAddressOption, billingAddressId, billingAddresses.length, billingForm, country, shippingMethod, cart, firstOrderDiscount, couponDiscount, paymentMethod, guestForm, appliedCoupon, orderNote, idempotencyKey, user, navigate]);

  const handlePlaceOrder = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setLoading(true);
    setError('');
    setRequiredForm(null);

    try {
      if (isGuest && !guestFormSubmitted) {
        const guestUserId = await handleGuestFormSubmit();
        if (!guestUserId) {
          setLoading(false);
          setIsProcessing(false);
          return;
        }
        await processOrder(guestUserId);
      } else {
        await processOrder();
      }
    } catch (err) {
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  }, [isProcessing, isGuest, guestFormSubmitted, handleGuestFormSubmit, processOrder]);

  const handleShippingSubmit = useCallback(async (data) => {
    try {
      setShippingAddressLoading(true);
      if (isAuthenticated()) {
        const token = localStorage.getItem('token');
        const userId = getUserId();
        const addressData = { user_id: userId, title: data.title || 'Home', ...data };
        let response;
        if (editingShippingAddress) {
          response = await axios.put(`${API_BASE_URL}/api/addresses/${editingShippingAddress.id}`, addressData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setShippingAddresses(prev => prev.map(addr => addr.id === editingShippingAddress.id ? response.data : addr));
          setShippingAddressId(String(response.data.id));
        } else {
          response = await axios.post(`${API_BASE_URL}/api/addresses/`, addressData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setShippingAddresses(prev => [response.data, ...prev]);
          setShippingAddressId(String(response.data.id));
        }
      }
      setShippingForm(data);
      setShowShippingForm(false);
      setEditingShippingAddress(null);
      if (billingAddressOption === 'same') {
        setBillingForm({
          full_name: guestForm.name || billingForm.full_name,
          email: guestForm.email || billingForm.email,
          phone_number: isGuest ? guestForm.phone_number : data.phone_number,
          ...data
        });
      }
      toast.success(editingShippingAddress ? 'Shipping address updated' : 'Shipping address added');
    } catch (err) {
      toast.error('Failed to save address');
      setShowShippingForm(false);
    } finally {
      setShippingAddressLoading(false);
    }
  }, [isAuthenticated, editingShippingAddress, billingAddressOption, guestForm, billingForm, isGuest]);

  const handleBillingSubmit = useCallback(async (data) => {
    try {
      setBillingAddressLoading(true);
      if (isAuthenticated()) {
        const token = localStorage.getItem('token');
        const userId = getUserId();
        const billingData = { user_id: userId, ...data };
        let response;
        if (editingBillingAddress) {
          response = await axios.put(`${API_BASE_URL}/api/billing-addresses/${editingBillingAddress.id}`, billingData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setBillingAddresses(prev => prev.map(addr => addr.id === editingBillingAddress.id ? response.data : addr));
          setBillingAddressId(String(response.data.id));
        } else {
          response = await axios.post(`${API_BASE_URL}/api/billing-addresses/`, billingData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setBillingAddresses(prev => [response.data, ...prev]);
          setBillingAddressId(String(response.data.id));
        }
      }
      setBillingForm(data);
      setShowBillingForm(false);
      setEditingBillingAddress(null);
      toast.success('Billing address saved');
    } catch (err) {
      toast.error('Failed to save billing address');
      setShowBillingForm(false);
    } finally {
      setBillingAddressLoading(false);
    }
  }, [isAuthenticated, editingBillingAddress]);

  const handleEditAddress = useCallback((type, address) => {
    if (type === 'addresses') {
      setShippingForm(address);
      setEditingShippingAddress(address);
      setShowShippingForm(true);
    } else {
      setBillingForm(address);
      setEditingBillingAddress(address);
      setShowBillingForm(true);
    }
  }, []);

  const handleDeleteAddress = useCallback(async (type, addressId) => {
    if (!window.confirm('Delete address?')) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/${type}/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (type === 'addresses') {
        const remaining = shippingAddresses.filter(addr => String(addr.id) !== String(addressId));
        setShippingAddresses(remaining);
        if (String(shippingAddressId) === String(addressId)) {
          setShippingAddressId(remaining.length ? String(remaining[0].id) : null);
        }
      } else {
        const remaining = billingAddresses.filter(addr => String(addr.id) !== String(addressId));
        setBillingAddresses(remaining);
        if (String(billingAddressId) === String(addressId)) {
          setBillingAddressId(remaining.length ? String(remaining[0].id) : null);
        }
      }
      toast.success('Address deleted');
    } catch (err) {
      toast.error('Failed to delete address');
    } finally {
      setLoading(false);
    }
  }, [shippingAddresses, billingAddresses, shippingAddressId, billingAddressId]);

  const fetchCartAndAddresses = useCallback(async () => {
    if (!isAuthenticated() && !createdUserId) {
      const guestCartData = localStorage.getItem('guestCart');
      if (guestCartData) {
        try {
          const guestCart = JSON.parse(guestCartData);
          setCart(guestCart);
          setIsGuest(true);
          setShowGuestModal(true);
          setLoading(false);
          return;
        } catch (err) {}
      }
      setCart({ cartId: null, subtotal: 0, tax: 0, total: 0, items: [] });
      setIsGuest(true);
      setShowGuestModal(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userId = createdUserId || getUserId();
      if (createdUserId && !isAuthenticated()) {
        setIsGuest(true);
        setLoading(false);
        return;
      }
      const token = getToken();

      const [cartResult, shippingResult, billingResult] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/cart/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/addresses/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/billing-addresses/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (cartResult.status === 'fulfilled') {
        const cartData = cartResult.value.data?.data || cartResult.value.data;
        if (!cartData.cartId || !cartData.items?.length) {
          navigate('/cart');
          return;
        }
        setCart(cartData);
        setIsGuest(false);
      }

      if (shippingResult.status === 'fulfilled') {
        let shippingData = shippingResult.value.data || [];
        if (!Array.isArray(shippingData)) shippingData = [shippingData];
        setShippingAddresses(shippingData);
        if (shippingData.length > 0) setShippingAddressId(String(shippingData[0].id));
      }

      if (billingResult.status === 'fulfilled') {
        let billingData = billingResult.value.data || [];
        if (!Array.isArray(billingData)) billingData = [billingData];
        setBillingAddresses(billingData);
        if (billingData.length > 0) setBillingAddressId(String(billingData[0].id));
      }
    } catch (err) {
      toast.error('Failed to load checkout details');
    } finally {
      setLoading(false);
    }
  }, [createdUserId, navigate]);

  useEffect(() => {
    if (!authLoading && !contextLoading) fetchCartAndAddresses();
  }, [authLoading, contextLoading, fetchCartAndAddresses]);

  const addressCountry = shippingForm.country || country;
  const isNigeria = addressCountry.toLowerCase() === 'nigeria';

  const calculatedValues = useMemo(() => {
    const subtotal = Number(cart?.subtotal) || 0;
    const tax = isNigeria ? 0 : Number((subtotal * 0.05).toFixed(2));
    const shippingCost = isNigeria ? shippingMethod?.total_cost || 0 : 0;
    const totalDiscount = Number((firstOrderDiscount + couponDiscount).toFixed(2));
    const finalDiscount = Math.min(totalDiscount, subtotal);
    const discountedSubtotal = Number((subtotal - finalDiscount).toFixed(2));
    const total = Number((discountedSubtotal + tax + shippingCost).toFixed(2));

    return {
      displaySubtotal: subtotal,
      displayFirstOrderDiscount: firstOrderDiscount,
      displayCouponDiscount: couponDiscount,
      displayTax: tax,
      displayTotal: total
    };
  }, [cart?.subtotal, isNigeria, shippingMethod?.total_cost, firstOrderDiscount, couponDiscount]);

  const { displaySubtotal, displayFirstOrderDiscount, displayCouponDiscount, displayTax, displayTotal } = calculatedValues;

  const handleWhatsAppPayment = () => {
    const message = `Hello, I would like to pay for my order with Bitcoin.\nOrder Total: ₦${displayTotal.toLocaleString()}\nRef: ORD-${createdUserId || getUserId()}-${Date.now()}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (authLoading || contextLoading || loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-Secondarycolor font-display">
        <Navbar2 />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <CircleNotch size={28} className="animate-spin text-Primarycolor mx-auto mb-3" />
            <p className="text-xs font-display uppercase tracking-[0.08em] text-text-tertiary">Preparing checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-Secondarycolor font-display">
      <SEO title="Checkout | Prechi" description="Complete your purchase securely on Prechi." />
      <Navbar2 />

      <main className="flex-1 pt-24 pb-20">
        <div className="section-container">
          <Link to="/cart" className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-Primarycolor transition-colors uppercase tracking-[0.08em] mb-8 font-medium">
            <CaretLeft size={14} weight="bold" /> Return to shopping bag
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-Primarycolor tracking-tight">Checkout</h1>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>256-bit Encrypted SSL Payment</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-sm flex items-start gap-3 text-rose-800 text-xs font-medium">
              <WarningCircle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Guest Checkout Modal overlay */}
          {isGuest && showGuestModal && (
            <GuestCheckoutModal
              guestForm={guestForm}
              guestFormErrors={guestFormErrors}
              existingUserType={existingUserType}
              requiredForm={requiredForm}
              onGuestFormChange={handleGuestFormChange}
              onLoginRedirect={handleLoginRedirect}
              onSubmitGuestForm={handleGuestFormSubmit}
              loading={loading}
              navigate={navigate}
            />
          )}

          {(!isGuest || guestFormSubmitted) && (
            <>
              {/* Step indicator */}
              <div className="grid grid-cols-3 gap-2 mb-8 border-b border-border pb-4">
                {[
                  { step: 1, label: "1. Shipping & Delivery" },
                  { step: 2, label: "2. Payment & Billing" },
                  { step: 3, label: "3. Order Review" },
                ].map((s) => (
                  <button
                    key={s.step}
                    onClick={() => handleNextStep(s.step)}
                    className={`py-2 text-left text-xs uppercase tracking-[0.08em] font-semibold transition-all border-b-2 ${
                      currentStep >= s.step
                        ? 'border-Primarycolor text-Primarycolor'
                        : 'border-transparent text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {missingFieldsSummary.length > 0 && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-sm text-amber-800 text-xs">
                  <p className="font-semibold uppercase tracking-wider mb-1">Required Information Missing:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {missingFieldsSummary.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
                {/* Form Steps Column */}
                <div className="lg:col-span-7 space-y-8">
                  {/* Step 1: Shipping */}
                  <div className={currentStep === 1 ? "block space-y-6" : "hidden"}>
                    <div className="bg-Secondarycolor border border-border rounded-sm p-6 space-y-4">
                      <h2 className="text-base font-semibold uppercase tracking-[0.08em] text-Primarycolor pb-3 border-b border-border">
                        Shipping Address
                      </h2>

                      {shippingAddresses.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-3">
                            {shippingAddresses.map((addr) => {
                              const isSelected = String(addr.id) === String(shippingAddressId);
                              return (
                                <div
                                  key={addr.id}
                                  onClick={() => setShippingAddressId(String(addr.id))}
                                  className={`p-4 border rounded-sm cursor-pointer transition-all duration-200 ${
                                    isSelected
                                      ? 'border-Primarycolor bg-surface ring-1 ring-Primarycolor'
                                      : 'border-border hover:border-text-tertiary'
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="font-semibold text-xs text-Primarycolor uppercase tracking-wider mb-1">
                                        {addr.title || 'Address'}
                                      </p>
                                      <p className="text-xs text-text-secondary">{addr.address_line_1}</p>
                                      <p className="text-xs text-text-tertiary">{addr.city}, {addr.state} {addr.zip_code}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleEditAddress('addresses', addr); }}
                                        className="p-1 hover:text-Primarycolor text-text-tertiary transition-colors"
                                      >
                                        <PencilSimple size={16} />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteAddress('addresses', addr.id); }}
                                        className="p-1 hover:text-rose-600 text-text-tertiary transition-colors"
                                      >
                                        <Trash size={16} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center">
                          <p className="text-xs text-text-tertiary mb-4">No shipping address recorded yet.</p>
                        </div>
                      )}

                      {!showShippingForm && (
                        <button
                          onClick={() => { setEditingShippingAddress(null); setShowShippingForm(true); }}
                          className="btn btn-secondary btn-sm w-full flex items-center justify-center gap-2"
                        >
                          <Plus size={14} />
                          Add new shipping address
                        </button>
                      )}

                      {showShippingForm && (
                        <React.Suspense fallback={<div className="animate-spin w-5 h-5 border-2 border-Primarycolor border-t-transparent rounded-full mx-auto" />}>
                          <ShippingAddressForm
                            address={{ state: shippingForm, setState: setShippingForm }}
                            onSubmit={handleShippingSubmit}
                            onCancel={() => setShowShippingForm(false)}
                            formErrors={formErrors}
                            setFormErrors={setFormErrors}
                            actionLoading={shippingAddressLoading}
                            isGuest={isGuest}
                          />
                        </React.Suspense>
                      )}
                    </div>

                    {/* Delivery Methods */}
                    <div className="bg-Secondarycolor border border-border rounded-sm p-6 space-y-4">
                      <h2 className="text-base font-semibold uppercase tracking-[0.08em] text-Primarycolor pb-3 border-b border-border">
                        Delivery Method
                      </h2>
                      {isNigeria ? (
                        <div className="space-y-3">
                          {shippingOptions.map((option) => (
                            <label
                              key={option.id}
                              className={`flex items-start gap-4 p-4 border rounded-sm cursor-pointer transition-all ${
                                shippingMethod?.id === option.id
                                  ? 'border-Primarycolor bg-surface ring-1 ring-Primarycolor'
                                  : 'border-border hover:border-text-tertiary'
                              }`}
                            >
                              <input
                                type="radio"
                                name="shippingMethod"
                                checked={shippingMethod?.id === option.id}
                                onChange={() => setShippingMethod(option)}
                                className="mt-1 accent-Primarycolor"
                              />
                              <div className="flex-1 flex justify-between items-start text-xs">
                                <div>
                                  <p className="font-semibold text-Primarycolor">{option.method}</p>
                                  <p className="text-text-tertiary mt-0.5">{option.estimated_delivery}</p>
                                </div>
                                <span className="font-semibold text-Primarycolor tabular-nums">
                                  ₦{option.total_cost.toLocaleString()}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-text-secondary">International delivery quotes calculated post-order.</p>
                      )}
                    </div>

                    {/* Special Instructions */}
                    <div className="bg-Secondarycolor border border-border rounded-sm p-6 space-y-3">
                      <h2 className="text-base font-semibold uppercase tracking-[0.08em] text-Primarycolor pb-2">
                        Special Instructions (Optional)
                      </h2>
                      <textarea
                        value={orderNote}
                        onChange={handleOrderNoteChange}
                        maxLength={500}
                        rows={3}
                        placeholder="Add delivery instructions or packaging notes..."
                        className="input-field text-xs resize-none"
                      />
                    </div>
                  </div>

                  {/* Step 2: Payment & Billing */}
                  <div className={currentStep === 2 ? "block space-y-6" : "hidden"}>
                    <div className="bg-Secondarycolor border border-border rounded-sm p-6 space-y-4">
                      <h2 className="text-base font-semibold uppercase tracking-[0.08em] text-Primarycolor pb-3 border-b border-border">
                        Billing Address
                      </h2>
                      <div className="flex items-center gap-6 text-xs text-text-secondary py-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="billingOption"
                            value="same"
                            checked={billingAddressOption === 'same'}
                            onChange={() => setBillingAddressOption('same')}
                            className="accent-Primarycolor"
                          />
                          <span>Same as shipping address</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="billingOption"
                            value="different"
                            checked={billingAddressOption === 'different'}
                            onChange={() => setBillingAddressOption('different')}
                            className="accent-Primarycolor"
                          />
                          <span>Use a different billing address</span>
                        </label>
                      </div>

                      {billingAddressOption === 'different' && showBillingForm && (
                        <React.Suspense fallback={<div className="animate-spin w-5 h-5 border-2 border-Primarycolor border-t-transparent rounded-full mx-auto" />}>
                          <BillingAddressForm
                            address={{ state: billingForm, setState: setBillingForm }}
                            onSubmit={handleBillingSubmit}
                            onCancel={() => setShowBillingForm(false)}
                            formErrors={formErrors}
                            setFormErrors={setFormErrors}
                            actionLoading={billingAddressLoading}
                            isGuest={isGuest}
                          />
                        </React.Suspense>
                      )}
                    </div>
                  </div>

                  {/* Step Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    {currentStep > 1 && (
                      <button
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="btn btn-secondary btn-sm"
                      >
                        Previous Step
                      </button>
                    )}
                    {currentStep < 2 && (
                      <button
                        onClick={() => handleNextStep(currentStep + 1)}
                        className="btn btn-primary btn-sm ml-auto"
                      >
                        Continue to Next Step
                      </button>
                    )}
                  </div>
                </div>

                {/* Order Summary Column */}
                <div className="lg:col-span-5">
                  <OrderSummary
                    cart={cart}
                    displaySubtotal={displaySubtotal}
                    displayFirstOrderDiscount={displayFirstOrderDiscount}
                    displayCouponDiscount={displayCouponDiscount}
                    displayTax={displayTax}
                    displayTotal={displayTotal}
                    shippingMethod={shippingMethod}
                    isNigeria={isNigeria}
                    setCouponDiscount={setCouponDiscount}
                    appliedCoupon={appliedCoupon}
                    paymentMethod={paymentMethod}
                    handlePlaceOrder={handlePlaceOrder}
                    isProcessing={isProcessing}
                    loading={loading}
                    shippingForm={shippingForm}
                    shippingAddressId={shippingAddressId}
                    billingForm={billingForm}
                    billingAddressId={billingAddressId}
                    isGuest={isGuest}
                    createdUserId={createdUserId}
                    guestFormSubmitted={guestFormSubmitted}
                    requiredForm={requiredForm}
                    billingAddressOption={billingAddressOption}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutPage;