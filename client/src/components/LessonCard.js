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
  const level = LEVELS[lesson.level] || LEVELS.Unknown;

  // Cinematic poster background
  let bgUrl = '';
  if (lesson.youtube_id) {
    bgUrl = `https://img.youtube.com/vi/${lesson.youtube_id}/hqdefault.jpg`;
  } else {
    // Fallback gradient/color if no image
    bgUrl = `https://placehold.co/300x450/1d1e39/ffffff?text=${encodeURIComponent(lesson.title.substring(0, 15))}`;
  }

  const card = h('div', {
    className: 'anime-card product__item animate-fade-in',
    onClick: () => onClick(lesson),
    id: `lesson-${lesson._id || lesson.id}`,
  },
    h('div', { 
      className: 'product__item__pic anime-card__pic set-bg', 
      style: { backgroundImage: `url('${bgUrl}')` } 
    },
      h('div', { className: 'ep' }, formatTime(lesson.duration || 0)),
      h('div', { className: 'view level-badge' }, level.label)
    ),
    h('div', { className: 'product__item__text anime-card__text' },
      h('ul', {},
        h('li', {}, lang.name),
        ...(lesson.tags && lesson.tags.length > 0 ? [h('li', {}, lesson.tags[0])] : [])
      ),
      h('h5', {}, lesson.title)
    )
  );

  return card;
}
