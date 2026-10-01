// Display-side shipping resolution for checkout. Mirrors the matching logic of
// Backend/utils/shippingRates.js (KTI Logistics rate card) — the backend remains
// the pricing authority at order creation; this only drives the UI.

const STATE_ALIASES = {
  'fct': 'FCT',
  'abuja': 'FCT',
  'abuja fct': 'FCT',
  'abuja/fct': 'FCT',
  'federal capital territory': 'FCT',
  'akwa-ibom': 'Akwa Ibom',
  'crossriver': 'Cross River',
  'cross river state': 'Cross River',
};

export function normalizeNigeriaState(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let s = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  s = s.replace(/\s*state$/i, '').trim();
  if (STATE_ALIASES[s]) return STATE_ALIASES[s];
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function isLagosState(raw) {
  return normalizeNigeriaState(raw).toLowerCase().includes('lagos');
}

/**
 * Resolve what the checkout should show for a Nigerian delivery state.
 * @param {string} rawState free-text state from the address form
 * @param {Array} interstateRates interstate rate list from /api/meta/shipping-options
 * @returns {type: 'lagos'} | {type: 'interstate', rate} | {type: 'unavailable'} | {type: 'unknown'}
 */
export function resolveShippingForState(rawState, interstateRates = []) {
  if (!rawState || !String(rawState).trim()) return { type: 'unknown' };
  if (isLagosState(rawState)) return { type: 'lagos' };
  const normalized = normalizeNigeriaState(rawState);
  const rate = interstateRates.find(r => r.state.toLowerCase() === normalized.toLowerCase());
  return rate ? { type: 'interstate', rate } : { type: 'unavailable' };
}
