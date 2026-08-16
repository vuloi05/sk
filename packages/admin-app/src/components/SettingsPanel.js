/**
 * DictaFlow — Settings Panel Component
 */

import {  h  } from '@dictaflow/shared';
import {  store  } from '@dictaflow/shared';
import {  showToast  } from '@dictaflow/shared';
import {  PLAYBACK_SPEEDS, ROUTES  } from '@dictaflow/shared';

/**
 * Render the settings page.
 * @returns {HTMLElement}
 */
export function renderSettings() {
  const settings = store.get('settings') || {};

  const page = h('div', { className: 'page' },
    h('div', { className: 'container', style: { maxWidth: '600px', paddingTop: '2rem' } },

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
      )
    )
  );

  return page;
}
