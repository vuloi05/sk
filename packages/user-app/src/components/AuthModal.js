/**
 * DictaFlow — Auth Modal Component (Anime Cinematic Style)
 * Full-page login/signup/otp/forgot-password/google-auth
 */

import {  h  } from '@dictaflow/shared';
import {  store  } from '@dictaflow/shared';
import {  login, register, verifyOTP, resendOTP, googleLogin, forgotPassword, resetPassword  } from '@dictaflow/shared';
import {  showToast  } from '@dictaflow/shared';

export function renderAuthModal(onClose) {
  let isLogin = true;
  let isOTP = false;
  let isForgot = false;
  let isReset = false;
  let registeredEmail = '';
  let isLoading = false;
  let errorMsg = '';
  let successMsg = '';

  const wrapper = document.createElement('div');

  const handleLoginSuccess = (userData) => {
    localStorage.setItem('dictaflow_token', userData.token);
    const { token, ...userWithoutToken } = userData;
    localStorage.setItem('dictaflow_user', JSON.stringify(userWithoutToken));
    store.set('currentUser', userWithoutToken);
    showToast('Đăng nhập thành công!', 'success');
    onClose();
  };

  const initGoogleAuth = () => {
    if (isOTP || isForgot || isReset) return;
    const btnWrapper = document.getElementById('google-btn-wrapper');
    if (!btnWrapper || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
      callback: async (response) => {
        try {
          isLoading = true; updateDOM();
          const userData = await googleLogin(response.credential);
          handleLoginSuccess(userData);
        } catch (err) {
          errorMsg = err.response?.data?.message || 'Lỗi đăng nhập Google';
          isLoading = false; updateDOM();
        }
      }
    });
    window.google.accounts.id.renderButton(btnWrapper, { theme: 'outline', size: 'large', text: isLogin ? 'signin_with' : 'signup_with', width: 280 });
  };

  const updateDOM = () => {
    wrapper.innerHTML = '';
    
    let title = 'Đăng nhập'; let subtitle = 'Chào mừng bạn đến với DictaFlow.';
    if (isOTP) { title = 'Xác minh Email'; subtitle = 'Vui lòng nhập mã OTP được gửi tới email của bạn.'; } 
    else if (isForgot) { title = 'Quên mật khẩu'; subtitle = 'Nhập email của bạn để nhận mã khôi phục.'; } 
    else if (isReset) { title = 'Đặt lại mật khẩu'; subtitle = 'Nhập mã OTP và mật khẩu mới.'; } 
    else if (!isLogin) { title = 'Đăng ký'; }

    const content = h('div', { className: 'auth-overlay animate-fade-in', id: 'auth-modal' },
      h('section', { className: 'auth-breadcrumb' },
        h('div', { className: 'auth-breadcrumb-overlay' }),
        h('div', { className: 'auth-breadcrumb-content' }, h('h2', {}, title), h('p', {}, subtitle)),
        h('button', { className: 'auth-close-btn', onClick: onClose }, '✕')
      ),
      h('section', { className: 'auth-section' },
        h('div', { className: 'auth-container' },
          h('div', { className: 'auth-row' },
            h('div', { className: 'auth-form-col' },
              h('div', { className: 'auth-form' },
                h('h3', {}, title),
                errorMsg ? h('div', { className: 'auth-error' }, errorMsg) : null,
                successMsg ? h('div', { className: 'auth-success', style: { color: '#00ff88', marginBottom: '15px' } }, successMsg) : null,
                h('form', {
                  onSubmit: async (e) => {
                    e.preventDefault(); isLoading = true; errorMsg = ''; successMsg = ''; updateDOM();
                    try {
                      if (isOTP) {
                        handleLoginSuccess(await verifyOTP(registeredEmail, e.target.otp.value.trim()));
                      } else if (isForgot) {
                        const res = await forgotPassword(e.target.email.value.trim());
                        isForgot = false; isReset = true; registeredEmail = e.target.email.value.trim();
                        successMsg = res.message; if (res.previewUrl) showToast('Mở F12 Console để lấy OTP', 'info');
                        updateDOM();
                      } else if (isReset) {
                        await resetPassword(registeredEmail, e.target.otp.value.trim(), e.target.password.value);
                        isReset = false; isLogin = true; successMsg = 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.'; updateDOM();
                      } else if (isLogin) {
                        handleLoginSuccess(await login(e.target.email.value.trim(), e.target.password.value));
                      } else {
                        const res = await register(e.target.fullname.value.trim(), e.target.email.value.trim(), e.target.password.value);
                        isOTP = true; registeredEmail = e.target.email.value.trim(); successMsg = res.message;
                        if (res.previewUrl) showToast('Mở F12 Console để lấy OTP', 'info');
                        updateDOM();
                      }
                    } catch (err) {
                      errorMsg = err.response?.data?.message || 'Lỗi kết nối máy chủ';
                      if (err.response?.data?.needsVerification) {
                        isLogin = false; isOTP = true; registeredEmail = e.target.email?.value.trim();
                        try { await resendOTP(registeredEmail); } catch(e) {}
                      }
                      isLoading = false; updateDOM();
                    }
                  }
                },
                  (() => {
                    if (isOTP) return h('div', { className: 'input__item' }, h('input', { name: 'otp', type: 'text', placeholder: 'Mã OTP (6 số)', required: true, maxlength: 6 }), h('span', { className: 'input__icon' }, '🔑'));
                    if (isForgot) return h('div', { className: 'input__item' }, h('input', { name: 'email', type: 'email', placeholder: 'Email của bạn', required: true }), h('span', { className: 'input__icon' }, '✉️'));
                    if (isReset) return h('div', null, h('div', { className: 'input__item' }, h('input', { name: 'otp', type: 'text', placeholder: 'Mã OTP', required: true, maxlength: 6 }), h('span', { className: 'input__icon' }, '🔑')), h('div', { className: 'input__item' }, h('input', { name: 'password', type: 'password', placeholder: 'Mật khẩu mới', required: true, minlength: 6 }), h('span', { className: 'input__icon' }, '🔒')));
                    return h('div', null,
                      !isLogin ? h('div', { className: 'input__item' }, h('input', { name: 'fullname', type: 'text', placeholder: 'Họ và tên', required: true }), h('span', { className: 'input__icon' }, '👤')) : null,
                      h('div', { className: 'input__item' }, h('input', { name: 'email', type: 'email', placeholder: 'Địa chỉ email', required: true, value: registeredEmail }), h('span', { className: 'input__icon' }, '✉️')),
                      h('div', { className: 'input__item' }, h('input', { name: 'password', type: 'password', placeholder: 'Mật khẩu', required: true, minlength: 6 }), h('span', { className: 'input__icon' }, '🔒'))
                    );
                  })(),
                  h('button', { type: 'submit', className: 'auth-submit-btn', disabled: isLoading }, isLoading ? 'Đang xử lý...' : (isOTP || isReset ? 'XÁC NHẬN' : (isForgot ? 'GỬI MÃ KHÔI PHỤC' : (isLogin ? 'ĐĂNG NHẬP NGAY' : 'TẠO TÀI KHOẢN'))))
                ),
                (!isOTP && !isForgot && !isReset) ? h('div', { className: 'auth-divider' }, 'hoặc') : null,
                (!isOTP && !isForgot && !isReset) ? h('div', { id: 'google-btn-wrapper', style: { display: 'flex', justifyContent: 'flex-start', marginTop: '15px' } }) : null,
                (() => {
                  if (isOTP || isReset) return h('a', { href: '#', className: 'auth-forget-pass', onClick: async (e) => { e.preventDefault(); if (isLoading) return; isLoading = true; updateDOM(); try { const res = isReset ? await forgotPassword(registeredEmail) : await resendOTP(registeredEmail); successMsg = res.message; errorMsg = ''; if (res.previewUrl) showToast('Mở F12 Console', 'info'); } catch (err) { errorMsg = 'Lỗi gửi lại OTP'; successMsg = ''; } isLoading = false; updateDOM(); } }, 'Gửi lại mã?');
                  if (isForgot) return h('a', { href: '#', className: 'auth-forget-pass', onClick: (e) => { e.preventDefault(); isForgot = false; isLogin = true; updateDOM(); } }, 'Quay lại đăng nhập');
                  if (isLogin) return h('a', { href: '#', className: 'auth-forget-pass', onClick: (e) => { e.preventDefault(); isForgot = true; isLogin = false; updateDOM(); } }, 'Quên mật khẩu?');
                  return null;
                })()
              )
            ),
            h('div', { className: 'auth-cta-col' },
              h('div', { className: 'auth-cta' },
                h('h3', {}, (isOTP || isForgot || isReset) ? 'Về trang chủ?' : (isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?')),
                h('button', { className: 'auth-cta-btn', onClick: () => { if (isOTP || isForgot || isReset) { isLogin = true; isOTP = false; isForgot = false; isReset = false; } else { isLogin = !isLogin; } errorMsg = ''; successMsg = ''; updateDOM(); } }, (isOTP || isForgot || isReset) ? 'QUAY LẠI ĐĂNG NHẬP' : (isLogin ? 'ĐĂNG KÝ NGAY' : 'ĐĂNG NHẬP NGAY'))
              )
            )
          )
        )
      )
    );
    wrapper.appendChild(content);
    setTimeout(initGoogleAuth, 100);
  };

  updateDOM();
  return wrapper;
}
