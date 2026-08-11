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

  // Cinematic poster background
  let bgUrl = '';
  if (lesson.source_type === 'youtube' && lesson.yt_video_id) {
    bgUrl = `https://img.youtube.com/vi/${lesson.yt_video_id}/hqdefault.jpg`;
  } else {
    // Fallback gradient/color if no image
    bgUrl = `https://placehold.co/300x450/1d1e39/ffffff?text=${encodeURIComponent(lesson.title.substring(0, 15))}`;
  }

  const card = h('div', {
    className: 'anime-card animate-fade-in',
    onClick: () => onClick(lesson),
    id: `lesson-${lesson.id}`,
  },
    h('div', { 
      className: 'anime-card__pic', 
      style: { backgroundImage: `url('${bgUrl}')` } 
    },
      h('div', { className: 'ep' }, level.label),
      h('div', { className: 'meta-bottom' },
        h('div', { className: 'comment' }, `📝 ${lesson.sentence_count} câu`),
        h('div', { className: 'view' }, `🕒 ${formatTime(lesson.duration_seconds)}`)
      )
    ),
    h('div', { className: 'anime-card__text' },
      h('ul', {},
        h('li', {}, `${lang.flag} ${lang.name}`),
        lesson.source_type === 'youtube' ? h('li', {}, 'YouTube') : h('li', {}, 'Audio')
      ),
      h('h5', {}, lesson.title)
    )
  );

  return card;
}
