/**
 * DictaFlow — Admin Auth Modal Component
 * Simplified login form exclusively for Admin.
 */

import { h, store, login, showToast } from '@dictaflow/shared';

export function renderAuthModal(onClose) {
  let isLoading = false;
  let errorMsg = '';
  
  const wrapper = document.createElement('div');

  const handleLoginSuccess = (userData) => {
    localStorage.setItem('dictaflow_token', userData.token);
    const { token, ...userWithoutToken } = userData;
    localStorage.setItem('dictaflow_user', JSON.stringify(userWithoutToken));
    store.set('currentUser', userWithoutToken);
    showToast('Đăng nhập thành công!', 'success');
    onClose();
  };

  const updateDOM = () => {
    wrapper.innerHTML = '';
    
    const content = h('div', { className: 'auth-overlay animate-fade-in', id: 'auth-modal' },
      h('section', { className: 'auth-breadcrumb' },
        h('div', { className: 'auth-breadcrumb-overlay' }),
        h('div', { className: 'auth-breadcrumb-content' }, 
          h('h2', {}, 'Quản trị viên'), 
          h('p', {}, 'Đăng nhập vào hệ thống quản lý DictaFlow.')
        ),
        h('button', { className: 'auth-close-btn', onClick: onClose }, '✕')
      ),
      h('section', { className: 'auth-section' },
        h('div', { className: 'auth-container', style: { maxWidth: '500px', margin: '0 auto' } },
          h('div', { className: 'auth-row' },
            h('div', { className: 'auth-form-col', style: { width: '100%', paddingRight: '0', borderRight: 'none' } },
              h('div', { className: 'auth-form' },
                h('h3', {}, 'Đăng nhập Admin'),
                errorMsg ? h('div', { className: 'auth-error' }, errorMsg) : null,
                h('form', {
                  onSubmit: async (e) => {
                    e.preventDefault(); 
                    isLoading = true; 
                    errorMsg = ''; 
                    updateDOM();
                    try {
                      const userData = await login(e.target.email.value.trim(), e.target.password.value);
                      if (userData.role !== 'admin') {
                        errorMsg = 'Tài khoản không có quyền quản trị!';
                      } else {
                        handleLoginSuccess(userData);
                        return; // avoid updateDOM on success
                      }
                    } catch (err) {
                      errorMsg = err.response?.data?.message || 'Lỗi kết nối máy chủ';
                    }
                    isLoading = false; 
                    updateDOM();
                  }
                },
                  h('div', { className: 'input__item' }, 
                    h('input', { name: 'email', type: 'email', placeholder: 'Email quản trị viên', required: true }), 
                    h('span', { className: 'input__icon' }, '✉️')
                  ),
                  h('div', { className: 'input__item' }, 
                    h('input', { name: 'password', type: 'password', placeholder: 'Mật khẩu', required: true }), 
                    h('span', { className: 'input__icon' }, '🔒')
                  ),
                  h('button', { type: 'submit', className: 'auth-submit-btn', disabled: isLoading }, isLoading ? 'Đang xác thực...' : 'ĐĂNG NHẬP')
                )
              )
            )
          )
        )
      )
    );
    wrapper.appendChild(content);
  };

  updateDOM();
  return wrapper;
}
