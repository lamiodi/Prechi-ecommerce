// Unit tests for the KTI Logistics shipping rate resolution
// (utils/shippingRates.js) used by createOrder as the pricing authority.

import {
  getShippingQuote,
  getInterstateRate,
  isLagosState,
  normalizeNigeriaState,
  getShippingRateCard,
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
  test('requires a zone selection', () => {
    expect(getShippingQuote({ state: 'Lagos' }).type).toBe('lagos-needs-zone');
    expect(getShippingQuote({ state: 'Lagos', zoneId: 999 }).type).toBe('lagos-needs-zone');
  });

  test('prices each island zone from the KTI card', () => {
    expect(getShippingQuote({ state: 'Lagos', zoneId: 1 })).toMatchObject({ type: 'lagos', cost: 3000, eta: 'Next working day' });
    expect(getShippingQuote({ state: 'lagos', zoneId: 2 }).cost).toBe(4000);
    expect(getShippingQuote({ state: 'Lagos State', zoneId: 3 }).cost).toBe(4500);
    expect(getShippingQuote({ state: 'Lagos', zoneId: 4 }).cost).toBe(5500);
  });

  test('prices each mainland zone from the KTI card', () => {
    expect(getShippingQuote({ state: 'Lagos', zoneId: 5 }).cost).toBe(4500);
    expect(getShippingQuote({ state: 'Lagos', zoneId: 6 }).cost).toBe(5500);
    expect(getShippingQuote({ state: 'Lagos', zoneId: 7 }).cost).toBe(6000);
    expect(getShippingQuote({ state: 'Lagos', zoneId: 8 }).cost).toBe(8000);
  });

  test('zone method names distinguish island vs mainland', () => {
    expect(getShippingQuote({ state: 'Lagos', zoneId: 1 }).method).toBe('Lagos Island delivery');
    expect(getShippingQuote({ state: 'Lagos', zoneId: 5 }).method).toBe('Lagos Mainland delivery');
  });

  test('isLagosState matches spelling variants', () => {
    expect(isLagosState('LAGOS')).toBe(true);
    expect(isLagosState('lagos state')).toBe(true);
    expect(isLagosState('Lekki')).toBe(false);
  });
});

describe('interstate quotes', () => {
  test('West states cost 7,500 with 3-day ETA', () => {
    for (const state of ['Ogun', 'Oyo', 'Ekiti', 'Osun', 'Ondo']) {
      const q = getShippingQuote({ state });
      expect(q).toMatchObject({ type: 'interstate', cost: 7500, eta: '3–5 business days' });
      expect(q.method).toBe(`Interstate delivery — ${state}`);
    }
  });

  test('East and South-South states cost 10,000', () => {
    expect(getShippingQuote({ state: 'Anambra' }).cost).toBe(10000);
    expect(getShippingQuote({ state: 'Rivers' }).cost).toBe(10000);
    expect(getShippingQuote({ state: 'Akwa Ibom' }).cost).toBe(10000);
  });

  test('North states cost 10,000–12,500 with 5-day ETA', () => {
    expect(getShippingQuote({ state: 'Abuja' }).cost).toBe(10000);       // FCT alias
    expect(getShippingQuote({ state: 'Kano' }).cost).toBe(10000);
    expect(getShippingQuote({ state: 'Benue' }).cost).toBe(10500);
    expect(getShippingQuote({ state: 'Kogi' }).cost).toBe(12500);
    expect(getShippingQuote({ state: 'Gombe' }).cost).toBe(12500);
    expect(getShippingQuote({ state: 'Kaduna' }).eta).toBe('5–7 business days');
  });

  test('unlisted states are flagged unavailable (not silently underpriced)', () => {
    const q = getShippingQuote({ state: 'Borno' });
    expect(q.type).toBe('unavailable');
    expect(q.cost).toBeUndefined();
  });

  test('empty state yields null', () => {
    expect(getShippingQuote({ state: '' })).toBeNull();
    expect(getShippingQuote({})).toBeNull();
  });
});

describe('rate card integrity', () => {
  test('covers exactly the states on the KTI card', () => {
    const { interstateRates, lagosZones } = getShippingRateCard();
    expect(interstateRates).toHaveLength(31); // 5 West + 5 East + 6 SS + 7 NC + 7 NW + 1 NE
    expect(lagosZones).toHaveLength(8);
    const costs = new Set(interstateRates.map(r => r.cost));
    expect(costs).toEqual(new Set([7500, 10000, 10500, 12500]));
  });

  test('getInterstateRate returns null for junk input', () => {
    expect(getInterstateRate('nowhere')).toBeNull();
    expect(getInterstateRate(null)).toBeNull();
  });
});
