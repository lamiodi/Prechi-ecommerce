// Canonical domestic shipping rates (Nigeria rate card, Oct 2026).
//
// Flat fee per ORDER — item count never affects the price.
//  1. Lagos — local delivery, flat per area: Island ₦6,000 / Mainland ₦7,000,
//     1–3 business days.
//  2. Interstate — per-state flat rates: ₦7,500 West; ₦10,000 East,
//     South-South, Kwara, FCT & Kano; ₦10,500 Benue; ₦12,500 all remaining
//     Northern states. 3–5 business days (South) / 5–7 (far North).
//     All 36 states + FCT are covered.
//
// This module is the pricing authority: createOrder resolves the cost from the
// address state + selected Lagos area and never trusts the client's number.

export const LAGOS_ZONES = [
  { id: 1, area: 'island', label: 'Lekki, Ikoyi, Victoria Island, Ajah, Ibeju-Lekki & all Island areas', cost: 6000, eta: '1–3 business days' },
  { id: 2, area: 'mainland', label: 'Surulere, Yaba, Ikeja, Festac, Ikorodu, Ota & all Mainland areas', cost: 7000, eta: '1–3 business days' },
];

// Per-state interstate rates: [state, cost, eta, region]
const INTERSTATE_STATE_RATES = [
  // West — ₦7,500, 3–5 business days
  { state: 'Ogun', cost: 7500, eta: '3–5 business days', region: 'West' },
  { state: 'Oyo', cost: 7500, eta: '3–5 business days', region: 'West' },
  { state: 'Osun', cost: 7500, eta: '3–5 business days', region: 'West' },
  { state: 'Ondo', cost: 7500, eta: '3–5 business days', region: 'West' },
  { state: 'Ekiti', cost: 7500, eta: '3–5 business days', region: 'West' },
  // East — ₦10,000, 3–5 business days
  { state: 'Abia', cost: 10000, eta: '3–5 business days', region: 'East' },
  { state: 'Anambra', cost: 10000, eta: '3–5 business days', region: 'East' },
  { state: 'Ebonyi', cost: 10000, eta: '3–5 business days', region: 'East' },
  { state: 'Enugu', cost: 10000, eta: '3–5 business days', region: 'East' },
  { state: 'Imo', cost: 10000, eta: '3–5 business days', region: 'East' },
  // South-South — ₦10,000, 3–5 business days
  { state: 'Akwa Ibom', cost: 10000, eta: '3–5 business days', region: 'South-South' },
  { state: 'Cross River', cost: 10000, eta: '3–5 business days', region: 'South-South' },
  { state: 'Bayelsa', cost: 10000, eta: '3–5 business days', region: 'South-South' },
  { state: 'Delta', cost: 10000, eta: '3–5 business days', region: 'South-South' },
  { state: 'Edo', cost: 10000, eta: '3–5 business days', region: 'South-South' },
  { state: 'Rivers', cost: 10000, eta: '3–5 business days', region: 'South-South' },
  // ₦10,000, 3–5 business days
  { state: 'Kwara', cost: 10000, eta: '3–5 business days', region: 'North Central' },
  { state: 'FCT', cost: 10000, eta: '3–5 business days', region: 'North Central' },
  { state: 'Kano', cost: 10000, eta: '3–5 business days', region: 'North West' },
  // ₦10,500, 3–5 business days
  { state: 'Benue', cost: 10500, eta: '3–5 business days', region: 'North Central' },
  // ₦12,500, 5–7 business days — remaining North Central
  { state: 'Kogi', cost: 12500, eta: '5–7 business days', region: 'North Central' },
  { state: 'Nasarawa', cost: 12500, eta: '5–7 business days', region: 'North Central' },
  { state: 'Niger', cost: 12500, eta: '5–7 business days', region: 'North Central' },
  { state: 'Plateau', cost: 12500, eta: '5–7 business days', region: 'North Central' },
  // ₦12,500, 5–7 business days — North West (Kano priced above)
  { state: 'Jigawa', cost: 12500, eta: '5–7 business days', region: 'North West' },
  { state: 'Kaduna', cost: 12500, eta: '5–7 business days', region: 'North West' },
  { state: 'Katsina', cost: 12500, eta: '5–7 business days', region: 'North West' },
  { state: 'Kebbi', cost: 12500, eta: '5–7 business days', region: 'North West' },
  { state: 'Sokoto', cost: 12500, eta: '5–7 business days', region: 'North West' },
  { state: 'Zamfara', cost: 12500, eta: '5–7 business days', region: 'North West' },
  // ₦12,500, 5–7 business days — North East
  { state: 'Gombe', cost: 12500, eta: '5–7 business days', region: 'North East' },
  { state: 'Adamawa', cost: 12500, eta: '5–7 business days', region: 'North East' },
  { state: 'Bauchi', cost: 12500, eta: '5–7 business days', region: 'North East' },
  { state: 'Borno', cost: 12500, eta: '5–7 business days', region: 'North East' },
  { state: 'Taraba', cost: 12500, eta: '5–7 business days', region: 'North East' },
  { state: 'Yobe', cost: 12500, eta: '5–7 business days', region: 'North East' },
];

