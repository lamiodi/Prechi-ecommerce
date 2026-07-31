import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}`.replace(/\/api$/, '')
  : 'https://prechi-ecommerce.onrender.com';

const CartDrawerContext = createContext({
  isCartOpen: false,
  openCart: () => {},
  closeCart: () => {},
  cart: { items: [], subtotal: 0 },
  fetchCart: () => {},
  addToCart: async () => {},
  removeFromCart: async () => {},
  updateQuantity: async () => {},
});

export const CartDrawerProvider = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  // Helper to decode user ID from JWT
  const getUserId = useCallback(() => {
    const token = user?.token || localStorage.getItem('token');
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(jsonPayload)?.id;
    } catch (e) {
      return null;
    }
  }, [user]);

  const fetchCart = useCallback(async () => {
    const userId = getUserId();
    const token = user?.token || localStorage.getItem('token');

    if (!token || !userId) {
      // Load guest cart
      const guestCartData = localStorage.getItem('guestCart');
      if (guestCartData) {
        try {
          const parsed = JSON.parse(guestCartData);
          setCart(parsed);
          return;
        } catch (e) {}
      }
      setCart({ items: [], subtotal: 0 });
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/cart/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.data || res.data;
      setCart(data || { items: [], subtotal: 0 });
    } catch (err) {
      // Fallback guest cart
      const guestCartData = localStorage.getItem('guestCart');
      if (guestCartData) {
        try {
          setCart(JSON.parse(guestCartData));
        } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  }, [getUserId, user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const saveGuestCart = (updatedCart) => {
    localStorage.setItem('guestCart', JSON.stringify(updatedCart));
    setCart(updatedCart);
  };

  const addToCart = async (productPayload) => {
    const userId = getUserId();
    const token = user?.token || localStorage.getItem('token');

    try {
      if (!token || !userId) {
        // Handle guest cart add
        const currentItems = [...(cart.items || [])];
        const existingIndex = currentItems.findIndex(i =>
          i.variant_id === productPayload.variant_id && i.size_id === productPayload.size_id
        );

        if (existingIndex > -1) {
          currentItems[existingIndex].quantity += (productPayload.quantity || 1);
        } else {
          currentItems.push({
            id: `guest_${Date.now()}_${Math.random()}`,
            quantity: productPayload.quantity || 1,
            variant_id: productPayload.variant_id,
            size_id: productPayload.size_id,
            item: productPayload.itemDetails || {
              name: productPayload.name || 'Product',
              price: productPayload.price || 0,
              image: productPayload.image || '/images/placeholder.jpg',
              color: productPayload.color || '',
              size: productPayload.size || '',
              is_product: true
            }
          });
        }

        const subtotal = currentItems.reduce((acc, curr) => acc + (curr.quantity * (curr.item?.price || 0)), 0);
        saveGuestCart({ items: currentItems, subtotal });
      } else {
        // Backend API add
        await axios.post(`${API_BASE_URL}/api/cart`, {
          user_id: userId,
          product_type: productPayload.product_type || 'single',
          variant_id: productPayload.variant_id,
          size_id: productPayload.size_id,
          quantity: productPayload.quantity || 1,
          bundle_id: productPayload.bundle_id,
          items: productPayload.items
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchCart();
      }

      toast.success('Added to bag');
      openCart();
    } catch (err) {
      toast.error('Failed to add item to bag');
    }
  };

  const removeFromCart = async (itemId) => {
    const userId = getUserId();
    const token = user?.token || localStorage.getItem('token');

    if (!token || !userId) {
      const remaining = (cart.items || []).filter(i => i.id !== itemId);
      const subtotal = remaining.reduce((acc, curr) => acc + (curr.quantity * (curr.item?.price || 0)), 0);
      saveGuestCart({ items: remaining, subtotal });
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/cart/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCart();
    } catch (err) {
      toast.error('Could not remove item');
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    const userId = getUserId();
    const token = user?.token || localStorage.getItem('token');

    if (!token || !userId) {
      const updated = (cart.items || []).map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i);
      const subtotal = updated.reduce((acc, curr) => acc + (curr.quantity * (curr.item?.price || 0)), 0);
      saveGuestCart({ items: updated, subtotal });
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/api/cart/${itemId}`, { quantity: newQuantity }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCart();
    } catch (err) {
      toast.error('Could not update quantity');
    }
  };

  return (
    <CartDrawerContext.Provider value={{
      isCartOpen,
      openCart,
      closeCart,
      cart,
      fetchCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      loading
    }}>
      {children}
    </CartDrawerContext.Provider>
  );
};

export const useCartDrawer = () => useContext(CartDrawerContext);
