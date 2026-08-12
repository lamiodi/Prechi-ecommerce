import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function toTitleCase(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => {
      if (!word) return '';
      if (word.includes('-')) {
        return word
          .split('-')
          .map(p => p.charAt(0).toUpperCase() + p.slice(1))
          .join('-');
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

