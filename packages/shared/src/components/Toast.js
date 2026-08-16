/**
 * DictaFlow — Toast Notification System
 */

import { h } from '../utils/helpers.js';

/** @type {HTMLElement|null} */
let container = null;

/** Initialize the toast container (call once on app start). */
export function initToast() {
  if (container) return;
  container = h('div', { className: 'toast-container' });
  document.body.appendChild(container);
}

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} duration - Auto-dismiss in ms (0 = manual)
 */
export function showToast(message, type = 'info', duration = 4000) {
  if (!container) initToast();

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  const toast = h('div', { className: `toast toast-${type}` },
    h('span', { className: 'toast-icon' }, icons[type] || 'ℹ️'),
    h('span', { className: 'toast-message' }, message),
    h('button', {
      className: 'toast-close',
      onClick: () => removeToast(toast),
      innerHTML: '✕',
    }),
  );

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }

  return toast;
}

/**
 * Remove a toast with animation.
 * @param {HTMLElement} toast
 */
function removeToast(toast) {
  if (!toast || !toast.parentNode) return;
  toast.style.animation = 'fadeOut 200ms ease-out forwards';
  setTimeout(() => toast.remove(), 200);
}
