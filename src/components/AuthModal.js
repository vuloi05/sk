/**
 * DictaFlow — Auth Modal Component
 */

import { h } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { signUpUser, signInUser, signInWithGoogle } from '../core/supabase.js';

export function renderAuthModal(onClose) {
  let isLogin = true;
  let isLoading = false;
  let errorMsg = '';

  const wrapper = document.createElement('div');

  const updateDOM = () => {
    wrapper.innerHTML = '';
    
    const content = h('div', { className: 'modal-overlay animate-fade-in', id: 'auth-modal' },
      h('div', { className: 'modal-content card animate-slide-up', style: { maxWidth: '400px', width: '90%', padding: 'var(--space-xl)' } },
        h('div', { className: 'flex justify-between items-center mb-lg' },
          h('h2', {}, isLogin ? '👋 Đăng nhập' : '🚀 Đăng ký'),
          h('button', { className: 'btn btn-ghost btn-sm', onClick: onClose }, '✕')
        ),
        
        errorMsg ? h('div', { className: 'toast toast-error mb-md', style: { position: 'relative', transform: 'none', width: '100%' } }, errorMsg) : null,

        // Nút đăng nhập Google
        h('button', {
          className: 'btn btn-outline mb-md',
          style: { width: '100%', display: 'flex', gap: '8px', justifyContent: 'center' },
          onClick: async () => {
            try {
              await signInWithGoogle();
            } catch (err) {
              errorMsg = err.message;
              updateDOM();
            }
          }
        }, 
          h('svg', { width: '18', height: '18', viewBox: '0 0 24 24', fill: 'currentColor' },
            h('path', { d: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z', fill: '#4285F4' }),
            h('path', { d: 'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z', fill: '#34A853' }),
            h('path', { d: 'M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z', fill: '#FBBC05' }),
            h('path', { d: 'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z', fill: '#EA4335' })
          ),
          'Đăng nhập với Google'
        ),

        h('div', { className: 'flex items-center gap-sm mb-md', style: { color: 'var(--text-secondary)' } },
          h('hr', { style: { flex: 1, borderColor: 'var(--border-color)' } }),
          h('span', { className: 'text-sm' }, 'HOẶC'),
          h('hr', { style: { flex: 1, borderColor: 'var(--border-color)' } })
        ),

        h('form', {
          className: 'flex flex-col gap-md',
          onSubmit: async (e) => {
            e.preventDefault();
            const email = e.target.email.value.trim();
            const password = e.target.password.value;
            const fullName = isLogin ? null : e.target.fullname?.value?.trim();

            isLoading = true;
            errorMsg = '';
            updateDOM();

            try {
              if (isLogin) {
                await signInUser(email, password);
              } else {
                await signUpUser(email, password, fullName);
              }
              onClose();
            } catch (err) {
              // Dịch một số lỗi phổ biến của Supabase sang tiếng Việt
              let msg = err.message;
              if (msg.includes('Invalid login credentials')) {
                msg = 'Email hoặc mật khẩu không chính xác.';
              } else if (msg.includes('invalid')) {
                msg = 'Địa chỉ email không hợp lệ.';
              } else if (msg.includes('already registered')) {
                msg = 'Email này đã được đăng ký.';
              } else if (msg.includes('rate limit')) {
                msg = 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.';
              }
              
              errorMsg = msg;
              isLoading = false;
              updateDOM();
            }
          }
        },
          !isLogin ? h('div', { className: 'form-group' },
            h('label', {}, 'Họ và tên'),
            h('input', { name: 'fullname', type: 'text', className: 'input', placeholder: 'Nguyễn Văn A', required: true })
          ) : null,
          
          h('div', { className: 'form-group' },
            h('label', {}, 'Email'),
            h('input', { name: 'email', type: 'email', className: 'input', placeholder: 'email@example.com', required: true })
          ),

          h('div', { className: 'form-group' },
            h('label', {}, 'Mật khẩu'),
            h('input', { name: 'password', type: 'password', className: 'input', placeholder: '••••••••', required: true, minlength: 6 })
          ),

          h('button', { type: 'submit', className: 'btn btn-primary mt-sm', disabled: isLoading }, 
            isLoading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Tạo tài khoản')
          )
        ),

        h('div', { className: 'text-center mt-md' },
          h('button', { 
            className: 'btn btn-ghost btn-sm text-secondary',
            onClick: () => {
              isLogin = !isLogin;
              errorMsg = '';
              updateDOM();
            }
          }, isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập')
        )
      )
    );

    wrapper.appendChild(content);
  };

  updateDOM();
  return wrapper;
}
