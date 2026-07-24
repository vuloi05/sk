/**
 * DictaFlow — Settings Panel Component
 */

import { h } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { initGemini, isGeminiReady } from '../core/gemini.js';
import { showToast } from './Toast.js';
import { PLAYBACK_SPEEDS, ROUTES } from '../utils/constants.js';

/**
 * Render the settings page.
 * @returns {HTMLElement}
 */
export function renderSettings() {
  const apiKey = store.get('apiKey') || '';
  const settings = store.get('settings') || {};

  const page = h('div', { className: 'page' },
    h('div', { className: 'container', style: { maxWidth: '600px' } },
      h('h1', { style: { marginBottom: '8px' } }, '⚙️ Cài đặt'),
      h('p', { className: 'text-secondary mb-lg' }, 'Cấu hình API key và tùy chọn luyện tập.'),

      // API Key Section
      h('div', { className: 'card', style: { marginBottom: 'var(--space-lg)' } },
        h('div', { className: 'settings-section' },
          h('div', { className: 'settings-section-title' }, '🔑 Gemini API Key'),
          h('p', {
            className: 'text-sm text-secondary',
            style: { marginBottom: 'var(--space-md)' },
            innerHTML: 'Cần API key để upload bài mới. Lấy miễn phí tại <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a>. Không cần key để luyện bài có sẵn.',
          }),
          h('div', { className: 'api-key-input' },
            h('input', {
              className: 'input',
              type: 'password',
              id: 'api-key-input',
              placeholder: 'Dán API key của bạn vào đây...',
              value: apiKey,
            }),
            h('button', {
              className: 'btn btn-primary btn-sm',
              id: 'save-api-key',
              onClick: () => {
                const input = document.getElementById('api-key-input');
                const key = input?.value?.trim();
                if (key) {
                  store.set('apiKey', key);
                  initGemini(key);
                  showToast('API key đã được lưu!', 'success');
                  updateKeyStatus();
                } else {
                  store.set('apiKey', null);
                  showToast('API key đã bị xóa.', 'info');
                  updateKeyStatus();
                }
              },
            }, 'Lưu'),
          ),
          h('div', {
            className: `api-key-status ${apiKey ? 'connected' : 'disconnected'}`,
            id: 'api-key-status',
          },
            apiKey ? '🟢 Đã kết nối' : '⚪ Chưa nhập key',
          ),
        ),
      ),

      // Playback Settings
      h('div', { className: 'card', style: { marginBottom: 'var(--space-lg)' } },
        h('div', { className: 'settings-section' },
          h('div', { className: 'settings-section-title' }, '🎵 Cài đặt phát âm'),

          // Default speed
          h('div', { className: 'settings-row' },
            h('div', {},
              h('div', { className: 'settings-row-label' }, 'Tốc độ phát mặc định'),
              h('div', { className: 'settings-row-desc' }, 'Áp dụng khi bắt đầu luyện'),
            ),
            h('select', {
              className: 'input select',
              style: { width: '120px' },
              id: 'default-speed',
              value: String(settings.playbackSpeed || 1),
              onChange: (e) => {
                const newSettings = { ...store.get('settings'), playbackSpeed: parseFloat(e.target.value) };
                store.set('settings', newSettings);
                showToast('Đã cập nhật tốc độ mặc định.', 'success');
              },
              innerHTML: PLAYBACK_SPEEDS.map(s =>
                `<option value="${s}" ${s === (settings.playbackSpeed || 1) ? 'selected' : ''}>${s}x</option>`
              ).join(''),
            }),
          ),

          // Repeat count
          h('div', { className: 'settings-row' },
            h('div', {},
              h('div', { className: 'settings-row-label' }, 'Số lần lặp mỗi câu'),
              h('div', { className: 'settings-row-desc' }, 'Tự phát lại câu N lần trước khi dừng'),
            ),
            h('select', {
              className: 'input select',
              style: { width: '120px' },
              id: 'repeat-count',
              innerHTML: [1, 2, 3, 5].map(n =>
                `<option value="${n}" ${n === (settings.repeatCount || 1) ? 'selected' : ''}>${n} lần</option>`
              ).join(''),
              onChange: (e) => {
                const newSettings = { ...store.get('settings'), repeatCount: parseInt(e.target.value) };
                store.set('settings', newSettings);
                showToast('Đã cập nhật số lần lặp.', 'success');
              },
            }),
          ),
        ),
      ),

      // About
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
    ),
  );

  // Init Gemini if key exists
  if (apiKey) {
    initGemini(apiKey);
  }

  return page;
}

function updateKeyStatus() {
  const el = document.getElementById('api-key-status');
  const key = store.get('apiKey');
  if (el) {
    el.className = `api-key-status ${key ? 'connected' : 'disconnected'}`;
    el.textContent = key ? '🟢 Đã kết nối' : '⚪ Chưa nhập key';
  }
}
