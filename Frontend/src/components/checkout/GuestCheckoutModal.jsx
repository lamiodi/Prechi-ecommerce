import React from 'react';
import { User, X, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Smartphone, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const GuestCheckoutModal = React.memo(({ 
  guestForm, 
  guestFormErrors, 
  existingUserType, 
  requiredForm,
  onGuestFormChange,
  onLoginRedirect,
  onSubmitGuestForm,
  loading,
  navigate,
  onClose
}) => (
  <div className="fixed inset-0 bg-Primarycolor/60 backdrop-blur-md flex items-center justify-center z-50 p-4 font-display animate-fadeIn">
    <div className="bg-Secondarycolor rounded-sm max-w-md w-full p-6 shadow-2xl border border-border relative animate-slideUp">
      {/* Close button if optional */}
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 text-text-tertiary hover:text-Primarycolor rounded-sm"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-Primarycolor text-white rounded-sm">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-Primarycolor uppercase tracking-[0.06em]">
            Guest Checkout
          </h3>
          <p className="text-xs text-text-tertiary">
            Quick order setup without creating an account
          </p>
        </div>
      </div>

      {existingUserType && (
        <div className={`mb-4 p-3 rounded-sm text-xs ${
          existingUserType === 'temporary' 
            ? 'bg-amber-50 border border-amber-200 text-amber-900' 
            : 'bg-blue-50 border border-blue-200 text-blue-900'
        }`}>
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">
                {existingUserType === 'temporary' 
                  ? 'A temporary account already exists for this email' 
                  : 'An account already exists with this email'}
              </p>
              <p className="text-[0.7rem] mt-0.5 opacity-90">
                {existingUserType === 'temporary' 
                  ? 'You can continue below or sign in to save your order history.' 
                  : 'Sign in to access saved addresses and track your orders easily.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {requiredForm === 'guest' && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-sm text-xs text-rose-800">
          <p className="font-semibold">Please enter contact details to proceed to delivery.</p>
        </div>
      )}

      <form onSubmit={onSubmitGuestForm} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-Primarycolor uppercase tracking-[0.04em] mb-1">
            Full Name *
          </label>
          <div className="relative">
            <Input
              type="text"
              name="name"
              value={guestForm.name || ''}
              onChange={(e) => onGuestFormChange('name', e.target.value)}
              className={`w-full ${guestFormErrors.name ? 'border-rose-500 focus-visible:border-rose-500' : ''}`}
              placeholder="e.g. Alex Morgan"
              required
            />
          </div>
          {guestFormErrors.name && (
            <p className="text-[0.7rem] text-rose-600 mt-1">{guestFormErrors.name}</p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-semibold text-Primarycolor uppercase tracking-[0.04em] mb-1">
            Email Address *
          </label>
          <div className="relative">
            <Input
              type="email"
              name="email"
              value={guestForm.email || ''}
              onChange={(e) => onGuestFormChange('email', e.target.value)}
              className={`w-full ${guestFormErrors.email ? 'border-rose-500 focus-visible:border-rose-500' : ''}`}
              placeholder="alex@example.com"
              required
            />
          </div>
          {guestFormErrors.email && (
            <p className="text-[0.7rem] text-rose-600 mt-1">{guestFormErrors.email}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-semibold text-Primarycolor uppercase tracking-[0.04em] mb-1">
            Phone Number *
          </label>
          <div className="relative">
            <Input
              type="tel"
              name="phone_number"
              value={guestForm.phone_number || ''}
              onChange={(e) => onGuestFormChange('phone_number', e.target.value)}
              className={`w-full ${guestFormErrors.phone_number ? 'border-rose-500 focus-visible:border-rose-500' : ''}`}
              placeholder="+234 800 000 0000"
              required
            />
          </div>
          {guestFormErrors.phone_number && (
            <p className="text-[0.7rem] text-rose-600 mt-1">{guestFormErrors.phone_number}</p>
          )}
        </div>

        {/* Existing account option */}
        {existingUserType === 'permanent' && (
          <div className="p-3 bg-surface border border-border rounded-sm text-center">
            <Button
              type="button"
              variant="secondary"
              onClick={onLoginRedirect}
              className="w-full text-xs"
            >
              Log in to your account
            </Button>
          </div>
        )}

        {/* Submit Actions */}
        <div className="pt-2 space-y-2">
          <Button
            type="submit"
            disabled={loading}
            className="w-full text-xs flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>Continue to Shipping</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/cart')}
            className="w-full text-xs flex items-center justify-center gap-1 text-text-tertiary hover:text-Primarycolor"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Bag</span>
          </Button>
        </div>
      </form>
    </div>
  </div>
));

export default GuestCheckoutModal;