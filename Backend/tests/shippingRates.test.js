// Unit tests for the domestic Nigeria shipping rate resolution
// (utils/shippingRates.js) used by createOrder as the pricing authority.

import {
  getShippingQuote,
  getInterstateRate,
  isLagosState,
  normalizeNigeriaState,
  getShippingRateCard,
  LAGOS_ZONES,
} from '../utils/shippingRates.js';

describe('normalizeNigeriaState', () => {
  test('handles common spellings and aliases', () => {
    expect(normalizeNigeriaState(' lagos ')).toBe('Lagos');
    expect(normalizeNigeriaState('Lagos State')).toBe('Lagos');
    expect(normalizeNigeriaState('ogun state')).toBe('Ogun');
    expect(normalizeNigeriaState('abuja')).toBe('FCT');
    expect(normalizeNigeriaState('FCT')).toBe('FCT');
    expect(normalizeNigeriaState('Federal Capital Territory')).toBe('FCT');
    expect(normalizeNigeriaState('akwa ibom')).toBe('Akwa Ibom');
  });
});

describe('Lagos quotes', () => {
  test('requires an area selection', () => {
    expect(getShippingQuote({ state: 'Lagos' }).type).toBe('lagos-needs-zone');
    expect(getShippingQuote({ state: 'Lagos', zoneId: 999 }).type).toBe('lagos-needs-zone');
    expect(getShippingQuote({ state: 'Lagos', zoneId: 5 }).type).toBe('lagos-needs-zone'); // old 8-zone ids are gone
  });

  test('flat fee per area: Island 6,000 / Mainland 7,000, 1–3 days', () => {
    expect(getShippingQuote({ state: 'Lagos', zoneId: 1 }))
      .toMatchObject({ type: 'lagos', cost: 6000, eta: '1–3 business days' });
    expect(getShippingQuote({ state: 'lagos', zoneId: 2 }))
      .toMatchObject({ type: 'lagos', cost: 7000, eta: '1–3 business days' });
    expect(getShippingQuote({ state: 'Lagos State', zoneId: 2 }).cost).toBe(7000);
  });

  test('zone method names distinguish island vs mainland', () => {
    expect(getShippingQuote({ state: 'Lagos', zoneId: 1 }).method).toBe('Lagos Island delivery');
    expect(getShippingQuote({ state: 'Lagos', zoneId: 2 }).method).toBe('Lagos Mainland delivery');
  });

  test('isLagosState matches spelling variants', () => {
    expect(isLagosState('LAGOS')).toBe(true);
    expect(isLagosState('lagos state')).toBe(true);
    expect(isLagosState('Lekki')).toBe(false);
  });
});

describe('interstate quotes', () => {
  test('West states cost 7,500 with 3–5 day ETA', () => {
    for (const state of ['Ogun', 'Oyo', 'Ekiti', 'Osun', 'Ondo']) {
      const q = getShippingQuote({ state });
      expect(q).toMatchObject({ type: 'interstate', cost: 7500, eta: '3–5 business days' });
      expect(q.method).toBe(`Interstate delivery — ${state}`);
    }
  });

  test('East and South-South states cost 10,000 with 3–5 day ETA', () => {
    for (const state of ['Abia', 'Anambra', 'Ebonyi', 'Enugu', 'Imo', 'Akwa Ibom', 'Cross River', 'Bayelsa', 'Delta', 'Edo', 'Rivers']) {
      expect(getShippingQuote({ state })).toMatchObject({ cost: 10000, eta: '3–5 business days' });
    }
  });

  test('Kwara, FCT and Kano cost 10,000 with 3–5 day ETA', () => {
    expect(getShippingQuote({ state: 'Kwara' })).toMatchObject({ cost: 10000, eta: '3–5 business days' });
    expect(getShippingQuote({ state: 'Abuja' })).toMatchObject({ cost: 10000, eta: '3–5 business days' }); // FCT alias
    expect(getShippingQuote({ state: 'Kano' })).toMatchObject({ cost: 10000, eta: '3–5 business days' });
  });

  test('Benue costs 10,500 with 3–5 day ETA', () => {
    expect(getShippingQuote({ state: 'Benue' })).toMatchObject({ cost: 10500, eta: '3–5 business days' });
  });

  test('all remaining Northern states cost 12,500 with 5–7 day ETA', () => {
    const north12500 = ['Kogi', 'Nasarawa', 'Niger', 'Plateau', 'Jigawa', 'Kaduna', 'Katsina', 'Kebbi', 'Sokoto', 'Zamfara', 'Gombe', 'Adamawa', 'Bauchi', 'Borno', 'Taraba', 'Yobe'];
    for (const state of north12500) {
      expect(getShippingQuote({ state })).toMatchObject({ type: 'interstate', cost: 12500, eta: '5–7 business days' });
    }
  });

  test('junk states are flagged unavailable (not silently underpriced)', () => {
    const q = getShippingQuote({ state: 'Wakanda' });
    expect(q.type).toBe('unavailable');
    expect(q.cost).toBeUndefined();
  });

  test('empty state yields null', () => {
    expect(getShippingQuote({ state: '' })).toBeNull();
    expect(getShippingQuote({})).toBeNull();
  });
});

describe('rate card integrity', () => {
  test('covers all 36 states + FCT (no WhatsApp-only states left)', () => {
    const { interstateRates, lagosZones } = getShippingRateCard();
    expect(interstateRates).toHaveLength(36); // 37 total minus Lagos (area-priced)
    expect(lagosZones).toHaveLength(2);
    const costs = new Set(interstateRates.map(r => r.cost));
    expect(costs).toEqual(new Set([7500, 10000, 10500, 12500]));
  });

  test('every dropdown state resolves to a price (Lagos via zone)', () => {
    const { interstateRates } = getShippingRateCard();
    const allStates = ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
      'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
      'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
      'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
      'Taraba', 'Yobe', 'Zamfara'];
    for (const state of allStates) {
      const q = getShippingQuote({ state, zoneId: state === 'Lagos' ? 1 : undefined });
      expect(q.cost).toBeGreaterThan(0);
    }
    expect(interstateRates.every(r => allStates.includes(r.state) && r.state !== 'Lagos')).toBe(true);
  });

  test('Lagos zones expose flat per-area fees', () => {
    expect(LAGOS_ZONES.map(z => z.cost).sort()).toEqual([6000, 7000]);
    expect(LAGOS_ZONES.every(z => z.eta === '1–3 business days')).toBe(true);
  });

  test('getInterstateRate returns null for junk input', () => {
    expect(getInterstateRate('nowhere')).toBeNull();
    expect(getInterstateRate(null)).toBeNull();
  });
});
