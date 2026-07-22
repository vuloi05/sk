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
  const sidebar = h('aside', { className: 'app-sidebar' },
    h('div', { className: 'sidebar-inner' },
      // Logo
      h('a', {
        className: 'sidebar-logo',
        onClick: (e) => {
          e.preventDefault();
          store.set('route', ROUTES.LIBRARY);
        },
        href: '#',
        innerHTML: `
          <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
            <defs>
              <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#58cc02"/>
                <stop offset="100%" style="stop-color:#46a302"/>
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="14" fill="url(#logo-grad)"/>
            <text x="32" y="44" text-anchor="middle" font-family="Inter,sans-serif" font-weight="800" font-size="32" fill="white">D</text>
          </svg>
          <span>DictaFlow</span>
        `,
      }),
      // Navigation
      h('nav', { className: 'sidebar-nav' },
        h('button', {
          className: 'btn btn-ghost btn-sm',
          onClick: () => store.set('route', ROUTES.LIBRARY),
          id: 'nav-library',
        }, '📚 Thư viện'),
        h('button', {
          className: 'btn btn-ghost btn-sm',
          onClick: () => store.set('route', ROUTES.UPLOAD),
          id: 'nav-upload',
        }, '➕ Tạo bài'),
        h('button', {
          className: 'btn btn-ghost btn-sm',
          id: 'nav-theme',
          title: 'Đổi giao diện (Sáng/Tối)',
          onClick: (e) => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const newTheme = isDark ? 'light' : 'dark';
            if (newTheme === 'dark') {
              document.documentElement.setAttribute('data-theme', 'dark');
            } else {
              document.documentElement.removeAttribute('data-theme');
            }
            localStorage.setItem('dictaflow_theme', newTheme);
            e.currentTarget.innerText = newTheme === 'dark' ? '🌞' : '🌙';
          }
        }, document.documentElement.getAttribute('data-theme') === 'dark' ? '🌞' : '🌙'),
        h('button', {
          className: 'btn btn-ghost btn-sm',
          onClick: () => store.set('route', ROUTES.SETTINGS),
          id: 'nav-settings',
        }, '⚙️'),
        
        // Auth UI
        store.get('currentUser') 
          ? (() => {
              const user = store.get('currentUser');
              const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
              const fallback = user.user_metadata?.full_name?.charAt(0)?.toUpperCase() || 'U';

              return h('div', { className: 'user-profile flex items-center gap-xs mt-md' },
                avatarUrl 
                  ? h('img', { 
                      src: avatarUrl,
                      style: {
                        width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer',
                        objectFit: 'cover', border: '2px solid var(--color-border)'
                      },
                      onClick: async () => {
                        const { renderProfileModal } = await import('./ProfileModal.js');
                        const modal = renderProfileModal(() => modal.remove());
                        if (modal) document.body.appendChild(modal);
                      }
                    })
                  : h('div', { 
                      className: 'avatar',
                      style: {
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'var(--color-primary)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold', fontSize: '18px', cursor: 'pointer',
                        border: '2px solid var(--color-border)'
                      },
                      onClick: async () => {
                        const { renderProfileModal } = await import('./ProfileModal.js');
                        const modal = renderProfileModal(() => modal.remove());
                        if (modal) document.body.appendChild(modal);
                      }
                    }, fallback)
              );
            })()
          : h('button', {
              className: 'btn btn-outline btn-sm mt-md w-full',
              onClick: async () => {
                const { renderAuthModal } = await import('./AuthModal.js');
                const modal = renderAuthModal(() => {
                  modal.remove();
                });
                document.body.appendChild(modal);
              }
            }, 'Đăng nhập')
      )
    )
  );

  return sidebar;
}
