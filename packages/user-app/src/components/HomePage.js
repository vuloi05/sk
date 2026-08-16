/**
 * DictaFlow — Home Page Component
 */

import {  h  } from '@dictaflow/shared';
import {  fetchLessonsAPI  } from '@dictaflow/shared';
import {  LANGUAGES  } from '@dictaflow/shared';
import { openLessonDetail } from './LessonLibrary.js';

export function renderHomePage() {
  const page = h('div', { className: 'page' },
    h('div', { id: 'home-hero-container' })
  );

  setTimeout(() => loadAndRenderHero(), 50);

  return page;
}

async function loadAndRenderHero() {
  const container = document.getElementById('home-hero-container');
  if (!container) return;

  try {
    const lessons = await fetchLessonsAPI();
    
    if (lessons.length === 0) {
      container.appendChild(
        h('div', { className: 'container mt-xl text-center' },
          h('p', {}, 'Chưa có bài luyện nào.')
        )
      );
      return;
    }

    // Pick up to 3 lessons for the hero carousel
    const heroLessons = lessons.slice(0, 3);
    
    const heroHtml = h('section', { className: 'hero', style: { padding: '0', minHeight: '80vh', display: 'flex', alignItems: 'center', marginTop: '-30px' } },
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

    container.innerHTML = '';
    container.appendChild(heroHtml);

    // Initialize Swiper after DOM is updated
    setTimeout(() => {
      if (window.Swiper) {
        new window.Swiper('.hero__slider', {
          effect: 'fade',
          fadeEffect: { crossFade: true },
          loop: true,
          autoplay: { delay: 4000, disableOnInteraction: false },
          speed: 1200,
          pagination: { el: '.swiper-pagination', clickable: true },
          navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
        });
      }
    }, 100);

  } catch (err) {
    console.error('[HomePage] Load error:', err);
  }
}
