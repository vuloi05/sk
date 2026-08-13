/**
 * DictaFlow — Lesson Library Component (Community Library)
 */

import { h, debounce, formatTime } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { fetchLessonsAPI, fetchLessonByIdAPI } from '../core/api.js';
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
    // Hero Section
    h('div', { id: 'hero-container' }),
    
    h('div', { className: 'container' },


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


/**
 * Render the Hero Section with top lessons
 */
function renderHeroSection(lessons) {
  const container = document.getElementById('hero-container');
  if (!container) return;
  
  // Pick up to 3 lessons for the hero carousel
  const heroLessons = lessons.slice(0, 3);
  
  const heroHtml = h('section', { className: 'hero' },
    h('div', { className: 'container' },
      h('div', { className: 'hero__slider swiper' },
        h('div', { className: 'swiper-wrapper' },
        ...heroLessons.map((lesson) => {
          let bgUrl = '';
          if (lesson.youtube_id) {
            bgUrl = `https://img.youtube.com/vi/${lesson.youtube_id}/maxresdefault.jpg`;
          } else {
            bgUrl = `https://picsum.photos/seed/${lesson._id}/1200/600`;
          }
          
          const lang = LANGUAGES[lesson.language]?.label || 'Khác';
          
          const slide = h('div', { 
            className: 'swiper-slide hero__items', 
            style: { backgroundImage: `url('${bgUrl}')` } 
          },
            h('div', { className: 'container' },
              h('div', { className: 'row' },
                h('div', { className: 'col-lg-6' },
                  h('div', { className: 'hero__text' },
                    h('div', { className: 'label' }, lang),
                    h('h2', {}, lesson.title),
                    h('p', {}, lesson.description || 'Tham gia luyện nghe qua bài học thú vị này để nâng cao trình độ của bạn!'),
                    h('a', { 
                      href: '#',
                      onClick: (e) => {
                        e.preventDefault();
                        openLessonDetail(lesson);
                      }
                    }, 
                      h('span', {}, 'HỌC NGAY'),
                      h('i', { className: 'fa fa-angle-right' })
                    )
                  )
                )
              )
            )
          );
          return slide;
        })
      ),
      // Add Pagination and Navigation elements inside swiper container
      h('div', { className: 'swiper-pagination' }),
      h('div', { className: 'swiper-button-prev' }, h('div', { className: 'swiper-button-prev-icon' }, '❮')),
      h('div', { className: 'swiper-button-next' }, h('div', { className: 'swiper-button-next-icon' }, '❯'))
    )
  )
);

  // Initialize Swiper after DOM is updated
  setTimeout(() => {
    if (window.Swiper) {
      new window.Swiper('.hero__slider', {
        effect: 'fade',
        fadeEffect: { crossFade: true },
        loop: true,
        autoplay: { delay: 4000, disableOnInteraction: false },
        speed: 1200, // same as smartSpeed in template
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
      });
    } else {
      console.warn("Swiper library not loaded.");
    }
  }, 100);

  container.innerHTML = '';
  container.appendChild(heroHtml);
}

/**
 * Load lessons from Backend and render them.
 */
async function loadAndRenderLessons() {
  const grid = document.getElementById('lesson-grid');
  if (!grid) return;


  try {
    const lessons = await fetchLessonsAPI();

    grid.innerHTML = '';

    if (lessons.length === 0) {
      const user = store.get('currentUser');
      grid.appendChild(
        h('div', { className: 'lesson-empty' },
          h('div', { className: 'lesson-empty-icon' }, '📭'),
          h('p', { style: { fontSize: 'var(--font-size-lg)', fontWeight: '600' } }, 'Chưa có bài luyện nào'),
          h('p', { className: 'text-secondary mt-sm' }, user?.role === 'admin' ? 'Bấm vào Trang Quản Trị để tạo bài mới.' : 'Vui lòng quay lại sau!'),
          user?.role === 'admin' ? h('button', {
            className: 'btn btn-primary mt-lg',
            onClick: () => store.set('route', ROUTES.ADMIN_PANEL),
          }, '⚙️ Trang Quản Trị') : null,
        ),
      );
      return;
    }

    if (lessons.length > 0) {
      renderHeroSection(lessons);
    }

    // Group lessons by Language and Level
    const grouped = {};
    for (const lesson of lessons) {
      const lang = LANGUAGES[lesson.language] ? LANGUAGES[lesson.language].name : 'Khác';
      const level = LEVELS[lesson.level] ? LEVELS[lesson.level].label : 'Khác';
      const key = `${lang} - ${level}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(lesson);
    }

    const layoutContainer = h('div', { className: 'lesson-groups' });
    
    for (const [groupName, groupLessons] of Object.entries(grouped)) {
      const groupSection = h('div', { className: 'trending__product' },
        h('div', { className: 'row' },
          h('div', { className: 'col-lg-12' },
            h('div', { className: 'section-title' },
              h('h4', {}, groupName)
            )
          )
        ),
        h('div', { className: 'row' },
          ...groupLessons.map(lesson => 
            h('div', { className: 'col-lg-3 col-md-4 col-sm-6' }, 
              renderLessonCard(lesson, (l) => openLessonDetail(l))
            )
          )
        )
      );
      layoutContainer.appendChild(groupSection);
    }

    grid.appendChild(layoutContainer);
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
  const user = store.get('currentUser');
  if (!user) {
    const { renderAuthModal } = await import('./AuthModal.js');
    const modal = renderAuthModal(() => {
      modal.remove();
    });
    document.body.appendChild(modal);
    return;
  }

  store.showLoading('Đang tải bài luyện...');

  try {
    const lessonData = await fetchLessonByIdAPI(lesson._id);
    const sentences = lessonData.transcript;

    // Load audio based on source type (Strategy Pattern)
    if (lessonData.youtube_id) {
      // YouTube lesson: extract video ID and load YouTube player
      await audioManager.loadYouTube(lessonData.youtube_id);
    } else if (lessonData.audio_url) {
      // Regular audio lesson
      audioManager.loadUrl(lessonData.audio_url);
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

