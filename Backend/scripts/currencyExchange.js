import postgres from 'postgres';

/**
 * Currency Exchange Utility for Naira-based pricing
 * This utility provides functions for currency conversion and formatting
 */

// Exchange rates (these should be fetched from an API in production)
const EXCHANGE_RATES = {
  NGN: 1, // Base currency
  USD: 0.000687, // 1 / 1455 (approximate rate)
  EUR: 0.000629, // Approximate EUR rate
  GBP: 0.000524, // Approximate GBP rate
  GHS: 0.0085,   // Approximate Ghana Cedi rate
  ZAR: 0.013     // Approximate South African Rand rate
};

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code (e.g., 'NGN')
 * @param {string} toCurrency - Target currency code (e.g., 'USD')
 * @returns {number} Converted amount
 */
export function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Convert to NGN first (base currency)
  let ngnAmount = amount;
  if (fromCurrency !== 'NGN') {
    const fromRate = EXCHANGE_RATES[fromCurrency];
    if (!fromRate) {
      throw new Error(`Exchange rate for ${fromCurrency} not found`);
    }
    ngnAmount = amount / fromRate;
  }

  // Convert from NGN to target currency
  if (toCurrency !== 'NGN') {
    const toRate = EXCHANGE_RATES[toCurrency];
    if (!toRate) {
      throw new Error(`Exchange rate for ${toCurrency} not found`);
    }
    return ngnAmount * toRate;
  }

  return ngnAmount;
}

/**
 * Format currency amount with proper symbol and locale
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (e.g., 'NGN', 'USD')
 * @param {string} locale - Locale for formatting (optional)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'NGN', locale = 'en-NG') {
  const currencySymbols = {
    NGN: '₦',
    USD: '$',
    EUR: '€',
    GBP: '£',
    GHS: 'GH₵',
    ZAR: 'R'
  };

  const symbol = currencySymbols[currency] || currency;
  
  try {
    // Use Intl.NumberFormat for proper formatting
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'NGN' ? 0 : 2,
      maximumFractionDigits: currency === 'NGN' ? 0 : 2
    });
    
    return formatter.format(amount);
  } catch (error) {
    // Fallback formatting
    const formattedAmount = amount.toLocaleString(locale, {
      minimumFractionDigits: currency === 'NGN' ? 0 : 2,
      maximumFractionDigits: currency === 'NGN' ? 0 : 2
    });
    
    return `${symbol}${formattedAmount}`;
  }
}

/**
 * Get current exchange rate from API
 * This is a placeholder - integrate with your preferred exchange rate API
 * Popular options: ExchangeRate-API, Fixer.io, Open Exchange Rates
 */
export async function fetchExchangeRate(fromCurrency, toCurrency) {
  // Placeholder for API integration
  // Example implementation:
  
  /*
  const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
  const data = await response.json();
  return data.rates[toCurrency];
  */
  
  // For now, return static rates
  if (fromCurrency === 'NGN' && EXCHANGE_RATES[toCurrency]) {
    return EXCHANGE_RATES[toCurrency];
  }
  
  if (toCurrency === 'NGN' && EXCHANGE_RATES[fromCurrency]) {
    return 1 / EXCHANGE_RATES[fromCurrency];
  }
  
  throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
}

/**
 * Update exchange rates in database
 * This function can be called periodically to update rates
 */
export async function updateExchangeRates(sql, rates) {
  try {
    console.log('🔄 Updating exchange rates...');
    
    // Create exchange_rates table if it doesn't exist
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.exchange_rates (
        id SERIAL PRIMARY KEY,
        base_currency VARCHAR(3) NOT NULL,
        target_currency VARCHAR(3) NOT NULL,
        rate DECIMAL(10, 6) NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(base_currency, target_currency)
      )
    `);

    // Insert or update rates
    for (const [baseCurrency, targetRates] of Object.entries(rates)) {
      for (const [targetCurrency, rate] of Object.entries(targetRates)) {
        await sql`
          INSERT INTO public.exchange_rates (base_currency, target_currency, rate)
          VALUES (${baseCurrency}, ${targetCurrency}, ${rate})
          ON CONFLICT (base_currency, target_currency) 
          DO UPDATE SET rate = ${rate}, last_updated = CURRENT_TIMESTAMP
        `;
      }
    }

    console.log('✅ Exchange rates updated successfully');
  } catch (error) {
    console.error('❌ Error updating exchange rates:', error.message);
    throw error;
  }
}

/**
 * Get price in user's preferred currency
 * This function can be used in your API endpoints
 */
export async function getPriceInUserCurrency(sql, priceInNGN, userCurrency = 'NGN') {
  if (userCurrency === 'NGN') {
    return {
      amount: priceInNGN,
      currency: 'NGN',
      formatted: formatCurrency(priceInNGN, 'NGN')
    };
  }

  try {
    // Fetch current rate from database or API
    const rate = await fetchExchangeRate('NGN', userCurrency);
    const convertedAmount = convertCurrency(priceInNGN, 'NGN', userCurrency);
    
    return {
      amount: convertedAmount,
      currency: userCurrency,
      formatted: formatCurrency(convertedAmount, userCurrency)
    };
  } catch (error) {
    console.error('Error converting currency:', error.message);
    // Fallback to NGN
    return {
      amount: priceInNGN,
      currency: 'NGN',
      formatted: formatCurrency(priceInNGN, 'NGN')
    };
  }
}

// Example usage and testing
console.log('💱 Currency Exchange Utility Test');

// Test conversions
const ngnAmount = 43635.45; // Classic T-Shirt price

console.log('\n📊 Currency Conversion Tests:');
console.log(`Original NGN: ${formatCurrency(ngnAmount, 'NGN')}`);
console.log(`USD: ${formatCurrency(convertCurrency(ngnAmount, 'NGN', 'USD'), 'USD')}`);
console.log(`EUR: ${formatCurrency(convertCurrency(ngnAmount, 'NGN', 'EUR'), 'EUR')}`);
console.log(`GBP: ${formatCurrency(convertCurrency(ngnAmount, 'NGN', 'GBP'), 'GBP')}`);

console.log('\n✅ Currency utility ready for integration!');