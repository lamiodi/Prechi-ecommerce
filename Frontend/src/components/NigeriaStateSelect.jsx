import React from 'react';
import { getNigeriaStateGroups, normalizeNigeriaState } from '../utils/shipping';

// Nigerian state dropdown shared by the checkout address forms. States covered
// by the KTI rate card are grouped first; uncovered states stay selectable so
// those customers land on the WhatsApp-contact path instead of a dead end.
// Values are the canonical spellings the backend rate card prices against.
const NigeriaStateSelect = ({
  id,
  value,
  onChange,
  interstateRates = [],
  className = '',
  disabled = false,
}) => {
  const { haveRates, covered, uncovered } = getNigeriaStateGroups(interstateRates);
  // Map legacy free-text values ("abuja", "Lagos state") onto the canonical
  // option so previously saved addresses still display correctly.
  const normalized = value ? normalizeNigeriaState(value) : '';

  return (
    <select
      id={id}
      value={normalized}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full p-2.5 bg-surface border rounded-sm text-xs text-Primarycolor transition-all focus:outline-none focus:ring-1 focus:ring-Primarycolor disabled:opacity-60 ${className}`}
    >
      <option value="">Select state</option>
      {haveRates ? (
        <>
          <optgroup label="Delivery available">
            {covered.map((s) => (
              <option key={s} value={s}>{s === 'FCT' ? 'FCT — Abuja' : s}</option>
            ))}
          </optgroup>
          <optgroup label="Not yet covered — contact us on WhatsApp">
            {uncovered.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </optgroup>
        </>
      ) : (
        covered.map((s) => (
          <option key={s} value={s}>{s === 'FCT' ? 'FCT — Abuja' : s}</option>
        ))
      )}
    </select>
  );
};

export default NigeriaStateSelect;
