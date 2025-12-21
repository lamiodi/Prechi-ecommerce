import React from 'react';
import { Bitcoin, AlertCircle } from 'lucide-react';
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
  requiredForm
}) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md sticky top-24">
      <h3 className="text-xl font-semibold text-Primarycolor mb-6 font-Manrope">Order Summary</h3>
      
      {/* Cart Items */}
      <div className="space-y-4 mb-6">
        {cart.items.map((cartItem, index) => {
          const item = cartItem.item || {};
          const price = Number(item.price || 0);
          const itemTotal = Number((price * (cartItem.quantity || 1)).toFixed(2));
          
          return (
            <div key={cartItem.id || index} className="group">
              <div className="flex gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="relative flex-shrink-0">
                  <img
                    src={item.image || item.image_url || 'https://via.placeholder.com/80x80?text=No+Image'}
                    alt={item.name || 'Product'}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                    onError={(e) => { 
                      e.target.src = 'https://via.placeholder.com/80x80?text=No+Image'; 
                    }}
                  />
                  <div className="absolute -top-2 -right-2 bg-Primarycolor text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                    {cartItem.quantity || 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-Primarycolor text-sm sm:text-base truncate font-Manrope">
                    {item.name || 'Unknown Item'}
                  </h4>
                  {item.is_product && (item.color || item.size) && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.color && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-Accent font-PatrickHand">
                          {item.color || item.color_name}
                        </span>
                      )}
                      {item.size && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-Accent font-PatrickHand">
                          {item.size || item.size_name}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-Accent font-PatrickHand">
                      {price.toLocaleString('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })} each
                    </span>
                    <span className="font-semibold text-Primarycolor font-Manrope">
                      {itemTotal.toLocaleString('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Coupon Code Section */}
      <div className="mb-6">
        <CouponCode 
          subtotal={displaySubtotal} 
          onDiscountApplied={(amount) => setCouponDiscount(amount)} 
        />
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-Accent font-PatrickHand">
            <span>Subtotal</span>
            <span>
              {displaySubtotal.toLocaleString('en-NG', {
                style: 'currency',
                currency: 'NGN',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
          
          {displayFirstOrderDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600 font-PatrickHand">
              <span>First Order Discount (5%)</span>
              <span>
                -{displayFirstOrderDiscount.toLocaleString('en-NG', {
                  style: 'currency',
                  currency: 'NGN',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          )}
          
          {displayCouponDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600 font-PatrickHand">
              <span>Coupon Discount</span>
              <span>
                -{displayCouponDiscount.toLocaleString('en-NG', {
                  style: 'currency',
                  currency: 'NGN',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          )}
          
          <div className="flex justify-between text-sm text-Accent font-PatrickHand">
            <span>Shipping</span>
            <span>
              {isNigeria ? (
                (shippingMethod?.total_cost || 0).toLocaleString('en-NG', {
                  style: 'currency',
                  currency: 'NGN',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              ) : (
                'TBD'
              )}
            </span>
          </div>
          
          {!isNigeria && (
            <div className="flex justify-between text-sm text-Accent font-PatrickHand">
              <span>Tax (5%)</span>
              <span>
                {displayTax.toLocaleString('en-NG', {
                  style: 'currency',
                  currency: 'NGN',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 mt-3 pt-3">
          <div className="flex justify-between text-lg font-bold text-Primarycolor font-Manrope">
            <span>Total</span>
            <span>
              {displayTotal.toLocaleString('en-NG', {
                style: 'currency',
                currency: 'NGN',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        </div>
        
        {!isNigeria && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 font-PatrickHand">
              <strong>Note:</strong> International shipping fees will be calculated and invoiced separately. All payments are processed in NGN.
            </p>
          </div>
        )}
        
        {displayFirstOrderDiscount > 0 && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-700 font-PatrickHand">
              🎉 <strong>Congratulations!</strong> You've received a 5% discount on your first order.
            </p>
          </div>
        )}
        
        {appliedCoupon && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-700 font-PatrickHand">
              🎁 <strong>Coupon Applied!</strong> You saved {appliedCoupon.type === 'percentage' 
                ? `${appliedCoupon.value}%` 
                : `₦${appliedCoupon.amount.toFixed(2)}`} with coupon code {appliedCoupon.code}.
            </p>
          </div>
        )}
        
        {requiredForm && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800 font-PatrickHand">
                  {requiredForm === 'guest' && 'Complete Your Details'}
                  {requiredForm === 'shipping' && 'Add Shipping Address'}
                  {requiredForm === 'billing' && 'Add Billing Address'}
                </p>
                <p className="text-xs mt-1 text-yellow-700 font-PatrickHand">
                  {requiredForm === 'guest' && 'Fill in your name, email, and phone number above to continue'}
                  {requiredForm === 'shipping' && 'Add your shipping address to proceed with checkout'}
                  {requiredForm === 'billing' && 'Add your billing address or use same as shipping address'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Updated Place Order Button */}
        <button
          onClick={handlePlaceOrder}
          className="mt-6 w-full bg-Primarycolor text-Secondarycolor text-sm py-4 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-Manrope font-semibold"
          disabled={isProcessing || loading || 
            (!shippingForm.address_line_1 && !shippingAddressId) || 
            (!billingForm.address_line_1 && !billingAddressId) || 
            (isNigeria && !shippingMethod) || 
            (isGuest && !createdUserId && !guestFormSubmitted)
          }
        >
          {isProcessing || loading ? (
            <div className="flex items-center justify-center">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
              Processing...
            </div>
          ) : (
            'Place Order'
          )}
        </button>
        
        {paymentMethod === 'bitcoin' && (
          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Bitcoin className="h-4 w-4 text-orange-600" />
              <p className="text-xs text-orange-800 font-PatrickHand">
                <strong>Bitcoin Payment:</strong> After placing your order, you'll receive detailed payment instructions via email.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default OrderSummary;