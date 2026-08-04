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
  Package,
  House,
  Check
} from '@phosphor-icons/react';
import Navbar2 from '../components/Navbar2';
import Footer from '../components/Footer';
import OrderSummary from '../components/checkout/OrderSummary';
const BillingAddressForm = React.lazy(() => import('../components/BillingAddressForm'));
const ShippingAddressForm = React.lazy(() => import('../components/ShippingAddressForm'));
import { useAuth } from '../context/AuthContext';
import { useUserManager } from '../hooks/useUserManager';
import { CurrencyContext } from './CurrencyContext';
import { countries } from '../utils/countries';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import PaystackPop from '@paystack/inline-js';
import SEO from '../components/SEO';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { CheckoutSkeleton } from '../components/skeletons';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}`.replace(/\/api$/, '')
  : 'https://prechi-ecommerce.onrender.com';
const WHATSAPP_NUMBER = '2349016420903';

const CheckoutPage = () => {
  const { user: authUser, loading: authLoading } = useAuth();
  const { user: hookUser } = useUserManager();
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
  const [shippingMethod, setShippingMethod] = useState({
    id: 1,
    method: 'Delivery within Lagos Island',
    total_cost: 4000,
    estimated_delivery: '3–5 business days',
    icon: 'truck',
    description: 'Fast delivery within Lagos Island'
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderNote, setOrderNote] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [guestFormErrors, setGuestFormErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shippingAddressLoading, setShippingAddressLoading] = useState(false);
  const [billingAddressLoading, setBillingAddressLoading] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [editingShippingAddress, setEditingShippingAddress] = useState(null);
  const [editingBillingAddress, setEditingBillingAddress] = useState(null);

  const [shippingForm, setShippingForm] = useState({
    title: 'Home',
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
  const [appliedCoupon, setAppliedCoupon] = useState(null);

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
  const [requiredForm, setRequiredForm] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [missingFieldsSummary, setMissingFieldsSummary] = useState([]);
  const [idempotencyKey] = useState(() => uuidv4());

  const shippingOptions = [
    {
      id: 1,
      method: 'Delivery within Lagos Island',
      total_cost: 4000,
      estimated_delivery: '3–5 business days',
      icon: 'truck',
      description: 'Fast delivery within Lagos Island'
    },
    {
      id: 2,
      method: 'Delivery within Lagos Mainland',
      total_cost: 6000,
      estimated_delivery: '5–7 business days',
      icon: 'package',
      description: 'Reliable delivery within Lagos Mainland'
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

  // Dynamically determine the active shipping country from selected address or inline shippingForm
  const activeShippingAddress = useMemo(() => {
    if (shippingAddresses.length > 0 && shippingAddressId) {
      return shippingAddresses.find(a => String(a.id) === String(shippingAddressId)) || null;
    }
    return null;
  }, [shippingAddresses, shippingAddressId]);

  const activeShippingCountry = useMemo(() => {
    return activeShippingAddress?.country || shippingForm?.country || country || 'Nigeria';
  }, [activeShippingAddress, shippingForm?.country, country]);

  // Is country Nigeria?
  const isNigeria = useMemo(() => {
    return activeShippingCountry?.trim().toLowerCase() === 'nigeria';
  }, [activeShippingCountry]);

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

  const handleLoginRedirect = useCallback(() => {
    navigate('/login', { state: { from: '/checkout' } });
  }, [navigate]);

  const handleGuestFormChange = useCallback((field, value) => {
    setGuestForm(prev => ({ ...prev, [field]: value }));
    setGuestFormErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const handleShippingFormChange = useCallback((field, value) => {
    setShippingForm(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const handleBillingFormChange = useCallback((field, value) => {
    setBillingForm(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [`billing_${field}`]: '' }));
  }, []);

  const handleOrderNoteChange = useCallback((e) => {
    setOrderNote(e.target.value);
  }, []);

  const validateGuestForm = useCallback(() => {
    const errors = {};
    if (!guestForm.name || !guestForm.name.trim()) errors.name = 'Please enter your full name';
    if (!guestForm.email || !guestForm.email.trim()) errors.email = 'Please enter your email address';
    else if (!/\S+@\S+\.\S+/.test(guestForm.email)) errors.email = 'Please enter a valid email';
    if (!guestForm.phone_number || !guestForm.phone_number.trim()) errors.phone_number = 'Please enter your phone number';

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
      return false;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/create-temp-user`, {
        name: guestForm.name,
        email: guestForm.email,
        phone_number: guestForm.phone_number
      });

      const { user } = response.data;
      const userId = user.id;

      setCreatedUserId(userId);
      setGuestFormSubmitted(true);
      localStorage.setItem('prechi_guest_info', JSON.stringify(guestForm));
      localStorage.setItem('prechi_guest_id', userId);

      setShippingForm(prev => ({
        ...prev,
        phone_number: guestForm.phone_number
      }));

      setBillingForm(prev => ({
        ...prev,
        full_name: guestForm.name,
        email: guestForm.email,
        phone_number: guestForm.phone_number,
      }));

      return userId;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to create guest account';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [guestForm, validateGuestForm]);

  // Comprehensive field validation directing users to missing fields
  const validateCheckoutFields = useCallback(() => {
    const errors = {};
    const missing = [];
    let firstMissingId = null;

    // 1. Guest contact validation
    if (isGuest) {
      if (!guestForm.name || !guestForm.name.trim()) {
        errors.guest_name = 'Full name is required';
        missing.push('Full Name (Contact Info)');
        if (!firstMissingId) firstMissingId = 'input-guest-name';
      }
      if (!guestForm.phone_number || !guestForm.phone_number.trim()) {
        errors.guest_phone = 'Phone number is required';
        missing.push('Phone Number (Contact Info)');
        if (!firstMissingId) firstMissingId = 'input-guest-phone';
      }
      if (!guestForm.email || !guestForm.email.trim()) {
        errors.guest_email = 'Email address is required';
        missing.push('Email Address (Contact Info)');
        if (!firstMissingId) firstMissingId = 'input-guest-email';
      } else if (!/\S+@\S+\.\S+/.test(guestForm.email)) {
        errors.guest_email = 'Valid email address is required';
        missing.push('Valid Email Address');
        if (!firstMissingId) firstMissingId = 'input-guest-email';
      }
    }

    // 2. Shipping Address validation
    const hasSavedAddress = isAuthenticated() && shippingAddresses.length > 0 && shippingAddressId;
    if (!hasSavedAddress) {
      if (!shippingForm.address_line_1 || !shippingForm.address_line_1.trim()) {
        errors.address_line_1 = 'Street address is required';
        missing.push('Street Address (Shipping)');
        if (!firstMissingId) firstMissingId = 'input-shipping-address-1';
      }
      if (!shippingForm.city || !shippingForm.city.trim()) {
        errors.city = 'City is required';
        missing.push('City (Shipping)');
        if (!firstMissingId) firstMissingId = 'input-shipping-city';
      }
      if (!shippingForm.state || !shippingForm.state.trim()) {
        errors.state = 'State is required';
        missing.push('State (Shipping)');
        if (!firstMissingId) firstMissingId = 'input-shipping-state';
      }
      if (!shippingForm.country || !shippingForm.country.trim()) {
        errors.country = 'Country is required';
        missing.push('Country (Shipping)');
        if (!firstMissingId) firstMissingId = 'input-shipping-country';
      }
      // ZIP Code is only required if shipping country is NOT Nigeria
      if (!isNigeria && (!shippingForm.zip_code || !shippingForm.zip_code.trim())) {
        errors.zip_code = 'ZIP / Postal code is required for international delivery';
        missing.push('ZIP / Postal Code');
        if (!firstMissingId) firstMissingId = 'input-shipping-zip';
      }
    }

    // 3. Delivery Method validation (ONLY required for Nigeria)
    if (isNigeria && !shippingMethod) {
      errors.shippingMethod = 'Please select a delivery method';
      missing.push('Delivery Method');
      if (!firstMissingId) firstMissingId = 'section-delivery-method';
    }

    // 4. Billing Address validation
    if (billingAddressOption === 'different') {
      const hasSavedBilling = isAuthenticated() && billingAddresses.length > 0 && billingAddressId;
      if (!hasSavedBilling) {
        if (!billingForm.address_line_1 || !billingForm.address_line_1.trim()) {
          errors.billing_address_line_1 = 'Billing street address is required';
          missing.push('Billing Street Address');
          if (!firstMissingId) firstMissingId = 'input-billing-address-1';
        }
        if (!billingForm.city || !billingForm.city.trim()) {
          errors.billing_city = 'Billing city is required';
          missing.push('Billing City');
          if (!firstMissingId) firstMissingId = 'input-billing-city';
        }
        if (!billingForm.state || !billingForm.state.trim()) {
          errors.billing_state = 'Billing state is required';
          missing.push('Billing State');
          if (!firstMissingId) firstMissingId = 'input-billing-state';
        }
      }
    }

    if (missing.length > 0) {
      setFormErrors(errors);
      setGuestFormErrors(errors);
      setMissingFieldsSummary(missing);

      toast.error(`Please fill in required field: ${missing[0]}`);

      if (firstMissingId) {
        setTimeout(() => {
          const el = document.getElementById(firstMissingId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (el.focus && typeof el.focus === 'function') el.focus();
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 100);
      }
      return false;
    }

    setFormErrors({});
    setGuestFormErrors({});
    setMissingFieldsSummary([]);
    return true;
  }, [isGuest, guestForm, isAuthenticated, shippingAddresses, shippingAddressId, shippingForm, isNigeria, shippingMethod, billingAddressOption, billingAddresses, billingAddressId, billingForm]);

  const generateOrderReference = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const processOrder = useCallback(async (guestUserId = null) => {
    const userId = guestUserId || createdUserId || getUserId();

    if (!cart?.items?.length) {
      setError('Your shopping bag is empty');
      toast.error('Your shopping bag is empty');
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
      const baseShippingCost = isNigeria ? (shippingMethod?.total_cost || 0) : 0;
      const baseDiscountedSubtotal = Number((baseSubtotal - baseFinalDiscount).toFixed(2));
      const baseTotal = Number((baseDiscountedSubtotal + baseTax + baseShippingCost).toFixed(2));

      const orderData = {
        user_id: userId,
        shipping_data: (!isAuthenticated() || !shippingAddressId) ? shippingForm : null,
        billing_data: (!isAuthenticated() || !shippingAddressId || billingAddressOption !== 'same')
          ? (billingAddressOption === 'same'
            ? {
              ...shippingForm,
              full_name: guestForm.name || billingForm.full_name || (user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email) || 'Valued Customer',
              email: guestForm.email || billingForm.email || user?.email || '',
              phone_number: guestForm.phone_number || shippingForm.phone_number || '',
            }
            : {
              ...billingForm,
              full_name: billingForm.full_name || guestForm.name || (user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email) || 'Valued Customer',
              email: billingForm.email || guestForm.email || user?.email || '',
              phone_number: billingForm.phone_number || guestForm.phone_number || shippingForm.phone_number || '',
            })
          : null,
        address_id: (isAuthenticated() && shippingAddressId) ? parseInt(shippingAddressId) : null,
        billing_address_id: (isAuthenticated() && billingAddressId && billingAddressOption !== 'same')
          ? parseInt(billingAddressId)
          : (isAuthenticated() && shippingAddressId && billingAddressOption === 'same')
            ? parseInt(shippingAddressId)
            : null,
        cart_id: isAuthenticated() ? cart.cartId : null,
        total: baseTotal,
        discount: baseFinalDiscount,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        delivery_option: isNigeria ? 'standard' : 'international',
        shipping_method_id: isNigeria ? shippingMethod?.id : null,
        shipping_cost: baseShippingCost,
        shipping_country: activeShippingCountry,
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
          const cartItemSizeName = item.size_name || item.item?.size_name || item.item?.size || item.size || null;

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
            color_name: item.item?.color || item.item?.variant?.color_name || item.color_name || null,
            size_name: cartItemSizeName,
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

      toast.success('Order initiated!');
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
            toast.success('Payment completed! Verifying order...');
            navigate(`/thank-you?reference=${paymentData.reference}&orderId=${orderId}`);
          },
          onClose: () => {
            toast.info('Payment window closed. You can complete your payment when ready.');
            setLoading(false);
            setIsProcessing(false);
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
  }, [createdUserId, getUserId, isAuthenticated, shippingAddressId, shippingAddresses.length, shippingForm, billingAddressOption, billingAddressId, billingAddresses.length, billingForm, isNigeria, shippingMethod, activeShippingCountry, cart, firstOrderDiscount, couponDiscount, paymentMethod, guestForm, appliedCoupon, orderNote, idempotencyKey, user, navigate]);

  const handlePlaceOrder = useCallback(async () => {
    if (isProcessing) return;

    if (!validateCheckoutFields()) {
      return;
    }

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
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  }, [isProcessing, validateCheckoutFields, isGuest, guestFormSubmitted, handleGuestFormSubmit, processOrder]);

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
          setLoading(false);
          return;
        } catch (err) {}
      }
      setCart({ cartId: null, subtotal: 0, tax: 0, total: 0, items: [] });
      setIsGuest(true);
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
        if (shippingData.length > 0) {
          setShippingAddressId(String(shippingData[0].id));
          setShippingForm(prev => ({
            ...prev,
            ...shippingData[0]
          }));
        }
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

  if (authLoading || contextLoading || loading) {
    return <CheckoutSkeleton />;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-Secondarycolor font-display">
      <SEO title="Checkout | Prechi" description="Complete your purchase securely on Prechi." />
      <Navbar2 />

      <main className="flex-1 pt-24 pb-20">
        <div className="section-container">
          <Link to="/cart" className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-Primarycolor transition-colors uppercase tracking-[0.08em] mb-6 font-medium">
            <CaretLeft size={14} weight="bold" /> Return to shopping bag
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-semibold text-Primarycolor tracking-tight">Checkout</h1>
              <p className="text-xs text-text-tertiary mt-1">Provide your delivery details below to complete order</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-secondary bg-surface px-3 py-1.5 border border-border rounded-sm">
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

          {/* Missing fields notification summary banner */}
          {missingFieldsSummary.length > 0 && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-sm text-amber-900 text-xs shadow-xs">
              <div className="flex items-center gap-2 font-semibold uppercase tracking-wider text-amber-800 mb-1">
                <WarningCircle size={16} className="text-amber-600" />
                Required Information Missing:
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-amber-800">
                {missingFieldsSummary.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Form Steps Column */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Section 1: Contact Information (for Guests) */}
              {isGuest ? (
                <div id="section-contact-info" className="bg-Secondarycolor border border-border rounded-sm p-5 sm:p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold uppercase tracking-[0.08em] text-Primarycolor flex items-center gap-2">
                        <span>1.</span> Contact Information
                      </h2>
                      <p className="text-xs text-text-tertiary mt-0.5">Quick order checkout without creating an account</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLoginRedirect}
                      className="text-xs text-Primarycolor hover:underline font-medium"
                    >
                      Log in
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                        Full Name *
                      </label>
                      <Input
                        id="input-guest-name"
                        type="text"
                        value={guestForm.name}
                        onChange={(e) => handleGuestFormChange('name', e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className={guestFormErrors.name || guestFormErrors.guest_name ? 'border-rose-500 bg-rose-50/20' : ''}
                      />
                      {(guestFormErrors.name || guestFormErrors.guest_name) && (
                        <p className="text-[11px] text-rose-600 mt-1">{guestFormErrors.name || guestFormErrors.guest_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                        Phone Number *
                      </label>
                      <Input
                        id="input-guest-phone"
                        type="tel"
                        value={guestForm.phone_number}
                        onChange={(e) => handleGuestFormChange('phone_number', e.target.value)}
                        placeholder="+234 800 000 0000"
                        className={guestFormErrors.phone_number || guestFormErrors.guest_phone ? 'border-rose-500 bg-rose-50/20' : ''}
                      />
                      {(guestFormErrors.phone_number || guestFormErrors.guest_phone) && (
                        <p className="text-[11px] text-rose-600 mt-1">{guestFormErrors.phone_number || guestFormErrors.guest_phone}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                        Email Address *
                      </label>
                      <Input
                        id="input-guest-email"
                        type="email"
                        value={guestForm.email}
                        onChange={(e) => handleGuestFormChange('email', e.target.value)}
                        placeholder="alex@example.com"
                        className={guestFormErrors.email || guestFormErrors.guest_email ? 'border-rose-500 bg-rose-50/20' : ''}
                      />
                      {(guestFormErrors.email || guestFormErrors.guest_email) && (
                        <p className="text-[11px] text-rose-600 mt-1">{guestFormErrors.email || guestFormErrors.guest_email}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-Secondarycolor border border-border rounded-sm p-4 sm:p-5 flex items-center justify-between">
                  <div className="text-xs">
                    <p className="font-semibold text-Primarycolor">Signed in as {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}</p>
                    <p className="text-text-tertiary">{user?.email}</p>
                  </div>
                  <CheckCircle size={18} className="text-emerald-600" />
                </div>
              )}

              {/* Section 2: Shipping Address */}
              <div id="section-shipping-address" className="bg-Secondarycolor border border-border rounded-sm p-5 sm:p-6 space-y-4 shadow-xs">
                <h2 className="text-sm sm:text-base font-semibold uppercase tracking-[0.08em] text-Primarycolor pb-3 border-b border-border flex items-center gap-2">
                  <span>{isGuest ? '2.' : '1.'}</span> Shipping Address
                </h2>

                {/* Logged in users with saved addresses */}
                {isAuthenticated() && shippingAddresses.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      {shippingAddresses.map((addr) => {
                        const isSelected = String(addr.id) === String(shippingAddressId);
                        return (
                          <div
                            key={addr.id}
                            onClick={() => {
                              setShippingAddressId(String(addr.id));
                              setShippingForm(prev => ({ ...prev, ...addr }));
                            }}
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
                                <p className="text-xs text-text-tertiary">
                                  {addr.city}, {addr.state} {addr.country?.toLowerCase() !== 'nigeria' ? addr.zip_code : ''} ({addr.country})
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => { e.stopPropagation(); handleEditAddress('addresses', addr); }}
                                  className="h-8 w-8 text-text-tertiary hover:text-Primarycolor"
                                >
                                  <PencilSimple size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteAddress('addresses', addr.id); }}
                                  className="h-8 w-8 text-text-tertiary hover:text-rose-600"
                                >
                                  <Trash size={16} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!showShippingForm && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => { setEditingShippingAddress(null); setShowShippingForm(true); }}
                        className="w-full flex items-center justify-center gap-2 text-xs"
                      >
                        <Plus size={14} />
                        Add new shipping address
                      </Button>
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
                ) : (
                  /* Inline shipping form for guests or users without saved addresses */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                        Street Address *
                      </label>
                      <Input
                        id="input-shipping-address-1"
                        type="text"
                        value={shippingForm.address_line_1}
                        onChange={(e) => handleShippingFormChange('address_line_1', e.target.value)}
                        placeholder="Street address, house or apartment number"
                        className={formErrors.address_line_1 ? 'border-rose-500 bg-rose-50/20' : ''}
                      />
                      {formErrors.address_line_1 && (
                        <p className="text-[11px] text-rose-600 mt-1">{formErrors.address_line_1}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                        Landmark / Nearest Bus Stop (Optional)
                      </label>
                      <Input
                        id="input-shipping-landmark"
                        type="text"
                        value={shippingForm.landmark}
                        onChange={(e) => handleShippingFormChange('landmark', e.target.value)}
                        placeholder="e.g. Near Chevron Toll Gate"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                          City *
                        </label>
                        <Input
                          id="input-shipping-city"
                          type="text"
                          value={shippingForm.city}
                          onChange={(e) => handleShippingFormChange('city', e.target.value)}
                          placeholder="City / Town"
                          className={formErrors.city ? 'border-rose-500 bg-rose-50/20' : ''}
                        />
                        {formErrors.city && (
                          <p className="text-[11px] text-rose-600 mt-1">{formErrors.city}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                          State *
                        </label>
                        <Input
                          id="input-shipping-state"
                          type="text"
                          value={shippingForm.state}
                          onChange={(e) => handleShippingFormChange('state', e.target.value)}
                          placeholder="State / Region"
                          className={formErrors.state ? 'border-rose-500 bg-rose-50/20' : ''}
                        />
                        {formErrors.state && (
                          <p className="text-[11px] text-rose-600 mt-1">{formErrors.state}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Country Selector */}
                      <div className={isNigeria ? 'sm:col-span-2' : ''}>
                        <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                          Country *
                        </label>
                        <select
                          id="input-shipping-country"
                          value={shippingForm.country}
                          onChange={(e) => handleShippingFormChange('country', e.target.value)}
                          className={`w-full p-2.5 bg-surface border rounded-sm text-xs text-Primarycolor transition-all focus:outline-none focus:ring-1 focus:ring-Primarycolor ${
                            formErrors.country ? 'border-rose-500' : 'border-border'
                          }`}
                        >
                          {countries.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        {formErrors.country && (
                          <p className="text-[11px] text-rose-600 mt-1">{formErrors.country}</p>
                        )}
                      </div>

                      {/* ZIP Code (ONLY SHOWN IF COUNTRY IS NOT NIGERIA!) */}
                      {!isNigeria && (
                        <div>
                          <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                            ZIP / Postal Code *
                          </label>
                          <Input
                            id="input-shipping-zip"
                            type="text"
                            value={shippingForm.zip_code}
                            onChange={(e) => handleShippingFormChange('zip_code', e.target.value)}
                            placeholder="ZIP/Postal Code"
                            className={formErrors.zip_code ? 'border-rose-500 bg-rose-50/20' : ''}
                          />
                          {formErrors.zip_code && (
                            <p className="text-[11px] text-rose-600 mt-1">{formErrors.zip_code}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Delivery Method (ONLY SHOWN IF SHIPPING COUNTRY IS NIGERIA!) */}
              <div id="section-delivery-method" className="bg-Secondarycolor border border-border rounded-sm p-5 sm:p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h2 className="text-sm sm:text-base font-semibold uppercase tracking-[0.08em] text-Primarycolor flex items-center gap-2">
                    <span>{isGuest ? '3.' : '2.'}</span> Delivery Method
                  </h2>
                  <span className="text-xs text-text-tertiary">{activeShippingCountry}</span>
                </div>

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
                          onChange={() => {
                            setShippingMethod(option);
                            setFormErrors(prev => ({ ...prev, shippingMethod: '' }));
                          }}
                          className="mt-1 accent-Primarycolor"
                        />
                        <div className="flex-1 flex justify-between items-start text-xs">
                          <div>
                            <p className="font-semibold text-Primarycolor">{option.method}</p>
                            <p className="text-text-tertiary mt-0.5">{option.estimated_delivery}</p>
                          </div>
                          <span className="font-semibold text-Primarycolor tabular-nums text-sm">
                            ₦{option.total_cost.toLocaleString()}
                          </span>
                        </div>
                      </label>
                    ))}
                    {formErrors.shippingMethod && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.shippingMethod}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-surface border border-border rounded-sm flex items-start gap-3">
                    <Package size={20} className="text-Primarycolor flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-semibold text-Primarycolor">International Shipping to {activeShippingCountry}</p>
                      <p className="text-text-tertiary mt-0.5">
                        International delivery fees and custom carrier timelines will be communicated for your address upon order creation. Standard 5% international tax applied.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 4: Billing Address */}
              <div id="section-billing-address" className="bg-Secondarycolor border border-border rounded-sm p-5 sm:p-6 space-y-4 shadow-xs">
                <h2 className="text-sm sm:text-base font-semibold uppercase tracking-[0.08em] text-Primarycolor pb-3 border-b border-border flex items-center gap-2">
                  <span>{isGuest ? '4.' : '3.'}</span> Billing Address
                </h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs text-text-secondary py-1">
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

                {billingAddressOption === 'different' && (
                  <div className="space-y-4 pt-3 border-t border-border">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                        Street Address *
                      </label>
                      <Input
                        id="input-billing-address-1"
                        type="text"
                        value={billingForm.address_line_1}
                        onChange={(e) => handleBillingFormChange('address_line_1', e.target.value)}
                        placeholder="Billing street address"
                        className={formErrors.billing_address_line_1 ? 'border-rose-500 bg-rose-50/20' : ''}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                          City *
                        </label>
                        <Input
                          id="input-billing-city"
                          type="text"
                          value={billingForm.city}
                          onChange={(e) => handleBillingFormChange('city', e.target.value)}
                          placeholder="City"
                          className={formErrors.billing_city ? 'border-rose-500 bg-rose-50/20' : ''}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                          State *
                        </label>
                        <Input
                          id="input-billing-state"
                          type="text"
                          value={billingForm.state}
                          onChange={(e) => handleBillingFormChange('state', e.target.value)}
                          placeholder="State"
                          className={formErrors.billing_state ? 'border-rose-500 bg-rose-50/20' : ''}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className={billingForm.country?.trim().toLowerCase() === 'nigeria' ? 'sm:col-span-2' : ''}>
                        <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                          Country *
                        </label>
                        <select
                          id="input-billing-country"
                          value={billingForm.country}
                          onChange={(e) => handleBillingFormChange('country', e.target.value)}
                          className="w-full p-2.5 bg-surface border border-border rounded-sm text-xs text-Primarycolor focus:outline-none focus:ring-1 focus:ring-Primarycolor"
                        >
                          {countries.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* ZIP Code for Billing (HIDDEN IF BILLING COUNTRY IS NIGERIA) */}
                      {billingForm.country?.trim().toLowerCase() !== 'nigeria' && (
                        <div>
                          <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                            ZIP / Postal Code *
                          </label>
                          <Input
                            id="input-billing-zip"
                            type="text"
                            value={billingForm.zip_code}
                            onChange={(e) => handleBillingFormChange('zip_code', e.target.value)}
                            placeholder="ZIP/Postal code"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 5: Special Instructions (Optional) */}
              <div id="section-special-instructions" className="bg-Secondarycolor border border-border rounded-sm p-5 sm:p-6 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-semibold uppercase tracking-[0.08em] text-Primarycolor">
                    Special Instructions <span className="text-text-tertiary font-normal normal-case text-xs">(Optional)</span>
                  </h2>
                  <span className="text-[11px] text-text-tertiary">{orderNote.length}/500</span>
                </div>
                <textarea
                  id="order-special-instructions"
                  value={orderNote}
                  onChange={handleOrderNoteChange}
                  maxLength={500}
                  rows={3}
                  placeholder="Add delivery instructions or packaging notes..."
                  className="w-full p-3 text-xs bg-surface border border-border rounded-sm text-Primarycolor placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-Primarycolor focus:border-Primarycolor transition-all resize-none"
                />
              </div>

            </div>

            {/* Order Summary Sidebar Column */}
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
                guestForm={guestForm}
                createdUserId={createdUserId}
                guestFormSubmitted={guestFormSubmitted}
                requiredForm={requiredForm}
                billingAddressOption={billingAddressOption}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutPage;