import { h } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { ROUTES } from '../utils/constants.js';

export function renderAdminPanel() {
  const user = store.get('currentUser');
  
  // Extra safety check
  if (!user || user.role !== 'admin') {
    setTimeout(() => store.set('route', ROUTES.LIBRARY), 0);
    return h('div', {}, 'Đang chuyển hướng...');
  }

  return h('div', { className: 'page animate-fade-in' },
    h('div', { className: 'container', style: { maxWidth: '1000px', marginTop: '2rem' } },
      
      h('div', { className: 'hero-section', style: { padding: '3rem', borderRadius: '15px', background: 'linear-gradient(135deg, #0b0c2a 0%, #1e1e4a 100%)', marginBottom: '2rem', textAlign: 'center' } },
        h('h1', { style: { color: '#ffffff', marginBottom: '1rem', fontSize: '2.5rem' } }, 'Bảng Điều Khiển Quản Trị'),
        h('p', { style: { color: '#b7b7b7', fontSize: '1.1rem' } }, `Chào mừng ${user.name}. Bạn có toàn quyền quản lý nội dung của hệ thống.`)
      ),

      h('div', { className: 'grid', style: { gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' } },
        
        // Card: Tạo bài học
        h('div', { 
          className: 'card', 
          style: { cursor: 'pointer', textAlign: 'center', padding: '2rem', border: '1px solid #333' },
          onClick: () => store.set('route', ROUTES.UPLOAD)
        },
          h('div', { style: { fontSize: '4rem', marginBottom: '1rem' } }, '🎬'),
          h('h3', { style: { color: '#ffffff', marginBottom: '0.5rem' } }, 'Tạo bài học mới'),
          h('p', { style: { color: '#b7b7b7' } }, 'Thêm bài luyện nghe từ YouTube hoặc tải lên file Audio/Video.')
        ),

        // Card: Quản lý (Placeholder)
        h('div', { 
          className: 'card', 
          style: { opacity: '0.5', textAlign: 'center', padding: '2rem', border: '1px solid #333' }
        },
          h('div', { style: { fontSize: '4rem', marginBottom: '1rem' } }, '👥'),
          h('h3', { style: { color: '#ffffff', marginBottom: '0.5rem' } }, 'Quản lý Học viên'),
          h('p', { style: { color: '#b7b7b7' } }, 'Tính năng đang được phát triển.')
        )

      )
    )
  );
}
