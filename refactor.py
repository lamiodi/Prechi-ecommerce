import re

with open('Frontend/src/pages/CheckoutPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add step validation logic to CheckoutPage.jsx
validation_logic = """
  // Validation for Step 1
  const validateStep1 = () => {
    const missing = [];
    if (isGuest && !guestFormSubmitted) {
      missing.push("Guest contact information is required");
    }
    
    const hasShipping = isAuthenticated()
      ? (shippingAddressId && shippingAddresses.length > 0) || shippingForm.address_line_1
      : shippingForm.address_line_1;
      
    if (!hasShipping) {
      missing.push("Shipping address is missing");
      setRequiredForm('shipping');
    }
    
    const addressCountry = shippingForm.country || country;
    const isNigeria = addressCountry.toLowerCase() === 'nigeria';
    
    if (isNigeria && !shippingMethod) {
      missing.push("Delivery method is required");
    }
    
    if (missing.length > 0) {
      setMissingFieldsSummary(missing);
      return false;
    }
    
    setMissingFieldsSummary([]);
    return true;
  };

  // Validation for Step 2
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
    } else if (step === 3) {
      if (validateStep2()) setCurrentStep(3);
    }
  };
"""

content = content.replace('  // NEW: Generate idempotency key once per session', validation_logic + '\n  // NEW: Generate idempotency key once per session')

# Update the UI layout to Step-by-Step
# I will use regular expressions or simple string replacements to wrap the sections.

# First, let's insert the Step Progress Bar right above the forms
progress_bar = """
            {/* Step Progress Bar */}
            <div className="lg:col-span-12 mb-6">
              <div className="flex items-center justify-between w-full">
                <div className={`flex-1 text-center py-3 border-b-4 ${currentStep >= 1 ? 'border-Primarycolor text-Primarycolor font-bold' : 'border-gray-200 text-gray-400'}`}>1. Shipping & Delivery</div>
                <div className={`flex-1 text-center py-3 border-b-4 ${currentStep >= 2 ? 'border-Primarycolor text-Primarycolor font-bold' : 'border-gray-200 text-gray-400'}`}>2. Payment & Billing</div>
                <div className={`flex-1 text-center py-3 border-b-4 ${currentStep >= 3 ? 'border-Primarycolor text-Primarycolor font-bold' : 'border-gray-200 text-gray-400'}`}>3. Review Order</div>
              </div>
              
              {missingFieldsSummary.length > 0 && (
                <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-red-800 font-bold mb-1">Please complete the following:</h4>
                      <ul className="list-disc pl-5 text-red-700 text-sm">
                        {missingFieldsSummary.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
"""

content = content.replace('            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">', progress_bar)

with open('Frontend/src/pages/CheckoutPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
