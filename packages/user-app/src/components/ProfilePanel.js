/**
 * DictaFlow — Profile Panel Component
 */

import {  h  } from '@dictaflow/shared';
import {  store  } from '@dictaflow/shared';
import {  api  } from '@dictaflow/shared';
import {  showToast  } from '@dictaflow/shared';
import {  LEVELS  } from '@dictaflow/shared';

/**
 * Render the Profile page.
 * @returns {HTMLElement}
 */
export function renderProfile() {
  const user = store.get('currentUser');
  if (!user) {
    // Should not reach here if router guards work, but just in case
    return h('div', { className: 'page' }, 'Vui lòng đăng nhập.');
  }

  const page = h('div', { className: 'page animate-fade-in' },
    h('div', { className: 'container', style: { maxWidth: '600px', paddingTop: '2rem' } },

      // Khối 1: Thông tin tài khoản
      h('div', { className: 'card', style: { marginBottom: 'var(--space-lg)' } },
        h('div', { className: 'settings-section' },
          h('div', { className: 'settings-section-title' }, 'Thông tin tài khoản'),
          
          h('div', { style: { display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' } },
             h('img', { 
                src: user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name) + '&background=random',
                style: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }
             })
          ),

          h('div', { className: 'settings-row', style: { display: 'block', marginBottom: '1rem' } },
            h('label', { className: 'form-label' }, 'Tên hiển thị'),
            h('input', { type: 'text', className: 'input', id: 'profile-name', value: user.name || '' })
          ),

          h('div', { className: 'settings-row', style: { display: 'block', marginBottom: '1rem' } },
            h('label', { className: 'form-label' }, 'Email (Không thể thay đổi)'),
            h('input', { type: 'text', className: 'input', value: user.email || '', disabled: true, style: { opacity: 0.6 } })
          ),

          h('div', { className: 'settings-row', style: { display: 'block', marginBottom: '1.5rem' } },
            h('label', { className: 'form-label' }, 'Mật khẩu mới (Để trống nếu không muốn đổi)'),
            h('input', { type: 'password', className: 'input', id: 'profile-password', placeholder: 'Nhập mật khẩu mới...' })
          ),
          
          h('div', { style: { textAlign: 'right' } },
            h('button', {
              className: 'btn btn-primary',
              onClick: () => handleSaveProfile('account')
            }, 'Lưu Thông Tin')
          )
        )
      ),

      // Khối 2: Cá nhân hóa Thư viện
      h('div', { className: 'card', style: { marginBottom: 'var(--space-lg)' } },
        h('div', { className: 'settings-section' },
          h('div', { className: 'settings-section-title' }, '🎯 Mục tiêu học tập'),
          h('p', { className: 'text-sm text-secondary mb-md' }, 'Cài đặt trình độ mục tiêu để hệ thống đề xuất các bài luyện nghe phù hợp nhất cho bạn trên trang Thư viện.'),

          h('div', { className: 'settings-row' },
            h('div', {},
              h('div', { className: 'settings-row-label' }, 'Mục tiêu Tiếng Anh'),
              h('div', { className: 'settings-row-desc' }, 'Theo chuẩn CEFR')
            ),
            h('select', { className: 'input select', style: { width: '150px' }, id: 'profile-en-level' },
              h('option', { value: '', selected: !user.targetEnglishLevel }, 'Chưa chọn'),
              ...['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => 
                h('option', { value: lvl, selected: user.targetEnglishLevel === lvl }, lvl)
              )
            )
          ),

          h('div', { className: 'settings-row' },
            h('div', {},
              h('div', { className: 'settings-row-label' }, 'Mục tiêu Tiếng Nhật'),
              h('div', { className: 'settings-row-desc' }, 'Theo chuẩn JLPT')
            ),
            h('select', { className: 'input select', style: { width: '150px' }, id: 'profile-jp-level' },
              h('option', { value: '', selected: !user.targetJapaneseLevel }, 'Chưa chọn'),
              ...['N5', 'N4', 'N3', 'N2', 'N1'].map(lvl => 
                h('option', { value: lvl, selected: user.targetJapaneseLevel === lvl }, lvl)
              )
            )
          ),

          h('div', { style: { textAlign: 'right', marginTop: '1rem' } },
            h('button', {
              className: 'btn btn-primary',
              onClick: () => handleSaveProfile('targets')
            }, 'Lưu Mục Tiêu')
          )
        )
      ),

      // Khối 3: Về DictaFlow
      h('div', { className: 'card' },
        h('div', { className: 'settings-section' },
          h('div', { className: 'settings-section-title' }, 'ℹ️ Về DictaFlow'),
          h('p', { className: 'text-sm text-secondary' },
            'DictaFlow là dự án tâm huyết được phát triển bởi Vũ Lợi, với mong muốn tạo ra một công cụ học ngoại ngữ (đặc biệt là luyện nghe chép chính tả & Kanji) hoàn toàn miễn phí và hiệu quả cho cộng đồng học thuật.',
          ),
          h('p', {
            className: 'text-sm text-secondary',
            style: { marginTop: 'var(--space-sm)' },
          },
            'Kết nối với tôi tại: ',
            h('a', { 
              href: 'https://www.facebook.com/ro.i.90574', 
              target: '_blank', 
              rel: 'noopener noreferrer',
              style: { fontWeight: 'bold' }
            }, 'Vũ Lợi (Facebook)')
          ),
          h('p', {
            className: 'text-sm text-secondary',
            style: { marginTop: 'var(--space-sm)' },
          }, 'Version 1.0.0 • Made with ❤️'),
        ),
      ),

    )
  );

  return page;
}

async function handleSaveProfile(section) {
  try {
    store.set('loading', true);
    let payload = {};

    if (section === 'account') {
      const name = document.getElementById('profile-name').value.trim();
      const password = document.getElementById('profile-password').value;
      if (!name) return showToast('Tên không được để trống', 'error');
      payload.name = name;
      if (password) payload.password = password;
    } else if (section === 'targets') {
      payload.targetEnglishLevel = document.getElementById('profile-en-level').value;
      payload.targetJapaneseLevel = document.getElementById('profile-jp-level').value;
    }

    const res = await api.put('/user/profile', payload);
    
    // Update local store with new user data
    const updatedUser = { ...store.get('currentUser'), ...res.data };
    store.set('currentUser', updatedUser);
    localStorage.setItem('dictaflow_user', JSON.stringify(updatedUser));
    
    if (section === 'account') {
      document.getElementById('profile-password').value = ''; // clear password field
      showToast('Cập nhật tài khoản thành công', 'success');
    } else {
      showToast('Cập nhật mục tiêu thành công', 'success');
    }

  } catch (error) {
    showToast(error.response?.data?.message || 'Có lỗi xảy ra', 'error');
  } finally {
    store.set('loading', false);
  }
}
