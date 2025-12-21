import React from 'react';
import { User, X, CheckCircle, AlertCircle, Smartphone, ArrowLeft } from 'lucide-react';

const GuestCheckoutModal = React.memo(({ 
  guestForm, 
  guestFormErrors, 
  existingUserType, 
  requiredForm,
  onGuestFormChange,
  onLoginRedirect,
  onSubmitGuestForm,
  loading,
  navigate
}) => (
  // Backdrop with blur effects
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200">
      {/* Simplified header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-Primarycolor rounded-lg mr-3">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-Primarycolor font-Manrope">
              Complete Your Order
            </h3>
            <p className="text-sm text-Accent font-PatrickHand">
              Enter your details to proceed
            </p>
          </div>
        </div>
        <button 
          onClick={() => {}} // Prevent closing the modal
          className="p-2 text-gray-400 hover:text-Accent hover:bg-gray-100 rounded-lg transition-colors cursor-not-allowed"
          title="Please complete the form to continue"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      

      
      {existingUserType && (
        <div className={`mb-4 p-3 rounded-lg ${
          existingUserType === 'temporary' 
            ? 'bg-blue-50 border border-blue-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-start">
            {existingUserType === 'temporary' ? (
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            )}
            <div>
              <p className={`text-sm font-medium ${
                existingUserType === 'temporary' 
                  ? 'text-blue-800' 
                  : 'text-yellow-800'
              } font-PatrickHand`}>
                {existingUserType === 'temporary' 
                  ? 'A temporary account with this email already exists' 
                  : 'An account with this email already exists'}
              </p>
              <p className={`text-xs mt-1 ${
                existingUserType === 'temporary' 
                  ? 'text-blue-700' 
                  : 'text-yellow-700'
              } font-PatrickHand`}>
                {existingUserType === 'temporary' 
                  ? 'Please use a different email or log in if you have a password.' 
                  : 'Please log in to continue with your existing account.'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {requiredForm === 'guest' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 font-PatrickHand">
                Please fill in your details to continue
              </p>
              <p className="text-xs mt-1 text-red-700 font-PatrickHand">
                All fields marked with * are required
              </p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={onSubmitGuestForm} className="space-y-4">
        {/* Enhanced form fields with better styling */}
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-Primarycolor mb-1 font-PatrickHand flex items-center">
            <User className="h-4 w-4 mr-2 text-Accent" />
            Full Name *
          </label>
          <div className="relative">
            <input
              type="text"
              name="name"
              value={guestForm.name}
              onChange={(e) => onGuestFormChange('name', e.target.value)}
              className={`w-full px-3 py-2 border-2 rounded-xl font-PatrickHand transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-Primarycolor/20 ${
                guestFormErrors.name 
                  ? 'border-red-400 bg-red-50 focus:border-red-500' 
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-Primarycolor focus:bg-white'
              }`}
              placeholder="Enter your full name"
            />
            {guestFormErrors.name && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
            )}
          </div>
          {guestFormErrors.name && (
            <p className="text-xs text-red-600 mt-1 font-PatrickHand flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {guestFormErrors.name}
            </p>
          )}
        </div>
        
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-Primarycolor mb-1 font-PatrickHand flex items-center">
            <svg className="h-4 w-4 mr-2 text-Accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            Email Address *
          </label>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={guestForm.email}
              onChange={(e) => onGuestFormChange('email', e.target.value)}
              className={`w-full px-3 py-2 border-2 rounded-xl font-PatrickHand transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-Primarycolor/20 ${
                guestFormErrors.email 
                  ? 'border-red-400 bg-red-50 focus:border-red-500' 
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-Primarycolor focus:bg-white'
              }`}
              placeholder="Enter your email address"
            />
            {guestFormErrors.email && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
            )}
          </div>
          {guestFormErrors.email && (
            <p className="text-xs text-red-600 mt-1 font-PatrickHand flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {guestFormErrors.email}
            </p>
          )}
        </div>
        
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-Primarycolor mb-1 font-PatrickHand flex items-center">
            <Smartphone className="h-4 w-4 mr-2 text-Accent" />
            Phone Number *
          </label>
          <div className="relative">
            <input
              type="tel"
              name="phone_number"
              value={guestForm.phone_number}
              onChange={(e) => onGuestFormChange('phone_number', e.target.value)}
              className={`w-full px-3 py-2 border-2 rounded-xl font-PatrickHand transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-Primarycolor/20 ${
                guestFormErrors.phone_number 
                  ? 'border-red-400 bg-red-50 focus:border-red-500' 
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-Primarycolor focus:bg-white'
              }`}
              placeholder="Enter your phone number"
            />
            {guestFormErrors.phone_number && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
            )}
          </div>
          {guestFormErrors.phone_number && (
            <p className="text-xs text-red-600 mt-1 font-PatrickHand flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {guestFormErrors.phone_number}
            </p>
          )}
        </div>
        
        {/* Order details info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-sm text-blue-800 font-PatrickHand leading-relaxed">
            Your order details will be saved automatically. We'll send you order updates via email.
          </p>
        </div>
        
        {existingUserType === 'permanent' && (
          <div className="bg-Secondarycolor/10 border border-Secondarycolor/20 rounded-xl p-3 text-center">
            <p className="text-sm text-Secondarycolor font-PatrickHand mb-2">
              Account already exists with this email
            </p>
            <button
              type="button"
              onClick={onLoginRedirect}
              className="inline-flex items-center px-3 py-2 bg-Secondarycolor text-white rounded-lg hover:bg-Secondarycolor/90 font-PatrickHand font-medium transition-colors"
            >
              <User className="h-4 w-4 mr-2" />
              Log in to your existing account
            </button>
          </div>
        )}
        
        {/* Enhanced button section with compact spacing */}
        <div className="pt-3 space-y-2">
          {/* Primary action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 bg-Primarycolor text-white rounded-xl hover:bg-Primarycolor/90 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed font-PatrickHand font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                Continue to Checkout
                <svg className="h-4 w-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
          
          {/* Secondary action */}
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-Accent hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center font-PatrickHand font-medium transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Cart
          </button>
          

        </div>
      </form>
    </div>
  </div>
));

export default GuestCheckoutModal;