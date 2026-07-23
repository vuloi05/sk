/**
 * DictaFlow — Top Header Component
 */

import { h } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { ROUTES } from '../utils/constants.js';

export function renderHeader() {
  const header = h('header', { className: 'app-header' },
    h('div', { className: 'header-inner' },
      // Left: Logo
      h('a', {
        className: 'header-logo',
        onClick: (e) => {
          e.preventDefault();
          store.set('route', ROUTES.LIBRARY);
        },
        href: '#',
        innerHTML: `
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
            <defs>
              <linearGradient id="logo-grad-top" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#58cc02"/>
                <stop offset="100%" style="stop-color:#46a302"/>
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="14" fill="url(#logo-grad-top)"/>
            <text x="32" y="44" text-anchor="middle" font-family="Inter,sans-serif" font-weight="800" font-size="32" fill="white">D</text>
          </svg>
          <span>DictaFlow</span>
        `,
      }),

      // Right: Actions (Theme + Auth)
      h('div', { className: 'header-actions' },
        h('button', {
          className: 'btn btn-ghost btn-icon',
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
        
        // Auth UI
        (() => {
          const user = store.get('currentUser');
          if (user) {
            const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
            const fallback = user.user_metadata?.full_name?.charAt(0)?.toUpperCase() || 'U';

            // Wrapper relative for the dropdown popover
            const authWrap = h('div', { className: 'header-auth-wrap', style: { position: 'relative' } });

            const avatarBtn = avatarUrl 
              ? h('img', { 
                  src: avatarUrl,
                  className: 'header-avatar',
                  onClick: async () => {
                    const { toggleProfileDropdown } = await import('./ProfileDropdown.js');
                    toggleProfileDropdown(authWrap);
                  }
                })
              : h('div', { 
                  className: 'header-avatar fallback',
                  onClick: async () => {
                    const { toggleProfileDropdown } = await import('./ProfileDropdown.js');
                    toggleProfileDropdown(authWrap);
                  }
                }, fallback);
                
            authWrap.appendChild(avatarBtn);
            return authWrap;
          } else {
            return h('button', {
              className: 'btn btn-outline btn-sm',
              onClick: async () => {
                const { renderAuthModal } = await import('./AuthModal.js');
                const modal = renderAuthModal(() => {
                  modal.remove();
                });
                document.body.appendChild(modal);
              }
            }, 'Đăng nhập');
          }
        })()
      )
    )
  );

  return header;
}
