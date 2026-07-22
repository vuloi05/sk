/**
 * DictaFlow — Header Component
 */

import { h } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { ROUTES } from '../utils/constants.js';

/**
 * Render the app header.
 * @returns {HTMLElement}
 */
export function renderHeader() {
  const header = h('header', { className: 'app-header' },
    h('div', { className: 'header-inner' },
      // Logo
      h('a', {
        className: 'header-logo',
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
      h('nav', { className: 'header-nav' },
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
          ? h('div', { className: 'user-profile flex items-center gap-xs ml-md' },
              h('div', { 
                className: 'avatar',
                style: {
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'var(--color-primary)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: '14px', cursor: 'pointer'
                },
                onClick: async () => {
                  if (confirm('Bạn muốn đăng xuất?')) {
                    const { signOutUser } = await import('../core/supabase.js');
                    await signOutUser();
                  }
                }
              }, store.get('currentUser').user_metadata?.full_name?.charAt(0)?.toUpperCase() || 'U')
            )
          : h('button', {
              className: 'btn btn-outline btn-sm ml-md',
              onClick: async () => {
                const { renderAuthModal } = await import('./AuthModal.js');
                const modal = renderAuthModal(() => {
                  modal.remove();
                });
                document.body.appendChild(modal);
              }
            }, 'Đăng nhập')
      ),
    ),
  );

  return header;
}
