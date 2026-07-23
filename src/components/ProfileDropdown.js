import { h } from '../utils/helpers.js';
import { store } from '../core/store.js';

let activeDropdown = null;

/**
 * Toggle the Profile Dropdown Popover
 * @param {HTMLElement} parentElement The element to attach the dropdown to (relative)
 */
export function toggleProfileDropdown(parentElement) {
  // If already open, close it
  if (activeDropdown) {
    activeDropdown.remove();
    activeDropdown = null;
    return;
  }

  const user = store.get('currentUser');
  if (!user) return;

  const fullName = user.user_metadata?.full_name || 'Người dùng';
  const email = user.email;

  const handleLogout = async () => {
    if (activeDropdown) activeDropdown.remove();
    activeDropdown = null;
    const { signOutUser } = await import('../core/supabase.js');
    await signOutUser();
  };

  const dropdown = h('div', { className: 'profile-dropdown' },
    h('div', { className: 'dropdown-header' },
      h('div', { className: 'dropdown-name' }, fullName),
      h('div', { className: 'dropdown-email' }, email)
    ),
    h('div', { className: 'dropdown-divider' }),
    h('div', { className: 'dropdown-menu' },
      h('button', { className: 'dropdown-item' }, '⭐ Nâng cấp Premium'),
      h('button', { className: 'dropdown-item' }, '👥 Giới thiệu bạn bè'),
      h('button', { className: 'dropdown-item' }, '⚙️ Cài đặt'),
    ),
    h('div', { className: 'dropdown-divider' }),
    h('div', { className: 'dropdown-menu' },
      h('button', { 
        className: 'dropdown-item dropdown-item-danger',
        onClick: handleLogout
      }, 'Thoát tài khoản')
    )
  );

  activeDropdown = dropdown;
  parentElement.appendChild(dropdown);

  // Close when clicking outside
  setTimeout(() => {
    const outsideClickListener = (e) => {
      if (activeDropdown && !activeDropdown.contains(e.target) && !parentElement.contains(e.target)) {
        activeDropdown.remove();
        activeDropdown = null;
        document.removeEventListener('click', outsideClickListener);
      }
    };
    document.addEventListener('click', outsideClickListener);
  }, 0);
}
