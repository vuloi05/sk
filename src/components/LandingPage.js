/**
 * DictaFlow — Landing Page (HOME)
 *
 * Shown to non-authenticated users as the first impression.
 * Features hero section, feature highlights, and CTA.
 */

import { h } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { ROUTES } from '../utils/constants.js';

export function renderLandingPage() {
  const page = h('div', { className: 'landing-page' });

  // ─── Hero Section ───
  const hero = h('section', { className: 'landing-hero' });
  hero.innerHTML = `
    <div class="landing-hero-content animate-fade-in">
      <div class="landing-badge">🎧 Nền tảng luyện nghe miễn phí</div>
      <h1 class="landing-title">
        Luyện nghe tiếng Nhật & Anh<br/>
        bằng phương pháp <span class="landing-highlight">chép chính tả</span>
      </h1>
      <p class="landing-subtitle">
        Upload audio hoặc dán link YouTube → AI tự tạo bài luyện nghe → 
        Bạn chỉ cần nghe và viết lại. Đơn giản mà hiệu quả đến bất ngờ.
      </p>
      <div class="landing-cta-group">
        <button class="btn btn-primary btn-xl" id="landing-start">
          Khám phá thư viện →
        </button>
        <button class="btn btn-outline btn-xl" id="landing-login">
          Đăng nhập
        </button>
      </div>
      <div class="landing-social-proof">
        <span>✅ Không cần API key</span>
        <span>✅ Hoàn toàn miễn phí</span>
        <span>✅ Hỗ trợ tiếng Nhật & Anh</span>
      </div>
    </div>
  `;

  // Wire up buttons
  setTimeout(() => {
    const startBtn = page.querySelector('#landing-start');
    const loginBtn = page.querySelector('#landing-login');

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        store.set('route', ROUTES.LIBRARY);
      });
    }
    if (loginBtn) {
      loginBtn.addEventListener('click', async () => {
        const { renderAuthModal } = await import('./AuthModal.js');
        const modal = renderAuthModal(() => modal.remove());
        document.body.appendChild(modal);
      });
    }
  }, 0);

  page.appendChild(hero);

  // ─── Features Section ───
  const features = h('section', { className: 'landing-features' });
  features.innerHTML = `
    <h2 class="landing-section-title">Ba chế độ luyện tập, một mục tiêu</h2>
    <div class="landing-features-grid">
      <div class="landing-feature-card">
        <div class="landing-feature-icon">✍️</div>
        <h3>Chép chính tả</h3>
        <p>Nghe từng câu và viết lại toàn bộ. Phương pháp hiệu quả nhất để cải thiện kỹ năng nghe — được chứng minh bởi hàng triệu người học.</p>
      </div>
      <div class="landing-feature-card">
        <div class="landing-feature-icon">📝</div>
        <h3>Điền từ khuyết</h3>
        <p>Nghe và điền từ còn thiếu vào chỗ trống. Tập trung vào từ vựng khó và cách phát âm dễ nhầm lẫn.</p>
      </div>
      <div class="landing-feature-card">
        <div class="landing-feature-icon">🔤</div>
        <h3>Trắc nghiệm</h3>
        <p>Chọn đáp án đúng trong 4 phương án. Phù hợp cho người mới bắt đầu hoặc ôn tập nhanh.</p>
      </div>
    </div>
  `;
  page.appendChild(features);

  // ─── Kanji SRS Section ───
  const kanjiSection = h('section', { className: 'landing-kanji-section' });
  kanjiSection.innerHTML = `
    <div class="landing-kanji-content">
      <div class="landing-kanji-text">
        <h2 class="landing-section-title" style="text-align:left">🧠 Học Kanji chuẩn Anki</h2>
        <p>Hệ thống Flashcard thông minh dựa trên thuật toán SM-2 nổi tiếng. 
        Hơn 13.000 chữ Kanji từ bộ KANJIDIC2, phân loại theo cấp JLPT (N5 → N1).</p>
        <ul class="landing-kanji-list">
          <li>⏱️ Learning Steps: 1 phút → 10 phút → tốt nghiệp</li>
          <li>📈 Giãn cách thông minh: 1 ngày → 3 ngày → 8 ngày → ...</li>
          <li>☁️ Đồng bộ tiến độ lên Cloud (cần đăng nhập)</li>
        </ul>
      </div>
      <div class="landing-kanji-demo">
        <div class="landing-flashcard-demo">
          <div class="landing-flashcard-front">漢</div>
          <div class="landing-flashcard-label">Hán — Chinese</div>
          <div class="landing-flashcard-buttons">
            <span style="background:#da3633">Lại</span>
            <span style="background:#db6d28">Khó</span>
            <span style="background:#2da44e">Tốt</span>
            <span style="background:#0969da">Dễ</span>
          </div>
        </div>
      </div>
    </div>
  `;
  page.appendChild(kanjiSection);

  // ─── CTA Bottom ───
  const ctaBottom = h('section', { className: 'landing-cta-bottom' });
  ctaBottom.innerHTML = `
    <h2>Sẵn sàng bắt đầu?</h2>
    <p>Đăng nhập để mở khóa toàn bộ tính năng: tạo bài luyện, học Kanji SRS, và lưu tiến độ vĩnh viễn.</p>
    <button class="btn btn-primary btn-xl" id="landing-cta-login">Đăng nhập miễn phí</button>
  `;

  setTimeout(() => {
    const ctaLoginBtn = page.querySelector('#landing-cta-login');
    if (ctaLoginBtn) {
      ctaLoginBtn.addEventListener('click', async () => {
        const { renderAuthModal } = await import('./AuthModal.js');
        const modal = renderAuthModal(() => modal.remove());
        document.body.appendChild(modal);
      });
    }
  }, 0);

  page.appendChild(ctaBottom);

  // ─── Footer ───
  const footer = h('section', { className: 'landing-footer' });
  footer.innerHTML = `
    <p>DictaFlow — Nền tảng luyện nghe chép chính tả mã nguồn mở</p>
    <p style="opacity:0.6;font-size:0.85rem">
      © ${new Date().getFullYear()} DictaFlow. Phát triển bởi <a href="https://www.facebook.com/ro.i.90574" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">Vũ Lợi</a>. Built with ❤️ for language learners.
    </p>
  `;
  page.appendChild(footer);

  return page;
}
