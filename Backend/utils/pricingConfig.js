// Server-side mirror of the product split/add-on pricing config.
//
// The storefront (Frontend/src/pages/ProductDetails.jsx -> getPricingSplitConfig)
// computes a unit price from a hardcoded per-product config: a chosen "piece"
// (full set / pant only / top only) plus optional add-ons. Because the order
// payload does not identify which piece/add-ons were selected, createOrder
// validates the submitted price against EVERY price the UI can legitimately
// produce for that variant/size (see getAllowedItemPrices below).
//
// IMPORTANT: keep this file in sync with getPricingSplitConfig in ProductDetails.jsx.

const SPLIT_PRICING_CONFIGS = [
  // 0. Prechi Milkshake 3-Piece Set - Base + Optional Inner Wear (+₦10,000)
  {
    matches: ({ id, sku, name }) => id === 41 || sku === 'MSP' || name.includes('milkshake'),
    pieces: [{ id: 'full' }],
    addons: [{ id: 'inner', price: 10000 }],
  },
  // 1. Prechi Signature Leather Bag - no split, no add-ons (explicit null)
  {
    matches: ({ id, sku, name }) => id === 44 || sku === 'PSB' || name.includes('signature leather bag'),
    pieces: null,
    addons: null,
  },
  // 2. Prechi Short Skirt Set - Base + Optional White Inner Tank Top (+₦10,000)
  {
    matches: ({ id, sku, name }) => id === 45 || sku === 'SSS' || name.includes('skirt set') || name.includes('short skirt'),
    pieces: [{ id: 'full' }],
    addons: [{ id: 'inner', price: 10000 }],
  },
  // 3. Prechi Bright Tracksuit Set - Base | Pant (₦60,000) | Top (₦20,000)
  {
    matches: ({ id, sku, name }) => id === 46 || sku === 'BTS' || (name.includes('bright tracksuit') && !name.includes('men')),
    pieces: [{ id: 'full' }, { id: 'pant', price: 60000 }, { id: 'top', price: 20000 }],
    addons: null,
  },
  // 4. Prechi Men Bright Set - Base | Pant (₦60,000) | Top (₦25,000) | Optional Bag (+₦70,000)
  {
    matches: ({ id, sku, name }) => id === 47 || sku === 'MBS' || name.includes('men bright set'),
    pieces: [{ id: 'full' }, { id: 'pant', price: 60000 }, { id: 'top', price: 25000 }],
    addons: [{ id: 'bag', price: 70000 }],
  },
  // 5. Prechi Black Set Men - Base | Pant (₦50,000) | Top (₦50,000)
  {
    matches: ({ id, sku, name }) => id === 48 || sku === 'BSM' || name.includes('black set men'),
    pieces: [{ id: 'full' }, { id: 'pant', price: 50000 }, { id: 'top', price: 50000 }],
    addons: null,
  },
  // 6. Prechi Niga Striped Tracksuit Set - Base | Pant (₦50,000) | Round Neck (₦60,000)
  {
    matches: ({ id, sku, name }) => id === 49 || sku === 'NST' || name.includes('niga striped') || name.includes('striped tracksuit'),
    pieces: [{ id: 'full' }, { id: 'top', price: 60000 }, { id: 'pant', price: 50000 }],
    addons: null,
  },
  // 7. Prechi Navy Blue & White T Set - Base + Optional Matching Bag (+₦70,000)
  {
    matches: ({ id, sku, name }) => id === 50 || sku === 'NWT' || name.includes('navy blue & white t set') || name.includes('white t set') || name.includes('navy blue t set'),
    pieces: [{ id: 'full' }],
    addons: [{ id: 'bag', price: 70000 }],
  },
  // 8. Prechi White Fix Set - Base + Optional Matching Bag (+₦70,000)
  {
    matches: ({ id, sku, name }) => id === 51 || sku === 'WFS' || name.includes('white fix set') || name.includes('white fix'),
    pieces: [{ id: 'full' }],
    addons: [{ id: 'bag', price: 70000 }],
  },
];

function findConfig({ productId, sku, productName }) {
  const id = Number(productId);
  const skuUp = String(sku || '').toUpperCase();
  const name = String(productName || '').toLowerCase();
  const entry = SPLIT_PRICING_CONFIGS.find(c => c.matches({ id, sku: skuUp, name }));
  return entry && entry.pieces ? entry : null;
}

/**
 * Compute every unit price the storefront UI can legitimately produce for a
 * variant/size combination. createOrder accepts the order only if the submitted
 * item price matches one of these values (₦1 rounding tolerance).
 *
 * @param {Object} params
 * @param {number} params.productId        products.id
 * @param {string} params.sku              products.sku_prefix
 * @param {string} params.productName      products.name
 * @param {Array}  params.sizes            [{ size_name, price }] from variant_sizes
 * @param {number} params.productBasePrice products.base_price
 * @param {string} params.selectedSizeName size name chosen for this item
 * @returns {number[]} allowed unit prices (in the order currency, before FX conversion)
 */
export function getAllowedItemPrices({ productId, sku, productName, sizes, productBasePrice, selectedSizeName }) {
  const base = Number(productBasePrice) || 0;
  const sizeRows = Array.isArray(sizes) ? sizes : [];

  const parseSizePrice = (s) => {
    const p = Number(s && s.price) || 0;
    return p > 0 ? p : base;
  };

  const config = findConfig({ productId, sku, productName });

  if (!config) {
    // No split config: the only legitimate price is the effective price of the
    // selected size (size price when set, otherwise the product base price).
    const selected = sizeRows.find(s => s.size_name === selectedSizeName);
    return [parseSizePrice(selected)];
  }

  // Mirror the UI: default size is S or M (else the first size); a larger size
  // adds max(0, current - default) on top of the default-size price.
  const defaultSizeObj = sizeRows.find(s => s.size_name === 'S' || s.size_name === 'M') || sizeRows[0];
  const defaultSizePrice = parseSizePrice(defaultSizeObj);
  const currentSizeObj = sizeRows.find(s => s.size_name === selectedSizeName);
  const currentSizePrice = parseSizePrice(currentSizeObj);
  const sizeOffset = Math.max(0, currentSizePrice - defaultSizePrice);

  // Build every add-on subset (order payload doesn't say which were chosen).
  const addonSets = [[]];
  for (const addon of config.addons || []) {
    const existingCount = addonSets.length;
    for (let i = 0; i < existingCount; i++) {
      addonSets.push([...addonSets[i], addon]);
    }
  }

  const allowed = [];
  for (const piece of config.pieces) {
    const basePiecePrice = piece.id === 'full'
      ? (defaultSizePrice > 0 ? defaultSizePrice : (Number(piece.price) || 0))
      : (Number(piece.price) || 0);
    for (const set of addonSets) {
      const addonsPrice = set.reduce((sum, a) => sum + a.price, 0);
      allowed.push(basePiecePrice + sizeOffset + addonsPrice);
    }
  }
  return allowed;
}
