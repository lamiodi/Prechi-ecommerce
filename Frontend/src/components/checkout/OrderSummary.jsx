import React from 'react';
import { CurrencyBtc, WarningCircle, ShoppingBag, Check } from '@phosphor-icons/react';
import CouponCode from '../CouponCode';
import { Button } from '../ui/button';

const OrderSummary = React.memo(({
  cart,
  displaySubtotal,
  displayFirstOrderDiscount,
  displayCouponDiscount,
  displayTax,
  displayTotal,
  shippingMethod,
  isNigeria,
  setCouponDiscount,
  appliedCoupon,
  paymentMethod,
  handlePlaceOrder,
  isProcessing,
  loading,
  shippingForm,
  shippingAddressId,
  billingForm,
  billingAddressId,
  isGuest,
  guestForm,
  createdUserId,
  guestFormSubmitted,
  requiredForm,
  billingAddressOption
}) => {
  return (
    <div className="p-6 bg-Secondarycolor border border-border rounded-sm sticky top-28 font-display">
      <h3 className="text-base font-semibold uppercase tracking-[0.08em] text-Primarycolor mb-6 pb-3 border-b border-border">
        Order Summary
      </h3>

      {/* Cart Items */}
      <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-1">
        {cart.items.map((cartItem, index) => {
          const item = cartItem.item || {};
          const price = Number(item.price || 0);
          const itemTotal = Number((price * (cartItem.quantity || 1)).toFixed(2));

          let displayImage = item.image || item.image_url || '/images/placeholder.jpg';
          if (typeof displayImage === 'object') {
            displayImage = displayImage?.image_url || displayImage?.url || '/images/placeholder.jpg';
          }

          const sizeDisplay = item.size || cartItem.size_name || item.size_name || (typeof item.size === 'string' ? item.size : null);
          const colorDisplay = item.color || cartItem.color_name || item.color_name || item.variant?.color_name || null;

          return (
            <div key={cartItem.id || index} className="flex gap-3 items-center py-2.5 border-b border-border/50 last:border-0">
              <img
                src={displayImage}
                alt={item.name || 'Product'}
                className="w-12 h-14 object-cover rounded-sm border border-border flex-shrink-0"
              />
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-semibold text-Primarycolor truncate">{item.name || 'Unknown Item'}</p>
                
                {/* Size & Color Metadata Display */}
                {(sizeDisplay || colorDisplay) && (
                  <div className="flex items-center gap-2 text-text-tertiary text-[11px] mt-0.5">
                    {sizeDisplay && (
                      <span>Size: <strong className="font-medium text-Primarycolor">{sizeDisplay}</strong></span>
                    )}
                    {sizeDisplay && colorDisplay && <span>•</span>}
                    {colorDisplay && (
                      <span>Color: <strong className="font-medium text-Primarycolor">{colorDisplay}</strong></span>
                    )}
                  </div>
                )}

                {/* Bundle Sub-items Display */}
                {Array.isArray(item.items) && item.items.length > 0 && (
                  <div className="mt-1 text-[10px] text-text-tertiary space-y-0.5 bg-surface/50 p-1.5 rounded border border-border/40">
                    {item.items.map((bItem, bIdx) => (
                      <p key={bIdx} className="truncate">
                        • {bItem.color_name || bItem.color || 'Item'} {bItem.size_name || bItem.size ? `(${bItem.size_name || bItem.size})` : ''}
                      </p>
                    ))}
                  </div>
                )}

                <p className="text-text-tertiary text-[11px] mt-0.5">Qty: {cartItem.quantity || 1}</p>
              </div>
              <span className="font-semibold text-xs text-Primarycolor tabular-nums">
                ₦{itemTotal.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      <CouponCode
        cartTotal={displaySubtotal}
        onApplyCoupon={(code, discount) => setCouponDiscount(discount)}
        appliedCoupon={appliedCoupon}
      />

      <div className="space-y-3 pt-4 border-t border-border text-xs">
        <div className="flex justify-between text-text-secondary">
          <span>Subtotal</span>
          <span className="font-medium text-Primarycolor tabular-nums">₦{displaySubtotal.toLocaleString()}</span>
        </div>

        {displayFirstOrderDiscount > 0 && (
          <div className="flex justify-between text-emerald-600 font-medium">
            <span>First Order Discount (5%)</span>
            <span className="tabular-nums">-₦{displayFirstOrderDiscount.toLocaleString()}</span>
          </div>
        )}

        {displayCouponDiscount > 0 && (
          <div className="flex justify-between text-emerald-600 font-medium">
            <span>Coupon Discount</span>
            <span className="tabular-nums">-₦{displayCouponDiscount.toLocaleString()}</span>
          </div>
        )}

        {isNigeria ? (
          <div className="flex justify-between text-text-secondary">
            <span>Shipping</span>
            <span className="font-medium text-Primarycolor tabular-nums">
              {shippingMethod ? `₦${shippingMethod.total_cost.toLocaleString()}` : 'Select method'}
            </span>
          </div>
        ) : (
          <div className="flex justify-between text-text-secondary">
            <span>Tax (5%)</span>
            <span className="font-medium text-Primarycolor tabular-nums">₦{displayTax.toLocaleString()}</span>
          </div>
        )}

        <div className="flex justify-between pt-3 border-t border-border text-sm font-semibold text-Primarycolor">
          <span>Total</span>
          <span className="tabular-nums">₦{displayTotal.toLocaleString()}</span>
        </div>
      </div>

      {displayFirstOrderDiscount > 0 && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm text-xs">
          🎉 <strong>First Order Perk:</strong> 5% discount applied.
        </div>
      )}

      {appliedCoupon && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm text-xs">
          🎁 <strong>Coupon Active:</strong> {appliedCoupon.code} applied.
        </div>
      )}

      {requiredForm && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-sm flex items-start gap-2 text-xs text-amber-800">
          <WarningCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Information Required</p>
            <p className="text-[0.7rem] text-amber-700 mt-0.5">
              {requiredForm === 'guest' && 'Please complete your contact details above.'}
              {requiredForm === 'shipping' && 'Please select or add a shipping address.'}
              {requiredForm === 'billing' && 'Please select or add a billing address.'}
            </p>
          </div>
        </div>
      )}

      {/* Place Order CTA Button */}
      <Button
        id="btn-place-order"
        variant="default"
        size="lg"
        onClick={handlePlaceOrder}
        disabled={isProcessing || loading}
        className="mt-6 w-full font-semibold shadow-sm hover:shadow transition-all"
      >
        {isProcessing || loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Processing order...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <ShoppingBag size={18} weight="light" />
            Place Order
          </span>
        )}
      </Button>

      {paymentMethod === 'bitcoin' && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-sm p-3 flex items-center gap-2">
          <CurrencyBtc size={18} className="text-amber-600 flex-shrink-0" />
          <p className="text-[0.7rem] text-amber-800">
            <strong>Bitcoin Payment:</strong> Details and instructions will be sent upon placing order.
          </p>
        </div>
      )}
    </div>
  );
});

export default OrderSummary;