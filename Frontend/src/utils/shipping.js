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

// All 36 states + FCT, canonical spellings matching the KTI rate card.
// Geography is static; delivery coverage comes from the rate card passed in,
// so the dropdown stays in sync with the backend automatically.
export const ALL_NIGERIA_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

/**
 * Split the state list into deliverable / not-yet-covered groups based on the
 * live KTI rate card. Lagos always counts as deliverable (zone delivery).
 * When no rate card has loaded yet, everything is returned as covered so the
 * dropdown doesn't mislabel states while the API call is in flight.
 */
export function getNigeriaStateGroups(interstateRates = []) {
  const covered = new Set(interstateRates.map(r => r.state));
  if (covered.size === 0) {
    return { haveRates: false, covered: ALL_NIGERIA_STATES, uncovered: [] };
  }
  return {
    haveRates: true,
    covered: ALL_NIGERIA_STATES.filter(s => s === 'Lagos' || covered.has(s)),
    uncovered: ALL_NIGERIA_STATES.filter(s => s !== 'Lagos' && !covered.has(s)),
  };
}
