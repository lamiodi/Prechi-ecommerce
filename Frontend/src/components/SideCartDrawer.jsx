import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash, Plus, Minus, ShoppingBag, ArrowRight, Sparkle } from '@phosphor-icons/react';
import { useCartDrawer } from '../context/CartDrawerContext';
import { CurrencyContext } from '../pages/CurrencyContext';
import { Button } from './ui/button';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}`.replace(/\/api$/, '')
  : 'https://prechi-ecommerce.onrender.com';

const SideCartDrawer = () => {
  const { isCartOpen, closeCart, cart, removeFromCart, updateQuantity, addToCart } = useCartDrawer();
  const [recommendations, setRecommendations] = useState([]);
  const [addingId, setAddingId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close cart drawer automatically on route changes
  useEffect(() => {
    if (isCartOpen) {
      closeCart();
    }
  }, [location.pathname]);

  const currencyContext = useContext(CurrencyContext) || {
    currency: 'NGN',
    exchangeRate: 1,
    country: 'Nigeria',
    contextLoading: false,
  };
  const { currency = 'NGN', exchangeRate = 1 } = currencyContext;

  const formatPrice = (valInNGN) => {
    const num = Number(valInNGN) || 0;
    if (currency === 'USD') {
      return `$${(num * exchangeRate).toFixed(2)}`;
    }
    return `₦${Math.round(num).toLocaleString()}`;
  };

  // Lock body scroll and handle Escape key when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeCart();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isCartOpen, closeCart]);

  // Fetch quick recommendation suggestions
  useEffect(() => {
    if (isCartOpen && recommendations.length === 0) {
      axios.get(`${API_BASE_URL}/api/shopall?limit=4`)
        .then(res => {
          const prods = res.data?.products || res.data || [];
          if (Array.isArray(prods)) setRecommendations(prods.slice(0, 4));
        })
        .catch(() => {});
    }
  }, [isCartOpen, recommendations.length]);

  const items = cart.items || [];
  const subtotal = Number(cart.subtotal) || items.reduce((acc, curr) => acc + (curr.quantity * (Number(curr.item?.price) || Number(curr.price) || 0)), 0);
  const freeShippingThresholdNGN = 50000;
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThresholdNGN) * 100));

  const handleCheckoutClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeCart();
    navigate('/checkout');
  };

  const handleViewCartClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeCart();
    navigate('/cart');
  };

  const handleQuickAdd = async (prod) => {
    setAddingId(prod.id);
    const firstVariant = prod.variants?.[0] || prod.variant;
    const firstSize = firstVariant?.sizes?.[0] || prod.sizes?.[0];

    await addToCart({
      variant_id: firstVariant?.variant_id || firstVariant?.id || prod.id,
      size_id: firstSize?.size_id || firstSize?.id || null,
      quantity: 1,
      name: prod.name,
      price: prod.price,
      image: prod.images?.[0] || prod.image || '/images/placeholder.jpg',
      color: firstVariant?.color_name || '',
      size: firstSize?.size_name || ''
    });

    setAddingId(null);
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end font-display">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closeCart();
            }}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm cursor-pointer z-[100]"
            aria-hidden="true"
          />

          {/* Slide-over panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.8 }}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping Bag"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-full sm:max-w-md bg-Secondarycolor h-[100dvh] shadow-2xl flex flex-col z-[101] border-l border-border overscroll-contain"
          >
            {/* Top Header */}
            <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-border flex items-center justify-between bg-surface flex-shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} weight="light" className="text-Primarycolor" />
                <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] text-Primarycolor">
                  Shopping Bag ({items.reduce((acc, curr) => acc + (curr.quantity || 1), 0)})
                </h2>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeCart();
                }}
                className="h-10 w-10 -mr-2 flex items-center justify-center text-text-tertiary hover:text-Primarycolor hover:bg-black/5 active:scale-95 transition-all rounded-full cursor-pointer"
                aria-label="Close cart drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Free Shipping Progress Indicator */}
            <div className="bg-Primarycolor text-white px-4 py-2.5 sm:px-6 sm:py-3 text-xs flex flex-col gap-1.5 flex-shrink-0">
              <div className="flex items-center justify-between text-[0.6875rem] uppercase tracking-wider font-medium">
                <span>
                  {subtotal >= freeShippingThresholdNGN
                    ? '🎉 You unlocked free delivery!'
                    : `Add ${formatPrice(freeShippingThresholdNGN - subtotal)} more for free delivery`}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 overscroll-contain">
              {items.length === 0 ? (
                <div className="py-16 sm:py-20 text-center space-y-4">
                  <ShoppingBag size={44} weight="thin" className="mx-auto text-text-tertiary" />
                  <p className="text-xs uppercase tracking-wider text-text-tertiary font-medium">
                    Your shopping bag is currently empty
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => { closeCart(); navigate('/shop'); }}
                    className="mt-2 text-xs"
                  >
                    Discover Collection
                  </Button>
                </div>
              ) : (
                items.map((cartItem) => {
                  const item = cartItem.item || {};
                  const price = Number(item.price || cartItem.price || 0);
                  const itemTotal = price * (cartItem.quantity || 1);

                  let displayImage = item.image || item.image_url || '/images/placeholder.jpg';
                  if (typeof displayImage === 'object') {
                    displayImage = displayImage?.image_url || displayImage?.url || '/images/placeholder.jpg';
                  }

                  return (
                    <div key={cartItem.id} className="flex gap-3 sm:gap-4 p-3 bg-surface border border-border rounded-sm relative group">
                      <div className="w-16 h-20 sm:w-20 sm:h-24 bg-Secondarycolor rounded-sm overflow-hidden flex-shrink-0 border border-border">
                        <img
                          src={displayImage}
                          alt={item.name || 'Product'}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = '/images/placeholder.jpg'; }}
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-xs font-semibold text-Primarycolor truncate">
                              {item.name || 'Unknown Item'}
                            </h4>
                            <button
                              onClick={() => removeFromCart(cartItem.id)}
                              className="text-text-tertiary hover:text-rose-600 active:scale-90 transition-all p-1 flex-shrink-0"
                              aria-label="Remove item"
                            >
                              <Trash size={15} />
                            </button>
                          </div>
                          {(item.color || item.size) && (
                            <p className="text-[0.6875rem] text-text-tertiary mt-0.5 capitalize">
                              {item.color} {item.size && `• Size ${item.size}`}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2.5 sm:mt-3">
                          {/* Quantity control */}
                          <div className="flex items-center border border-border bg-Secondarycolor rounded-sm">
                            <button
                              onClick={() => updateQuantity(cartItem.id, (cartItem.quantity || 1) - 1)}
                              className="p-1.5 sm:px-2 sm:py-1 text-text-tertiary hover:text-Primarycolor active:scale-90 transition-all flex items-center justify-center"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="px-2 text-xs font-semibold text-Primarycolor tabular-nums select-none min-w-[20px] text-center">
                              {cartItem.quantity || 1}
                            </span>
                            <button
                              onClick={() => updateQuantity(cartItem.id, (cartItem.quantity || 1) + 1)}
                              className="p-1.5 sm:px-2 sm:py-1 text-text-tertiary hover:text-Primarycolor active:scale-90 transition-all flex items-center justify-center"
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <span className="text-xs sm:text-sm font-semibold text-Primarycolor tabular-nums">
                            {formatPrice(itemTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Recommended Items Section */}
              {recommendations.length > 0 && (
                <div className="pt-4 sm:pt-6 border-t border-border mt-4 sm:mt-6">
                  <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.08em] font-semibold text-Primarycolor mb-3 sm:mb-4">
                    <Sparkle size={14} className="text-amber-500" weight="fill" />
                    <span>Recommended Add-Ons</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    {recommendations.map((rec) => (
                      <div key={rec.id} className="p-2 border border-border bg-surface rounded-sm flex flex-col justify-between space-y-1.5 sm:space-y-2">
                        <img
                          src={rec.images?.[0] || rec.image || '/images/placeholder.jpg'}
                          alt={rec.name}
                          className="w-full h-20 sm:h-24 object-cover rounded-sm border border-border"
                        />
                        <div>
                          <p className="text-[0.6875rem] font-medium text-Primarycolor truncate">{rec.name}</p>
                          <p className="text-[0.65rem] text-text-tertiary tabular-nums">{formatPrice(rec.price || 0)}</p>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleQuickAdd(rec)}
                          disabled={addingId === rec.id}
                          className="text-[0.65rem] py-1 h-7 sm:h-8 w-full flex items-center justify-center gap-1"
                        >
                          {addingId === rec.id ? 'Adding...' : '+ Add'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Checkout Actions */}
            {items.length > 0 && (
              <div className="p-4 sm:p-6 border-t border-border bg-surface space-y-2.5 sm:space-y-3 flex-shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-6">
                <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-Primarycolor">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatPrice(subtotal)}</span>
                </div>
                <p className="text-[0.6875rem] text-text-tertiary">Shipping and tax calculated at checkout.</p>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                  <Button
                    variant="secondary"
                    onClick={handleViewCartClick}
                    className="w-full text-xs h-9 sm:h-10"
                  >
                    View Bag
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleCheckoutClick}
                    className="w-full text-xs h-9 sm:h-10 flex items-center justify-center gap-1.5"
                  >
                    <span>Checkout</span>
                    <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SideCartDrawer;
