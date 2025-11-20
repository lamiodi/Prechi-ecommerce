// Unit test example for utility functions
import { describe, test, expect } from '@jest/globals';

// Mock utility function for testing
function calculateTotal(items) {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount / 100); // Assuming amount is in cents
}

describe('Utility Functions', () => {
  describe('calculateTotal', () => {
    test('should calculate total correctly for multiple items', () => {
      const items = [
        { price: 1000, quantity: 2 }, // $10.00 * 2 = $20.00
        { price: 500, quantity: 1 },  // $5.00 * 1 = $5.00
        { price: 2000, quantity: 3 }  // $20.00 * 3 = $60.00
      ];
      
      expect(calculateTotal(items)).toBe(8500); // $85.00 in cents
    });

    test('should return 0 for empty array', () => {
      expect(calculateTotal([])).toBe(0);
    });

    test('should handle single item', () => {
      const items = [{ price: 1500, quantity: 1 }];
      expect(calculateTotal(items)).toBe(1500);
    });
  });

  describe('formatCurrency', () => {
    test('should format cents to USD correctly', () => {
      expect(formatCurrency(1000)).toBe('$10.00');
      expect(formatCurrency(500)).toBe('$5.00');
      expect(formatCurrency(9999)).toBe('$100.00'); // Rounded
    });

    test('should handle zero amount', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });
  });
});