import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash, Plus, Minus, ShoppingBag, ArrowRight, Sparkle, Check } from '@phosphor-icons/react';
import { useCartDrawer } from '../context/CartDrawerContext';
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

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isCartOpen]);

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
  const subtotal = Number(cart.subtotal) || items.reduce((acc, curr) => acc + (curr.quantity * (curr.item?.price || 0)), 0);
  const freeShippingThreshold = 50000; // ₦50,000 threshold for free shipping
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleCheckoutClick = () => {
    closeCart();
    navigate('/checkout');
  };

  const handleViewCartClick = () => {
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

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-display">
      {/* Backdrop overlay */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-Secondarycolor h-full shadow-2xl flex flex-col z-10 border-l border-border animate-slideLeft">
        {/* Top Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} weight="light" className="text-Primarycolor" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-Primarycolor">
              Shopping Bag ({items.reduce((acc, curr) => acc + (curr.quantity || 1), 0)})
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeCart}
            className="h-8 w-8 text-text-tertiary hover:text-Primarycolor rounded-sm"
            aria-label="Close cart drawer"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="bg-Primarycolor text-white px-6 py-3 text-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[0.7rem] uppercase tracking-wider font-medium">
            <span>
              {subtotal >= freeShippingThreshold
                ? '🎉 You unlocked free delivery!'
                : `Add ₦${(freeShippingThreshold - subtotal).toLocaleString()} more for free delivery`}
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <ShoppingBag size={48} weight="thin" className="mx-auto text-text-tertiary" />
              <p className="text-xs uppercase tracking-wider text-text-tertiary font-medium">
                Your shopping bag is currently empty
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={() => { closeCart(); navigate('/shop'); }}
                className="mt-2"
              >
                Discover Collection
              </Button>
            </div>
          ) : (
            items.map((cartItem) => {
              const item = cartItem.item || {};
              const price = Number(item.price || 0);
              const itemTotal = price * (cartItem.quantity || 1);

              let displayImage = item.image || item.image_url || '/images/placeholder.jpg';
              if (typeof displayImage === 'object') {
                displayImage = displayImage?.image_url || displayImage?.url || '/images/placeholder.jpg';
              }

              return (
                <div key={cartItem.id} className="flex gap-4 p-3 bg-surface border border-border rounded-sm relative group">
                  <div className="w-20 h-24 bg-Secondarycolor rounded-sm overflow-hidden flex-shrink-0 border border-border">
                    <img
                      src={displayImage}
                      alt={item.name || 'Product'}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/images/placeholder.jpg'; }}
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-semibold text-Primarycolor truncate pr-4">
                          {item.name || 'Unknown Item'}
                        </h4>
                        <button
                          onClick={() => removeFromCart(cartItem.id)}
                          className="text-text-tertiary hover:text-rose-600 transition-colors p-1"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                      {(item.color || item.size) && (
                        <p className="text-[0.7rem] text-text-tertiary mt-0.5 capitalize">
                          {item.color} {item.size && `• Size ${item.size}`}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity control */}
                      <div className="flex items-center border border-border bg-Secondarycolor rounded-sm">
                        <button
                          onClick={() => updateQuantity(cartItem.id, (cartItem.quantity || 1) - 1)}
                          className="px-2 py-1 text-text-tertiary hover:text-Primarycolor transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-2 text-xs font-semibold text-Primarycolor tabular-nums">
                          {cartItem.quantity || 1}
                        </span>
                        <button
                          onClick={() => updateQuantity(cartItem.id, (cartItem.quantity || 1) + 1)}
                          className="px-2 py-1 text-text-tertiary hover:text-Primarycolor transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <span className="text-xs font-semibold text-Primarycolor tabular-nums">
                        ₦{itemTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Recommended Items Section */}
          {recommendations.length > 0 && (
            <div className="pt-6 border-t border-border mt-8">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.08em] font-semibold text-Primarycolor mb-4">
                <Sparkle size={14} className="text-amber-500" weight="fill" />
                <span>Recommended Add-Ons</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="p-2 border border-border bg-surface rounded-sm flex flex-col justify-between space-y-2">
                    <img
                      src={rec.images?.[0] || rec.image || '/images/placeholder.jpg'}
                      alt={rec.name}
                      className="w-full h-24 object-cover rounded-sm border border-border"
                    />
                    <div>
                      <p className="text-[0.7rem] font-medium text-Primarycolor truncate">{rec.name}</p>
                      <p className="text-[0.65rem] text-text-tertiary tabular-nums">₦{(rec.price || 0).toLocaleString()}</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleQuickAdd(rec)}
                      disabled={addingId === rec.id}
                      className="text-[0.65rem] py-1 h-8 w-full flex items-center justify-center gap-1"
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
          <div className="p-6 border-t border-border bg-surface space-y-3">
            <div className="flex justify-between items-center text-sm font-semibold text-Primarycolor">
              <span>Subtotal</span>
              <span className="tabular-nums">₦{subtotal.toLocaleString()}</span>
            </div>
            <p className="text-[0.7rem] text-text-tertiary">Shipping and tax calculated at checkout.</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={handleViewCartClick}
                className="w-full text-xs"
              >
                View Full Bag
              </Button>
              <Button
                variant="default"
                onClick={handleCheckoutClick}
                className="w-full text-xs flex items-center justify-center gap-1.5"
              >
                <span>Checkout</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SideCartDrawer;