// States customers type that aren't the canonical spelling
const STATE_ALIASES = {
  'fct': 'FCT',
  'abuja': 'FCT',
  'abuja fct': 'FCT',
  'abuja/fct': 'FCT',
  'federal capital territory': 'FCT',
  'akwa-ibom': 'Akwa Ibom',
  'crossriver': 'Cross River',
  'cross river state': 'Cross River',
  'lagos state': 'Lagos',
  'oyo state': 'Oyo',
  'ogun state': 'Ogun',
};

export function normalizeNigeriaState(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let s = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  s = s.replace(/\s*state$/i, '').trim(); // "Ogun state" -> "ogun"
  if (STATE_ALIASES[s]) return STATE_ALIASES[s];
  // Title-case each word for matching against canonical names
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function isLagosState(raw) {
  return normalizeNigeriaState(raw).toLowerCase().includes('lagos');
}

export function getLagosZoneById(zoneId) {
  const id = Number(zoneId);
  if (!id) return null;
  return LAGOS_ZONES.find(z => z.id === id) || null;
}

export function getInterstateRate(rawState) {
  const normalized = normalizeNigeriaState(rawState);
  if (!normalized) return null;
  return INTERSTATE_STATE_RATES.find(r => r.state.toLowerCase() === normalized.toLowerCase()) || null;
}

/**
 * Resolve the shipping quote for an order address.
 *
 * @param {Object} params
 * @param {string} params.state    address state (free text from the checkout form)
 * @param {number|string} [params.zoneId] selected LAGOS_ZONES id (Lagos orders only)
 * @returns one of:
 *   - { type: 'lagos', cost, method, eta, zone }         Lagos with a valid area
 *   - { type: 'lagos-needs-zone' }                        Lagos but no/invalid area picked
 *   - { type: 'interstate', cost, method, eta, state }    listed non-Lagos state
 *   - { type: 'unavailable', state }                      not a Nigerian state on the card
 *   - null                                                no state provided
 */
export function getShippingQuote({ state, zoneId } = {}) {
  if (!state || !String(state).trim()) return null;

  if (isLagosState(state)) {
    const zone = getLagosZoneById(zoneId);
    if (!zone) return { type: 'lagos-needs-zone' };
    return {
      type: 'lagos',
      cost: zone.cost,
      method: zone.area === 'island' ? 'Lagos Island delivery' : 'Lagos Mainland delivery',
      eta: zone.eta,
      zone,
    };
  }

  const rate = getInterstateRate(state);
  if (!rate) return { type: 'unavailable', state: String(state).trim() };
  return {
    type: 'interstate',
    cost: rate.cost,
    method: `Interstate delivery — ${rate.state}`,
    eta: rate.eta,
    state: rate.state,
  };
}

// Full rate card for the storefront (help page + checkout zone picker)
export function getShippingRateCard() {
  return {
    lagosZones: LAGOS_ZONES,
    interstateRates: INTERSTATE_STATE_RATES,
  };
}
