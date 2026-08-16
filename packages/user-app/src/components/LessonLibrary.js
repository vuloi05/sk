/**
 * DictaFlow — Lesson Library Component (Community Library)
 */

import {  h, debounce, formatTime  } from '@dictaflow/shared';
import {  store  } from '@dictaflow/shared';
import {  fetchLessonsAPI, fetchLessonByIdAPI, redeemVipCodeAPI  } from '@dictaflow/shared';
import {  audioManager  } from '@dictaflow/shared';
import { renderLessonCard } from './LessonCard.js';
import {  showToast  } from '@dictaflow/shared';
import {  ROUTES, LANGUAGES, LEVELS, MODES  } from '@dictaflow/shared';

/**
 * Render the lesson library page.
 * @returns {HTMLElement}
 */
export function renderLibrary() {
  const page = h('div', { className: 'page' },
    // Vùng chứa (không còn Hero Banner ở đây nữa)
    
    h('div', { className: 'container', style: { paddingTop: '40px' } },


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

    // (Không hiển thị banner nổi bật ở đây nữa, đã chuyển sang HomePage)

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
export async function openLessonDetail(lesson) {
  const user = store.get('currentUser');
  if (!user) {
    const { renderAuthModal } = await import('./AuthModal.js');
    const modal = renderAuthModal(() => {
      modal.remove();
    });
    document.body.appendChild(modal);
    return;
  }

  // VIP Access Logic
  if (lesson.isVip && user.role !== 'admin') {
    const isUniversal = user.isUniversalVip === true;
    const isUnlocked = user.unlockedVipLessons && user.unlockedVipLessons.includes(lesson._id);
    if (!isUniversal && !isUnlocked) {
      showVipModal(lesson);
      return;
    }
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

/**
 * Show VIP access modal
 */
function showVipModal(lesson) {
  const overlay = h('div', { 
    style: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' } 
  });

  const modal = h('div', { 
    className: 'card animate-scale-up', 
    style: { width: '450px', maxWidth: '90%', padding: '2rem', textAlign: 'center' } 
  });

  modal.innerHTML = `
    <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
    <h3 style="margin-bottom: 1rem; color: #ffd700;">Bài Học VIP Độc Quyền</h3>
    <p style="color: #ccc; margin-bottom: 1.5rem; line-height: 1.5;">
      Bài học <strong>"${lesson.title}"</strong> thuộc danh mục VIP. Bạn cần có <strong>Mã Mở Khóa</strong> do quản trị viên cung cấp để truy cập.
    </p>
    <div style="margin-bottom: 1.5rem; background: #111226; padding: 1rem; border-radius: 8px;">
      <p style="font-size: 0.9rem; color: #aaa; margin-bottom: 0.5rem;">👉 Nhận mã tại Fanpage:</p>
      <a href="https://www.facebook.com/ro.i.90574" target="_blank" style="color: #e53637; font-weight: bold; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.04c-5.5 0-10 4.48-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.54-4.5-10.02-10-10.02z"/></svg>
        Liên hệ Admin Vũ Lợi
      </a>
    </div>
    <div style="margin-bottom: 1.5rem">
      <input type="text" id="vip-code-input" class="input" placeholder="Nhập mã mở khóa vào đây..." style="text-align: center; text-transform: uppercase; font-size: 1.1rem; padding: 0.75rem;">
    </div>
    <div style="display: flex; gap: 1rem; justify-content: center;">
      <button class="btn btn-secondary" id="vip-cancel-btn" style="flex: 1">Đóng</button>
      <button class="btn btn-primary" id="vip-redeem-btn" style="flex: 1">🔓 Mở Khóa</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const closeModal = () => {
    overlay.style.animation = 'fadeOut 0.2s ease-out forwards';
    setTimeout(() => overlay.remove(), 200);
  };

  modal.querySelector('#vip-cancel-btn').onclick = closeModal;

  modal.querySelector('#vip-redeem-btn').onclick = async () => {
    const code = modal.querySelector('#vip-code-input').value.trim();
    if (!code) {
      return showToast('Vui lòng nhập mã mở khóa', 'error');
    }

    const btn = modal.querySelector('#vip-redeem-btn');
    try {
      btn.disabled = true;
      btn.textContent = 'Đang xử lý...';

      const res = await redeemVipCodeAPI(code);
      
      // Update local store
      const user = store.get('currentUser');
      user.isUniversalVip = res.isUniversalVip;
      user.unlockedVipLessons = res.unlockedVipLessons;
      store.set('currentUser', user);
      localStorage.setItem('dictaflow_user', JSON.stringify(user));

      showToast('Mở khóa thành công! Đang vào bài học...', 'success');
      closeModal();
      
      // Auto open lesson
      openLessonDetail(lesson);
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
      btn.disabled = false;
      btn.textContent = '🔓 Mở Khóa';
    }
  };
}

