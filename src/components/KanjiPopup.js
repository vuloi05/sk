/**
 * DictaFlow — Kanji Popup Component
 * 
 * Renders an inline tooltip when a kanji character is clicked.
 */

import { h } from '../utils/helpers.js';
import { lookupKanji, isKanji } from '../core/kanjiService.js';

let activePopup = null;

/**
 * Close any existing kanji popup.
 */
function closePopup() {
  if (activePopup) {
    activePopup.remove();
    activePopup = null;
  }
}

// Close on outside click
document.addEventListener('click', (e) => {
  if (activePopup && !activePopup.contains(e.target) && !e.target.classList.contains('kanji-char')) {
    closePopup();
  }
});

/**
 * Show a kanji popup near the target element.
 * @param {string} char - The kanji character
 * @param {HTMLElement} targetEl - The element that was clicked
 */
async function showKanjiPopup(char, targetEl) {
  closePopup();

  const info = await lookupKanji(char);
  if (!info) return;

  const popup = h('div', { className: 'kanji-popup animate-scale-in' },
    // Header: big kanji + JLPT badge
    h('div', { className: 'kanji-popup-header' },
      h('span', { className: 'kanji-popup-literal' }, info.literal),
      h('div', { className: 'kanji-popup-badges' },
        info.jlpt ? h('span', { className: `kanji-badge jlpt-${info.jlpt}` }, 
          `N${info.jlpt === 4 ? '5/4' : info.jlpt === 3 ? '4/3' : info.jlpt === 2 ? '3/2' : '1'}`) : null,
        info.strokes ? h('span', { className: 'kanji-badge' }, `${info.strokes} nét`) : null,
        info.grade ? h('span', { className: 'kanji-badge' }, `Lớp ${info.grade}`) : null,
      )
    ),

    // Readings
    (info.on.length || info.kun.length || info.viet.length) 
      ? h('div', { className: 'kanji-popup-readings' },
          info.on.length ? h('div', { className: 'kanji-reading-row' },
            h('span', { className: 'kanji-reading-label' }, '音'),
            h('span', { className: 'kanji-reading-value' }, info.on.join('、'))
          ) : null,
          info.kun.length ? h('div', { className: 'kanji-reading-row' },
            h('span', { className: 'kanji-reading-label kun' }, '訓'),
            h('span', { className: 'kanji-reading-value' }, info.kun.join('、'))
          ) : null,
          info.viet.length ? h('div', { className: 'kanji-reading-row' },
            h('span', { className: 'kanji-reading-label viet' }, '越'),
            h('span', { className: 'kanji-reading-value' }, info.viet.join(', '))
          ) : null,
        )
      : null,

    // Meanings
    info.meaning.length 
      ? h('div', { className: 'kanji-popup-meanings' },
          h('span', { className: 'kanji-meaning-text' }, info.meaning.join(', '))
        )
      : null,
  );

  // Position popup near the clicked element
  const rect = targetEl.getBoundingClientRect();
  popup.style.position = 'fixed';
  popup.style.zIndex = '999';

  // Place below by default
  let top = rect.bottom + 8;
  let left = rect.left;

  // If it would go off-screen bottom, place above
  if (top + 200 > window.innerHeight) {
    top = rect.top - 208;
  }
  // If it would go off-screen right
  if (left + 260 > window.innerWidth) {
    left = window.innerWidth - 268;
  }
  if (left < 8) left = 8;

  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;

  document.body.appendChild(popup);
  activePopup = popup;
}

/**
 * Wrap kanji characters in a text string with clickable <span> elements.
 * Non-kanji text is left as plain text nodes.
 * @param {string} text - The text to process
 * @returns {HTMLElement} A <span> containing the processed text
 */
export function wrapKanjiChars(text) {
  const container = document.createElement('span');

  let buffer = '';
  for (const char of text) {
    if (isKanji(char)) {
      // Flush text buffer
      if (buffer) {
        container.appendChild(document.createTextNode(buffer));
        buffer = '';
      }
      // Create clickable kanji span
      const span = h('span', {
        className: 'kanji-char',
        onClick: (e) => {
          e.stopPropagation();
          showKanjiPopup(char, span);
        },
      }, char);
      container.appendChild(span);
    } else {
      buffer += char;
    }
  }
  // Flush remaining buffer
  if (buffer) {
    container.appendChild(document.createTextNode(buffer));
  }

  return container;
}
