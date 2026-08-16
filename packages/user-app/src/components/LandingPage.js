/**
 * DictaFlow — Landing Page (HOME)
 *
 * Eduleb-inspired redesign with premium aesthetics.
 */

import {  h  } from '@dictaflow/shared';
import {  store  } from '@dictaflow/shared';
import {  ROUTES  } from '@dictaflow/shared';

export function renderLandingPage() {
  const page = h('div', { className: 'eduleb-landing animate-fade-in' });

  // ─── Navbar ───
  const nav = h('nav', { className: 'eduleb-nav' });
  nav.innerHTML = `
    <a href="#" class="eduleb-logo">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#525fe1"/>
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#525fe1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      DictaFlow
    </a>
    <ul class="eduleb-menu">
      <li><a href="#">Trang chủ</a></li>
      <li><a href="#features">Tính năng</a></li>
      <li><a href="#how-it-works">Cách học</a></li>
      <li><a href="#levels">Lộ trình</a></li>
    </ul>
    <div class="eduleb-auth">
      <button class="sign-in" id="landing-login">Đăng nhập</button>
      <button class="sign-up" id="landing-start">Học ngay</button>
    </div>
  `;
  page.appendChild(nav);

  // ─── Hero Section ───
  const hero = h('section', { className: 'eduleb-hero' });
  hero.innerHTML = `
    <div class="eduleb-hero-content">
      <div class="eduleb-hero-badge-top">
        <span class="badge-dot"></span>
        <span>Nền tảng luyện nghe hàng đầu</span>
      </div>
      <h1 class="eduleb-hero-title">
        <span>Học thông minh</span> — Nơi đôi tai gặp gỡ ngôn ngữ
      </h1>
      <p class="eduleb-hero-desc">
        Luyện nghe tiếng Anh qua phương pháp chép chính tả (Dictation) — phương pháp được chứng minh giúp tăng khả năng nhận diện âm thanh nhanh nhất.
      </p>
      <div class="eduleb-hero-actions">
        <button class="btn-hero-primary" id="hero-explore-btn">
          <i class="fa fa-play"></i> Bắt đầu học miễn phí
        </button>
        <a href="#how-it-works" class="btn-hero-ghost">
          <i class="fa fa-info-circle"></i> Tìm hiểu thêm
        </a>
      </div>
    </div>
    <div class="eduleb-hero-img">
      <div class="hero-image-wrapper">
        <div class="hero-shape hero-shape-1"></div>
        <div class="hero-shape hero-shape-2"></div>
        <div class="hero-shape hero-shape-3"></div>
        <img src="/assets/img/home-img2.png" alt="Student learning" class="main-img hero-girl-img" />
      </div>
    </div>
  `;
  page.appendChild(hero);

  // ─── Counter / Stats Section ───
  const stats = h('section', { className: 'eduleb-stats' });
  stats.innerHTML = `
    <div class="stats-container">
      <div class="stat-item">
        <div class="stat-icon"><i class="fa fa-book-open"></i></div>
        <h3 class="stat-number">50+</h3>
        <p>Bài học</p>
      </div>
      <div class="stat-item">
        <div class="stat-icon sc-two"><i class="fa fa-trophy"></i></div>
        <h3 class="stat-number">A1–C1</h3>
        <p>Trình độ</p>
      </div>
      <div class="stat-item">
        <div class="stat-icon sc-three"><i class="fa fa-headphones"></i></div>
        <h3 class="stat-number">1000+</h3>
        <p>Câu luyện tập</p>
      </div>
      <div class="stat-item">
        <div class="stat-icon sc-four"><i class="fa fa-shield-alt"></i></div>
        <h3 class="stat-number">100%</h3>
        <p>Miễn phí</p>
      </div>
    </div>
  `;
  page.appendChild(stats);

  // ─── How it works Section ───
  const howItWorks = h('section', { className: 'eduleb-how-it-works', id: 'how-it-works' });
  howItWorks.innerHTML = `
    <h2 class="eduleb-section-title">Bắt đầu hành trình cùng DictaFlow</h2>
    <p class="eduleb-section-desc">Quy trình học tập được tối ưu hóa cho hiệu quả tối đa, chỉ với 3 bước đơn giản.</p>
    <div class="eduleb-steps">
      <div class="eduleb-step">
        <span class="step-num sc-one">01</span>
        <h3>Chọn bài học</h3>
        <p>Truy cập Thư Viện để chọn các bài học phong phú đã được phân loại trình độ từ A1 đến C1 bởi thuật toán Oxford 5000.</p>
      </div>
      <div class="eduleb-step">
        <span class="step-num sc-two">02</span>
        <h3>Luyện nghe chép</h3>
        <p>Hệ thống tự động cắt âm thanh thành từng câu. Nghe, gõ lại những gì bạn nghe được và kiểm tra đáp án ngay tức khắc.</p>
      </div>
      <div class="eduleb-step">
        <span class="step-num sc-three">03</span>
        <h3>Theo dõi tiến bộ</h3>
        <p>Xem điểm số, phân tích lỗi sai và từ vựng cần cải thiện. Hệ thống ghi nhớ toàn bộ tiến trình của bạn.</p>
      </div>
    </div>
  `;
  page.appendChild(howItWorks);

  // ─── About / Why DictaFlow Section ───
  const about = h('section', { className: 'eduleb-about' });
  about.innerHTML = `
    <div class="about-content">
      <h2 class="eduleb-section-title" style="text-align: left;">Tại sao Dictation là phương pháp <b>hiệu quả nhất</b>?</h2>
      <p style="color: #6b6b84; line-height: 1.8; margin-bottom: 1.5rem;">
        Phương pháp chép chính tả (Dictation) buộc não bộ phải xử lý đồng thời 4 kỹ năng: Nghe, Nhận diện từ vựng, Chính tả và Ngữ pháp. Đây là phương pháp được nghiên cứu khoa học chứng minh giúp tăng cường phản xạ ngôn ngữ nhanh hơn gấp 3 lần so với chỉ nghe thụ động.
      </p>
      <ul class="about-checklist">
        <li><span class="check-icon">✓</span> <b>Học đúng năng lực:</b> Kho bài học phong phú được phân cấp rõ ràng từ dễ đến khó (A1-C1).</li>
        <li><span class="check-icon">✓</span> <b>Không lo choáng ngợp:</b> Luyện nghe từng câu ngắn lặp đi lặp lại giúp bạn bắt âm chuẩn xác nhất.</li>
        <li><span class="check-icon">✓</span> <b>Tiến bộ tức thì:</b> Chấm điểm thông minh và chỉ ra lỗi sai ngay lập tức sau mỗi câu bạn gõ.</li>
      </ul>
      <button class="btn-about-cta" id="about-cta-btn">Khám phá Thư Viện <i class="fa fa-arrow-right" style="margin-left: 8px;"></i></button>
    </div>
    <div class="about-img">
      <img src="/assets/img/about1.png" alt="About DictaFlow" />
    </div>
  `;
  page.appendChild(about);

  // ─── Features Section ───
  const features = h('section', { className: 'eduleb-features', id: 'features' });
  features.innerHTML = `
    <h2 class="eduleb-section-title">Khám phá sức mạnh của DictaFlow</h2>
    <p class="eduleb-section-desc">Bốn chế độ học tập cốt lõi được thiết kế theo phương pháp khoa học, giúp bạn nâng cao phản xạ nghe hiểu từ mọi góc độ.</p>
    <div class="eduleb-features-grid">
      <div class="eduleb-feature-card">
        <div class="eduleb-feature-header">
          <div class="eduleb-feature-num sc-one">01</div>
          <h3>Chép chính tả</h3>
        </div>
        <p>Nghe từng câu và viết lại toàn bộ. Phương pháp được khoa học ngôn ngữ chứng minh giúp tăng cường khả năng nhận diện âm thanh và phản xạ từ vựng.</p>
      </div>
      <div class="eduleb-feature-card">
        <div class="eduleb-feature-header">
          <div class="eduleb-feature-num sc-two">02</div>
          <h3>Điền từ khuyết</h3>
        </div>
        <p>Nghe và điền từ còn thiếu vào chỗ trống. Tập trung vào từ vựng khó và cách phát âm dễ nhầm lẫn nhất trong tiếng Anh.</p>
      </div>
      <div class="eduleb-feature-card">
        <div class="eduleb-feature-header">
          <div class="eduleb-feature-num sc-three">03</div>
          <h3>Trắc nghiệm</h3>
        </div>
        <p>Chọn đáp án đúng trong 4 phương án. Phù hợp cho người mới bắt đầu hoặc ôn tập nhanh kiến thức đã học.</p>
      </div>
      <div class="eduleb-feature-card">
        <div class="eduleb-feature-header">
          <div class="eduleb-feature-num sc-four">04</div>
          <h3>Phân tích từ vựng</h3>
        </div>
        <p>Hệ thống tự động nhận diện từ vựng khó, phân loại theo chuẩn Oxford 5000 và đề xuất bài ôn tập cá nhân hóa.</p>
      </div>
    </div>
  `;
  page.appendChild(features);

  // ─── Categories / Levels Section ───
  const categories = h('section', { className: 'eduleb-categories', id: 'levels' });
  categories.innerHTML = `
    <h2 class="eduleb-section-title">Khám phá các lộ trình phổ biến</h2>
    <p class="eduleb-section-desc">Từ những bước đầu chập chững (A1) cho đến thành thạo ngoại ngữ (C1). Hãy chọn lộ trình phù hợp với trình độ của bạn!</p>
    <div class="eduleb-cat-grid">
      <a href="#" class="eduleb-cat-item">
        <span class="cat-flag">🇬🇧</span> Tiếng Anh A1
      </a>
      <a href="#" class="eduleb-cat-item">
        <span class="cat-flag">🇬🇧</span> Tiếng Anh A2
      </a>
      <a href="#" class="eduleb-cat-item">
        <span class="cat-flag">🇬🇧</span> Tiếng Anh B1
      </a>
      <a href="#" class="eduleb-cat-item">
        <span class="cat-flag">🇬🇧</span> Tiếng Anh B2
      </a>
      <a href="#" class="eduleb-cat-item">
        <span class="cat-flag">🇬🇧</span> Tiếng Anh C1
      </a>
      <a href="#" class="eduleb-cat-item">
        <span class="cat-flag">🇯🇵</span> Tiếng Nhật N5
      </a>
      <a href="#" class="eduleb-cat-item">
        <span class="cat-flag">🇯🇵</span> Tiếng Nhật N4
      </a>
      <a href="#" class="eduleb-cat-item cat-item-accent">
        <span class="cat-flag">🎓</span> Luyện Thi IELTS
      </a>
    </div>
  `;
  page.appendChild(categories);

  // ─── Footer ───
  const footer = h('footer', { className: 'eduleb-footer' });
  footer.innerHTML = `
    <div class="footer-top">
      <div class="footer-brand">
        <a href="#" class="eduleb-logo" style="color: #fff;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#fff"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          DictaFlow
        </a>
        <p>Nền tảng luyện nghe ngoại ngữ mã nguồn mở.<br/>Phương pháp chép chính tả — khoa học & hiệu quả.</p>
      </div>
      <div class="footer-links">
        <h4>Liên kết</h4>
        <ul>
          <li><a href="#">Trang chủ</a></li>
          <li><a href="#features">Tính năng</a></li>
          <li><a href="#levels">Lộ trình</a></li>
        </ul>
      </div>
      <div class="footer-links">
        <h4>Hỗ trợ</h4>
        <ul>
          <li><a href="#">Hướng dẫn sử dụng</a></li>
          <li><a href="#">Báo lỗi</a></li>
          <li><a href="https://github.com/vuloivt/dictaflow" target="_blank">Mã nguồn (GitHub)</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© ${new Date().getFullYear()} DictaFlow. Phát triển bởi <a href="https://www.facebook.com/ro.i.90574" target="_blank" rel="noopener noreferrer">Vũ Lợi</a>. Built with ❤️ for language learners.</p>
    </div>
  `;
  page.appendChild(footer);

  // ─── Events ───
  setTimeout(() => {
    const startBtns = page.querySelectorAll('#landing-start, #hero-explore-btn, #about-cta-btn');
    const loginBtn = page.querySelector('#landing-login');
    const catItems = page.querySelectorAll('.eduleb-cat-item');

    startBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        store.set('route', ROUTES.LIBRARY);
      });
    });

    catItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        store.set('route', ROUTES.LIBRARY);
      });
    });

    if (loginBtn) {
      loginBtn.addEventListener('click', async () => {
        const { renderAuthModal } = await import('./AuthModal.js');
        const modal = renderAuthModal(() => modal.remove());
        document.body.appendChild(modal);
      });
    }
  }, 0);

  return page;
}
