import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a coin amount with commas
 */
export function formatCoins(amount) {
  return new Intl.NumberFormat('en-IN').format(amount);
}

/**
 * Format a date relative to now (e.g. "2 days ago")
 */
export function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Format a scheduled date nicely
 */
export function formatScheduled(date) {
  return new Date(date).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get rank color class
 */
export function getRankClass(rank) {
  const map = {
    Beginner: 'rank-beginner',
    Explorer: 'rank-explorer',
    Mentor: 'rank-mentor',
    Expert: 'rank-expert',
    Legend: 'rank-legend',
  };
  return map[rank] || 'rank-beginner';
}

/**
 * Get status color
 */
export function getStatusColor(status) {
  const map = {
    pending: 'text-warning',
    confirmed: 'text-primary-light',
    active: 'text-success',
    completed: 'text-text-secondary',
    cancelled: 'text-danger',
    pending_rating: 'text-accent-cyan',
  };
  return map[status] || 'text-text-secondary';
}

/**
 * Get initials from name
 */
export function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

/**
 * Truncate text
 */
export function truncate(text = '', length = 100) {
  return text.length > length ? text.slice(0, length) + '…' : text;
}
