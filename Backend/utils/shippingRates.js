// Canonical shipping rates (KTI Logistics rate card, Sep 2026).
//
// Two delivery products:
//  1. Lagos — KTI bike delivery, pick-up at Orchid, within 24h / next working
//     day. Price depends on the AREA (island/mainland zone), not the state.
//  2. Interstate — per-state rates from the interstate rate card; 3 working
//     days for South, 5 working days for North.
//
// This module is the pricing authority: createOrder resolves the cost from the
// address state + selected Lagos zone and never trusts the client's number.

export const LAGOS_ZONES = [
  // Island (pick-up side of the lagoon)
  { id: 1, area: 'island', label: 'Lekki Phase 1 & 2, Ikate, Agungi, Chevron, Ikota, VGC', cost: 3000 },
  { id: 2, area: 'island', label: 'Ikoyi, Victoria Island, Oniru, Ajah & environs', cost: 4000 },
  { id: 3, area: 'island', label: 'Sangotedo, Abijo, Awoyaya', cost: 4500 },
  { id: 4, area: 'island', label: 'Ibeju-Lekki, Eleko, Lakowe & environs', cost: 5500 },
  // Mainland
  { id: 5, area: 'mainland', label: 'Surulere, Yaba, Ebute-Meta, Gbagada, Oshodi, Ikeja, Maryland, Ilupeju, Ogudu, Anthony, Ojuelegba, Mushin, Bariga, Shomolu, Ogba, Ojota, Fadeyi, Magodo', cost: 4500 },
  { id: 6, area: 'mainland', label: 'Festac, Satellite Town, Amuwo-Odofin, Egbeda, Ikotun, Ipaja, Iyana-Ipaja, Abule-Egba, Ayobo, Akowonjo, Ijegun', cost: 5500 },
  { id: 7, area: 'mainland', label: 'Ikorodu, Ojo & environs', cost: 6000 },
  { id: 8, area: 'mainland', label: 'Sango Ota, Agbara, Badagry, Ibafo, Mowe, Magboro', cost: 8000 },
];

// Per-state interstate rates: [state, cost, eta, region]
const INTERSTATE_STATE_RATES = [
  // West — 3 working days
  { state: 'Ogun', cost: 7500, eta: '3–5 business days', region: 'West' },
  { state: 'Oyo', cost: 7500, eta: '3–5 business days', region: 'West' },
  { state: 'Ekiti', cost: 7500, eta: '3–5 business days', region: 'West' },
  { state: 'Osun', cost: 7500, eta: '3–5 business days', region: 'West' },
  { state: 'Ondo', cost: 7500, eta: '3–5 business days', region: 'West' },
  // East — 3 working days
  { state: 'Abia', cost: 10000, eta: '3–5 business days', region: 'East' },
  { state: 'Anambra', cost: 10000, eta: '3–5 business days', region: 'East' },
  { state: 'Ebonyi', cost: 10000, eta: '3–5 business days', region: 'East' },
  { state: 'Enugu', cost: 10000, eta: '3–5 business days', region: 'East' },
  { state: 'Imo', cost: 10000, eta: '3–5 business days', region: 'East' },
  // South-South — 3 working days
  { state: 'Akwa Ibom', cost: 10000, eta: '3–5 business days', region: 'South-South' },
  { state: 'Cross River', cost: 10000, eta: '3–5 business days', region: 'South-South' },
  { state: 'Bayelsa', cost: 10000, eta: '3–5 business days', region: 'South-South' },
  { state: 'Delta', cost: 10000, eta: '3–5 business days', region: 'South-South' },
  { state: 'Edo', cost: 10000, eta: '3–5 business days', region: 'South-South' },
  { state: 'Rivers', cost: 10000, eta: '3–5 business days', region: 'South-South' },
  // North Central — 5 working days
  { state: 'Kwara', cost: 10000, eta: '5–7 business days', region: 'North Central' },
  { state: 'FCT', cost: 10000, eta: '5–7 business days', region: 'North Central' },
  { state: 'Benue', cost: 10500, eta: '5–7 business days', region: 'North Central' },
  { state: 'Kogi', cost: 12500, eta: '5–7 business days', region: 'North Central' },
  { state: 'Nasarawa', cost: 12500, eta: '5–7 business days', region: 'North Central' },
  { state: 'Niger', cost: 12500, eta: '5–7 business days', region: 'North Central' },
  { state: 'Plateau', cost: 12500, eta: '5–7 business days', region: 'North Central' },
  // North West — 5 working days
  { state: 'Kano', cost: 10000, eta: '5–7 business days', region: 'North West' },
  { state: 'Jigawa', cost: 12500, eta: '5–7 business days', region: 'North West' },
  { state: 'Kaduna', cost: 12500, eta: '5–7 business days', region: 'North West' },
  { state: 'Katsina', cost: 12500, eta: '5–7 business days', region: 'North West' },
  { state: 'Kebbi', cost: 12500, eta: '5–7 business days', region: 'North West' },
  { state: 'Sokoto', cost: 12500, eta: '5–7 business days', region: 'North West' },
  { state: 'Zamfara', cost: 12500, eta: '5–7 business days', region: 'North West' },
  // North East — 5 working days
  { state: 'Gombe', cost: 12500, eta: '5–7 business days', region: 'North East' },
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
 *   - { type: 'lagos', cost, method, eta, zone }         Lagos with a valid zone
 *   - { type: 'lagos-needs-zone' }                        Lagos but no/invalid zone picked
 *   - { type: 'interstate', cost, method, eta, state }    listed non-Lagos state
 *   - { type: 'unavailable', state }                      not on the rate card
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
      eta: 'Next working day',
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
