// Backend function to handle diamond set pricing based on size
// This function implements the ₦70k (S-2XL) and ₦80k+ (3XL-5XL) pricing structure

export const getDiamondSetPrice = (sizeName, basePrice = 70000) => {
  // Define plus sizes that get the premium pricing
  const plusSizes = ['3XL', '4XL', '5XL'];
  
  // Check if the selected size is a plus size
  if (plusSizes.includes(sizeName)) {
    // Plus sizes get ₦80,000 (base price + ₦10,000 premium)
    return basePrice + 10000; // Returns 80000
  }
  
  // Regular sizes (S, M, L, XL, XXL) get the base price of ₦70,000
  return basePrice; // Returns 70000
};

// Enhanced function for bundle pricing (3-in-1 sets)
export const getDiamondSetBundlePrice = (selectedSizes, baseBundlePrice = 70000) => {
  // Check if any selected size is a plus size
  const plusSizes = ['3XL', '4XL', '5XL'];
  const hasPlusSize = selectedSizes.some(size => plusSizes.includes(size));
  
  if (hasPlusSize) {
    // If any item in the bundle is plus size, entire bundle gets premium pricing
    return baseBundlePrice + 10000; // Returns 80000
  }
  
  // All regular sizes get base bundle price
  return baseBundlePrice; // Returns 70000
};

// Frontend integration example for product details page
export const calculateDiamondSetPricing = (selectedSize, isBundle = false) => {
  const regularPrice = 70000;
  const plusSizePrice = 80000;
  
  const plusSizes = ['3XL', '4XL', '5XL'];
  const finalPrice = plusSizes.includes(selectedSize) ? plusSizePrice : regularPrice;
  
  return {
    price: finalPrice,
    originalPrice: regularPrice,
    sizeCategory: plusSizes.includes(selectedSize) ? 'Plus Size' : 'Regular Size',
    savings: 0 // Can add discount logic here if needed
  };
};

// Size validation function
export const isValidDiamondSetSize = (sizeName) => {
  const validSizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
  return validSizes.includes(sizeName);
};

export default {
  getDiamondSetPrice,
  getDiamondSetBundlePrice,
  calculateDiamondSetPricing,
  isValidDiamondSetSize
};