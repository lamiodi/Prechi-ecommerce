const fs = require('fs');

let content = fs.readFileSync('Frontend/src/pages/CheckoutPage.jsx', 'utf-8');

// 1. Hide/Show logic for Guest
content = content.replace(
  '{/* Shipping Address Form for Guests */}',
  '<div className={currentStep === 1 ? "block" : "hidden"}>\n                    {/* Shipping Address Form for Guests */}'
);

content = content.replace(
  '{/* Billing Address Form for Guests */}',
  '</div>\n                    <div className={currentStep === 2 ? "block" : "hidden"}>\n                    {/* Billing Address Form for Guests */}'
);

// Close Guest Billing Address Form div
content = content.replace(
  '                  </>\n                ) : (',
  '                    </div>\n                  </>\n                ) : ('
);

// 2. Hide/Show logic for Logged-in
content = content.replace(
  '{/* Shipping Address Section */}',
  '<div className={currentStep === 1 ? "block" : "hidden"}>\n                    {/* Shipping Address Section */}'
);

content = content.replace(
  '{/* Billing Address Section */}',
  '</div>\n                    <div className={currentStep === 2 ? "block" : "hidden"}>\n                    {/* Billing Address Section */}'
);

content = content.replace(
  '{/* Billing Address Form for Logged-in Users */}',
  '</div>\n                {/* Billing Address Form for Logged-in Users */}'
);

content = content.replace(
  '{showBillingForm && (',
  '<div className={currentStep === 2 ? "block" : "hidden"}>\n                {showBillingForm && ('
);

content = content.replace(
  '{/* Order Note */}',
  '</div>\n                {/* Order Note */}'
);

// 3. Order Note and Shipping Method should be in Step 1 (or Step 2?)
// Let's put Order Note and Shipping Method in Step 1
content = content.replace(
  '{/* Order Note */}',
  '<div className={currentStep === 1 ? "block" : "hidden"}>\n                {/* Order Note */}'
);

// Shipping method comes after order note, we need to close the Step 1 div after shipping method.
content = content.replace(
  '              {/* Right Column - Order Summary */}',
  '                </div>\n                {/* Navigation Buttons */}\n                <div className="flex justify-between mt-6">\n                  {currentStep > 1 && (\n                    <button onClick={() => setCurrentStep(currentStep - 1)} className="px-6 py-2 bg-gray-200 text-Primarycolor rounded-md font-Manrope hover:bg-gray-300">Back</button>\n                  )}\n                  {currentStep === 1 && (\n                    <button onClick={() => handleNextStep(2)} className="px-6 py-2 bg-Primarycolor text-white rounded-md font-Manrope hover:bg-gray-800 ml-auto">Continue to Billing</button>\n                  )}\n                  {currentStep === 2 && (\n                    <button onClick={() => handleNextStep(3)} className="px-6 py-2 bg-Primarycolor text-white rounded-md font-Manrope hover:bg-gray-800 ml-auto">Continue to Review</button>\n                  )}\n                </div>\n              </div>\n\n              {/* Right Column - Order Summary */}'
);

fs.writeFileSync('Frontend/src/pages/CheckoutPage.jsx', content, 'utf-8');
console.log('Hide steps refactored');
