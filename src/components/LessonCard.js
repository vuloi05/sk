/**
 * DictaFlow — Lesson Card Component
 */

import { h, formatTime } from '../utils/helpers.js';
import { LANGUAGES, LEVELS } from '../utils/constants.js';

/**
 * Render a lesson card for the library grid.
 * @param {Object} lesson
 * @param {Function} onClick - Called when card is clicked
 * @returns {HTMLElement}
 */
export function renderLessonCard(lesson, onClick) {
  const lang = LANGUAGES[lesson.language] || LANGUAGES.en;
  const level = LEVELS[lesson.level] || LEVELS.beginner;

  const tags = (lesson.tags || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
    .slice(0, 3);

  const card = h('div', {
    className: 'card card-clickable lesson-card animate-fade-in',
    onClick: () => onClick(lesson),
    id: `lesson-${lesson.id}`,
  },
    // Header
    h('div', { className: 'lesson-card-header' },
      h('div', { className: 'lesson-card-title' }, lesson.title),
      h('span', { className: `badge badge-${lesson.language}` }, `${lang.flag} ${lang.code.toUpperCase()}`),
    ),

    // Description
    lesson.description
      ? h('p', { className: 'text-sm text-secondary', style: { marginTop: '-4px' } }, lesson.description)
      : null,

    // Meta
    h('div', { className: 'lesson-card-meta' },
      h('span', { className: 'lesson-card-meta-item' },
        '🕒 ', formatTime(lesson.duration_seconds),
      ),
      h('span', { className: 'lesson-card-meta-item' },
        '📝 ', `${lesson.sentence_count} câu`,
      ),
      h('span', { className: `badge badge-${level.color}` }, level.label),
    ),

    // Tags
    tags.length > 0
      ? h('div', { className: 'lesson-card-tags' },
          ...tags.map(tag => h('span', { className: 'badge badge-purple' }, `#${tag}`)),
        )
      : null,
  );

  return card;
}
