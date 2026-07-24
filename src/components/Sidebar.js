/**
 * DictaFlow — Sidebar Component
 */

import { h } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { ROUTES } from '../utils/constants.js';

/**
 * Render the app header.
 * @returns {HTMLElement}
 */
export function renderSidebar() {
  const user = store.get('currentUser');

  const sidebar = h('aside', { className: 'app-sidebar' },
    h('div', { className: 'sidebar-inner' },
      // Navigation
      h('nav', { className: 'sidebar-nav' },
        h('button', {
          className: 'btn btn-ghost btn-sm',
          onClick: () => store.set('route', ROUTES.LIBRARY),
          id: 'nav-library',
        }, '📚 Thư viện'),
        
        // Auth-gated nav items
        ...(user ? [
          h('button', {
            className: 'btn btn-ghost btn-sm',
            onClick: () => store.set('route', ROUTES.UPLOAD),
            id: 'nav-upload',
          }, '➕ Tạo bài'),
          h('button', {
            className: 'btn btn-ghost btn-sm',
            onClick: () => store.set('route', ROUTES.VOCABULARY),
            id: 'nav-vocabulary',
          }, '🧠 Học Kanji (SRS)')
        ] : []),

        h('button', {
          className: 'btn btn-ghost btn-sm',
          onClick: () => store.set('route', ROUTES.SETTINGS),
          id: 'nav-settings',
        }, '⚙️ Cài đặt')
      )
    )
  );

  return sidebar;
}
