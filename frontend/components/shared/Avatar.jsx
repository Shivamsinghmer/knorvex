'use client';

import { useState } from 'react';
import { getInitials } from '@/lib/utils';

/**
 * A smart avatar component that:
 * 1. Tries to render an <img> from the provided src URL
 * 2. Falls back to a colored initials badge if the image fails to load
 *    (handles ERR_CERT_AUTHORITY_INVALID, 404, etc.)
 *
 * @param {string} src - Image URL (optional)
 * @param {string} name - User's display name (used for initials fallback)
 * @param {string} className - Tailwind classes for the container (must define size, e.g. "w-10 h-10")
 * @param {string} alt - Alt text for the image
 */

const PALETTE = [
  ['#0ea5e9', '#bae6fd'], // sky
  ['#8b5cf6', '#ede9fe'], // violet
  ['#06b6d4', '#cffafe'], // cyan
  ['#f59e0b', '#fef3c7'], // amber
  ['#10b981', '#d1fae5'], // emerald
  ['#ef4444', '#fee2e2'], // red
  ['#ec4899', '#fce7f3'], // pink
  ['#6366f1', '#e0e7ff'], // indigo
];

function getColor(name = '') {
  // Deterministically pick a palette from name
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return PALETTE[hash % PALETTE.length];
}

export default function Avatar({ src, name = '', className = 'w-10 h-10', alt }) {
  const [imgError, setImgError] = useState(false);

  const initials = getInitials(name) || '?';
  const [bg, text] = getColor(name);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={alt || name}
        className={`${className} object-cover`}
        loading="lazy"
        onError={() => setImgError(true)}
      />
    );
  }

  // Initials fallback — no external network requests
  return (
    <div
      className={`${className} flex items-center justify-center font-bold text-[0.6em] select-none shrink-0`}
      style={{ background: bg, color: text, fontSize: undefined }}
      title={name}
    >
      {initials}
    </div>
  );
}
