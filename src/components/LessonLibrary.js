/**
 * DictaFlow — Lesson Library Component (Community Library)
 */

import { h, debounce } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { fetchLessons, fetchLesson, getAudioUrl, isSupabaseConfigured } from '../core/supabase.js';
import { audioManager } from '../core/audioManager.js';
import { renderLessonCard } from './LessonCard.js';
import { showToast } from './Toast.js';
import { ROUTES, LANGUAGES, LEVELS, MODES } from '../utils/constants.js';

/**
 * Render the lesson library page.
 * @returns {HTMLElement}
 */
export function renderLibrary() {
  const page = h('div', { className: 'page' },
    h('div', { className: 'container' },
      // Header
      h('div', { className: 'library-header animate-slide-down' },
        h('h1', {}, '🎧 Thư viện bài luyện'),
        h('p', {}, 'Chọn bài từ cộng đồng và bắt đầu luyện nghe ngay — không cần API key!'),
      ),

      // Filters
      h('div', { className: 'library-filters', id: 'library-filters' }),

      // Lesson grid
      h('div', { className: 'lesson-grid stagger-children', id: 'lesson-grid' },
        h('div', { className: 'lesson-empty' },
          h('div', { className: 'loading-spinner', style: { margin: '0 auto var(--space-md)' } }),
          h('p', {}, 'Đang tải bài luyện...'),
        ),
      ),
    ),
  );

  // Load lessons after render
  setTimeout(() => loadAndRenderLessons(), 50);

  return page;
}

/** Current filter state */
let currentFilters = { language: null, level: null, search: '' };

/**
 * Render filter chips.
 */
function renderFilters() {
  const container = document.getElementById('library-filters');
  if (!container) return;
  container.innerHTML = '';

  // Search input
  const searchInput = h('input', {
    className: 'input',
    type: 'search',
    placeholder: '🔍 Tìm bài luyện...',
    style: { maxWidth: '250px', flexShrink: 0 },
    value: currentFilters.search,
    onInput: debounce((e) => {
      currentFilters.search = e.target.value;
      loadAndRenderLessons();
    }, 400),
  });
  container.appendChild(searchInput);

  // Divider
  container.appendChild(h('span', { style: { width: '1px', height: '24px', background: 'var(--color-border)' } }));

  // Language filters
  const allLangChip = createFilterChip('Tất cả', !currentFilters.language, () => {
    currentFilters.language = null;
    renderFilters();
    loadAndRenderLessons();
  });
  container.appendChild(allLangChip);

  for (const lang of Object.values(LANGUAGES)) {
    const chip = createFilterChip(
      `${lang.flag} ${lang.label}`,
      currentFilters.language === lang.code,
      () => {
        currentFilters.language = currentFilters.language === lang.code ? null : lang.code;
        renderFilters();
        loadAndRenderLessons();
      },
    );
    container.appendChild(chip);
  }

  // Divider
  container.appendChild(h('span', { style: { width: '1px', height: '24px', background: 'var(--color-border)' } }));

  // Level filters
  for (const level of Object.values(LEVELS)) {
    const chip = createFilterChip(
      level.label,
      currentFilters.level === level.code,
      () => {
        currentFilters.level = currentFilters.level === level.code ? null : level.code;
        renderFilters();
        loadAndRenderLessons();
      },
    );
    container.appendChild(chip);
  }
}

function createFilterChip(label, isActive, onClick) {
  return h('button', {
    className: `filter-chip ${isActive ? 'active' : ''}`,
    onClick,
  }, label);
}

/**
 * Load lessons from Supabase and render them.
 */
async function loadAndRenderLessons() {
  const grid = document.getElementById('lesson-grid');
  if (!grid) return;

  // Render filters on first call
  renderFilters();

  try {
    const lessons = await fetchLessons(currentFilters);

    grid.innerHTML = '';

    if (lessons.length === 0) {
      grid.appendChild(
        h('div', { className: 'lesson-empty' },
          h('div', { className: 'lesson-empty-icon' }, '📭'),
          h('p', { style: { fontSize: 'var(--font-size-lg)', fontWeight: '600' } }, 'Chưa có bài luyện nào'),
          h('p', { className: 'text-secondary mt-sm' }, 'Hãy là người đầu tiên tạo bài!'),
          h('button', {
            className: 'btn btn-primary mt-lg',
            onClick: () => store.set('route', ROUTES.UPLOAD),
          }, '➕ Tạo bài luyện'),
        ),
      );
      return;
    }

    for (const lesson of lessons) {
      const card = renderLessonCard(lesson, (l) => openLessonDetail(l));
      grid.appendChild(card);
    }
  } catch (err) {
    console.error('[Library] Load error:', err);
    grid.innerHTML = '';
    grid.appendChild(
      h('div', { className: 'lesson-empty' },
        h('div', { className: 'lesson-empty-icon' }, '⚠️'),
        h('p', {}, 'Không thể tải bài luyện. Vui lòng thử lại.'),
      ),
    );
  }
}

/**
 * Open lesson detail → mode select.
 * @param {Object} lesson
 */
async function openLessonDetail(lesson) {
  store.showLoading('Đang tải bài luyện...');

  try {
    const { lesson: lessonData, sentences } = await fetchLesson(lesson.id);

    // Load audio
    if (lessonData.audio_path && isSupabaseConfigured()) {
      const audioUrl = getAudioUrl(lessonData.audio_path);
      audioManager.loadUrl(audioUrl);
    }

    store.update({
      currentLesson: lessonData,
      currentSentences: sentences,
      currentSentenceIndex: 0,
      practiceResults: [],
    });

    store.hideLoading();
    store.set('route', ROUTES.MODE_SELECT);
  } catch (err) {
    store.hideLoading();
    showToast(err.message || 'Không thể tải bài luyện.', 'error');
  }
}
