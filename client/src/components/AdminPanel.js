import { h } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { ROUTES } from '../utils/constants.js';
import { renderAdminLessonList } from './AdminLessonList.js';

export function renderAdminPanel() {
  const user = store.get('currentUser');
  
  // Extra safety check
  if (!user || user.role !== 'admin') {
    setTimeout(() => store.set('route', ROUTES.LIBRARY), 0);
    return h('div', {}, 'Đang chuyển hướng...');
  }

  const panel = h('div', { className: 'page animate-fade-in' },
    h('div', { className: 'container', style: { maxWidth: '1200px', marginTop: '2rem' } },
      
      h('div', { className: 'hero-section', style: { padding: '2rem 3rem', borderRadius: '15px', background: 'linear-gradient(135deg, #0b0c2a 0%, #1e1e4a 100%)', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        h('div', {},
          h('h1', { style: { color: '#ffffff', marginBottom: '0.5rem', fontSize: '2rem' } }, 'Quản lý Kho Bài Học'),
          h('p', { style: { color: '#b7b7b7', fontSize: '1rem', margin: 0 } }, `Chào mừng ${user.name}.`)
        ),
        h('button', { 
          className: 'btn btn-primary', 
          onClick: () => store.set('route', ROUTES.UPLOAD),
          style: { padding: '0.75rem 1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }
        }, '➕ Tạo bài học mới')
      ),

      // Lesson List Container
      h('div', { id: 'admin-list-container' })
    )
  );

  // Render the list asynchronously inside the container
  setTimeout(() => {
    const listContainer = panel.querySelector('#admin-list-container');
    if (listContainer) {
      listContainer.appendChild(renderAdminLessonList());
    }
  }, 0);

  return panel;
}
