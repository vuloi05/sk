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
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#e53637"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#e53637" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span style="color: #ffffff;">DictaFlow</span>
        `,
      }),

      // Center: Nav Menu
      h('nav', { className: 'header-menu' },
        h('ul', {},
          h('li', { className: store.get('route') === ROUTES.LIBRARY ? 'active' : '' },
            h('a', {
              href: '#',
              onClick: (e) => { e.preventDefault(); store.set('route', ROUTES.LIBRARY); }
            }, 'Thư viện')
          ),
          h('li', { className: store.get('route') === ROUTES.VOCABULARY ? 'active' : '' },
            h('a', {
              href: '#',
              onClick: (e) => { e.preventDefault(); store.set('route', ROUTES.VOCABULARY); }
            }, 'Từ vựng')
          ),
          h('li', { className: store.get('route') === ROUTES.SETTINGS ? 'active' : '' },
            h('a', {
              href: '#',
              onClick: (e) => { e.preventDefault(); store.set('route', ROUTES.SETTINGS); }
            }, 'Cài đặt')
          )
        )
      ),

      // Right: Actions (Auth)
      h('div', { className: 'header-actions' },
        
        // Auth UI
        (() => {
          const user = store.get('currentUser');
          if (user) {
            const avatarUrl = user.avatar;
            const fallback = user.name?.charAt(0)?.toUpperCase() || 'U';

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
              className: 'btn btn-sm',
              style: { background: '#e53637', color: '#fff', border: 'none', fontWeight: '600', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer' },
              onClick: async () => {
                const { renderAuthModal } = await import('./AuthModal.js');
                const modal = renderAuthModal(() => {
                  modal.remove();
                });
                document.body.appendChild(modal);
              }
            }, 'ĐĂNG NHẬP');
          }
        })()
      )
    )
  );

  return header;
}
