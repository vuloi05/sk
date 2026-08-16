import {  h  } from '@dictaflow/shared';
import {  store  } from '@dictaflow/shared';
import {  ROUTES  } from '@dictaflow/shared';
import { renderAdminLessonList } from './AdminLessonList.js';
import { renderAdminVipCodeList } from './AdminVipCodeList.js';

export function renderAdminPanel() {
  const user = store.get('currentUser');
  
  // Extra safety check
  if (!user || user.role !== 'admin') {
    setTimeout(() => store.set('route', ROUTES.LIBRARY), 0);
    return h('div', {}, 'Đang chuyển hướng...');
  }

  let currentTab = 'lessons';

  const panel = h('div', { className: 'page animate-fade-in' },
    h('div', { className: 'container', style: { maxWidth: '1200px', marginTop: '2rem' } },
      
      h('div', { className: 'hero-section', style: { padding: '2rem 3rem', borderRadius: '15px', background: 'linear-gradient(135deg, #0b0c2a 0%, #1e1e4a 100%)', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        h('div', {},
          h('h1', { style: { color: '#ffffff', marginBottom: '0.5rem', fontSize: '2rem' } }, 'Bảng Điều Khiển'),
          h('p', { style: { color: '#b7b7b7', fontSize: '1rem', margin: 0 } }, `Chào mừng ${user.name}.`)
        )
      ),

      // Tabs Header
      h('div', { style: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #333' }, id: 'admin-tabs' }),

      // Content Container
      h('div', { id: 'admin-content-container' })
    )
  );

  const renderTabs = () => {
    const tabsContainer = panel.querySelector('#admin-tabs');
    const contentContainer = panel.querySelector('#admin-content-container');
    if (!tabsContainer || !contentContainer) return;

    tabsContainer.innerHTML = '';
    
    const tabLessons = h('div', { 
      style: { padding: '0.75rem 1.5rem', cursor: 'pointer', transition: 'all 0.2s', borderBottom: currentTab === 'lessons' ? '2px solid #e53637' : '2px solid transparent', color: currentTab === 'lessons' ? '#fff' : '#888', fontWeight: currentTab === 'lessons' ? 'bold' : 'normal' },
      onClick: () => { currentTab = 'lessons'; renderTabs(); }
    }, '📚 Quản lý Bài Học');

    const tabVipCodes = h('div', { 
      style: { padding: '0.75rem 1.5rem', cursor: 'pointer', transition: 'all 0.2s', borderBottom: currentTab === 'vipcodes' ? '2px solid #e53637' : '2px solid transparent', color: currentTab === 'vipcodes' ? '#fff' : '#888', fontWeight: currentTab === 'vipcodes' ? 'bold' : 'normal' },
      onClick: () => { currentTab = 'vipcodes'; renderTabs(); }
    }, '🔑 Quản lý Mã VIP');

    tabsContainer.appendChild(tabLessons);
    tabsContainer.appendChild(tabVipCodes);

    contentContainer.innerHTML = '';
    if (currentTab === 'lessons') {
      const topAction = h('div', { style: { display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' } },
        h('button', { 
          className: 'btn btn-primary', 
          onClick: () => store.set('route', ROUTES.UPLOAD),
          style: { padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }
        }, '➕ Tạo bài học mới')
      );
      contentContainer.appendChild(topAction);
      contentContainer.appendChild(renderAdminLessonList());
    } else if (currentTab === 'vipcodes') {
      contentContainer.appendChild(renderAdminVipCodeList());
    }
  };

  // Render the list asynchronously inside the container
  setTimeout(() => renderTabs(), 0);

  return panel;
}
