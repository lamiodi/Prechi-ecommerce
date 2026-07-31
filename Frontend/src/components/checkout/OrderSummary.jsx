import React from 'react';
import { CurrencyBtc, WarningCircle, ShoppingBag, Check } from '@phosphor-icons/react';
import CouponCode from '../CouponCode';

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

          return (
            <div key={cartItem.id || index} className="flex gap-3 items-center py-2 border-b border-border/50 last:border-0">
              <div className="relative flex-shrink-0 w-14 h-18 bg-surface rounded-sm overflow-hidden border border-border">
                <img
                  src={displayImage}
                  alt={item.name || 'Product'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/images/placeholder.jpg';
                  }}
                />
                <div className="absolute top-1 right-1 bg-Primarycolor text-white text-[0.65rem] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {cartItem.quantity || 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-Primarycolor text-xs truncate">
                  {item.name || 'Unknown Item'}
                </h4>
                {item.is_product && (item.color || item.size) && (
                  <p className="text-[0.7rem] text-text-tertiary mt-0.5 capitalize">
                    {item.color || item.color_name} {item.size && `• Size ${item.size || item.size_name}`}
                  </p>
                )}
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-text-tertiary font-normal">
                    Qty: {cartItem.quantity || 1}
                  </span>
                  <span className="font-semibold text-Primarycolor tabular-nums">
                    ₦{itemTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coupon Code Section */}
      <div className="mb-6 pt-2 border-t border-border">
        <CouponCode
          subtotal={displaySubtotal}
          onDiscountApplied={(amount) => setCouponDiscount(amount)}
        />
      </div>

      <div className="border-t border-border pt-4 space-y-2 text-xs text-text-secondary">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-medium text-Primarycolor tabular-nums">
            ₦{displaySubtotal.toLocaleString()}
          </span>
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

        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="font-medium text-Primarycolor tabular-nums">
            {isNigeria ? `₦${(shippingMethod?.total_cost || 0).toLocaleString()}` : 'Calculated at checkout'}
          </span>
        </div>

        {!isNigeria && (
          <div className="flex justify-between">
            <span>Tax (5%)</span>
            <span className="font-medium text-Primarycolor tabular-nums">₦{displayTax.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="border-t border-border mt-4 pt-4">
        <div className="flex justify-between text-base font-semibold text-Primarycolor">
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
      <button
        onClick={handlePlaceOrder}
        disabled={
          isProcessing || loading ||
          (!shippingForm.address_line_1 && !shippingAddressId) ||
          (!billingForm.address_line_1 && !billingAddressId && billingAddressOption !== 'same') ||
          (isNigeria && !shippingMethod) ||
          (isGuest && !createdUserId && !guestFormSubmitted)
        }
        className="mt-6 btn btn-primary btn-md w-full"
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
      </button>

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