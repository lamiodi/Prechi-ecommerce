// Unit tests for the server-side price authority (utils/pricingConfig.js).
// These guard against regression of the price-tampering fix in createOrder:
// the submitted item price must match a price the storefront UI can
// legitimately produce for the variant/size.

import { getAllowedItemPrices } from '../utils/pricingConfig.js';

// Size prices are absolute: a nonzero size price REPLACES the product base
// price (this mirrors ProductDetails.parseSizePrice). S/M carry no price and
// inherit the base; L carries a +5000 premium over whichever base is in play.
const sizesWithPremium = (productBasePrice) => [
  { size_name: 'S', price: 0 },
  { size_name: 'M', price: 0 },
  { size_name: 'L', price: productBasePrice + 5000 },
];

describe('getAllowedItemPrices — products without a split config', () => {
  const base = {
    productId: 44, // Signature Leather Bag (explicitly no config)
    sku: 'PSB',
    productName: 'Prechi Signature Leather Bag',
    productBasePrice: 80000,
    sizes: sizesWithPremium(80000),
  };

  test('allows the effective size price (size price > 0)', () => {
    const allowed = getAllowedItemPrices({ ...base, selectedSizeName: 'L' });
    expect(allowed).toEqual([85000]);
  });

  test('allows the product base price when the size has no price', () => {
    const allowed = getAllowedItemPrices({ ...base, selectedSizeName: 'M' });
    expect(allowed).toEqual([80000]);
  });

  test('rejects a tampered ₦1 price — exploit regression guard', () => {
    const allowed = getAllowedItemPrices({ ...base, selectedSizeName: 'M' });
    expect(allowed.some(p => Math.abs(p - 1) <= 1)).toBe(false);
  });
});

describe('getAllowedItemPrices — Milkshake set (full piece + inner-wear add-on)', () => {
  const productBasePrice = 100000;
  const base = {
    productId: 41,
    sku: 'MSP',
    productName: 'Prechi Milkshake 3-Piece Set',
    productBasePrice,
    sizes: sizesWithPremium(productBasePrice),
  };

  test('allows full set price and full set + add-on', () => {
    const allowed = getAllowedItemPrices({ ...base, selectedSizeName: 'M' });
    expect(allowed).toContain(100000);      // full set
    expect(allowed).toContain(110000);      // full set + inner wear
    expect(allowed).toHaveLength(2);
  });

  test('larger size pays the default price plus the size offset', () => {
    const allowed = getAllowedItemPrices({ ...base, selectedSizeName: 'L' });
    expect(allowed).toContain(105000);      // default (100000) + offset (5000)
    expect(allowed).toContain(115000);      // + inner wear
  });
});

describe('getAllowedItemPrices — Bright Tracksuit (piece-only options)', () => {
  const productBasePrice = 80000;
  const base = {
    productId: 46,
    sku: 'BTS',
    productName: 'Prechi Bright Tracksuit Set',
    productBasePrice,
    sizes: sizesWithPremium(productBasePrice),
  };

  test('allows full set, pant-only and top-only prices', () => {
    const allowed = getAllowedItemPrices({ ...base, selectedSizeName: 'M' });
    expect(allowed).toContain(80000);       // full
    expect(allowed).toContain(60000);       // pant only
    expect(allowed).toContain(20000);       // top only
    expect(allowed).toHaveLength(3);
  });

  test('still rejects prices below the cheapest legitimate piece', () => {
    const allowed = getAllowedItemPrices({ ...base, selectedSizeName: 'M' });
    expect(allowed.some(p => Math.abs(p - 500) <= 1)).toBe(false);
  });
});

describe('getAllowedItemPrices — Men Bright Set (pieces + bag add-on)', () => {
  const productBasePrice = 85000;
  const base = {
    productId: 47,
    sku: 'MBS',
    productName: 'Prechi Men Bright Set',
    productBasePrice,
    sizes: sizesWithPremium(productBasePrice),
  };

  test('produces every piece × add-on combination', () => {
    const allowed = getAllowedItemPrices({ ...base, selectedSizeName: 'M' });
    expect(allowed).toContain(85000);        // full
    expect(allowed).toContain(155000);       // full + bag
    expect(allowed).toContain(60000);        // pant
    expect(allowed).toContain(130000);       // pant + bag
    expect(allowed).toContain(25000);        // top
    expect(allowed).toContain(95000);        // top + bag
    expect(allowed).toHaveLength(6);
  });
});
