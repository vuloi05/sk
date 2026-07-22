import { h } from '../utils/helpers.js';
import { store } from '../core/store.js';

/**
 * Render the Profile Modal
 * @param {Function} onClose 
 */
export function renderProfileModal(onClose) {
  const user = store.get('currentUser');
  if (!user) return null;

  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const fullName = user.user_metadata?.full_name || 'Người dùng';
  const email = user.email;

  const handleLogout = async () => {
    onClose();
    const { signOutUser } = await import('../core/supabase.js');
    await signOutUser();
  };

  const overlay = h('div', { className: 'modal-overlay', onClick: (e) => {
    if (e.target === overlay) onClose();
  }});

  const modal = h('div', { className: 'modal profile-modal', style: { textAlign: 'center', maxWidth: '400px' } },
    // Avatar
    avatarUrl 
      ? h('img', { 
          src: avatarUrl, 
          style: {
            width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover',
            border: '2px solid var(--color-border)', margin: '0 auto', display: 'block',
            boxShadow: 'var(--shadow-sm)'
          },
          alt: fullName 
        })
      : h('div', { 
          style: {
            width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-primary)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', fontWeight: 'bold', margin: '0 auto', border: '2px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)'
          }
        }, fullName.charAt(0).toUpperCase()),
    
    // User Info
    h('h2', { className: 'mt-md mb-xs' }, fullName),
    h('p', { className: 'text-secondary mb-xl' }, email),
    
    // Actions
    h('div', { className: 'flex gap-md justify-center' },
      h('button', { className: 'btn btn-ghost', onClick: onClose }, 'Đóng'),
      h('button', { 
        className: 'btn btn-orange', 
        onClick: handleLogout 
      }, 'Đăng xuất')
    )
  );

  overlay.appendChild(modal);
  return overlay;
}
