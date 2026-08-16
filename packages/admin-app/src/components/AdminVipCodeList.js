import {  h, formatTime  } from '@dictaflow/shared';
import {  fetchVipCodesAPI, createVipCodeAPI, deleteVipCodeAPI, fetchLessonsAPI  } from '@dictaflow/shared';
import {  showToast  } from '@dictaflow/shared';

export function renderAdminVipCodeList() {
  const container = h('div', { className: 'admin-vip-list' });
  
  container.innerHTML = '<div class="loading-spinner" style="margin: 2rem auto;"></div><p style="text-align: center;">Đang tải dữ liệu...</p>';

  const loadData = async () => {
    try {
      const codes = await fetchVipCodesAPI();
      
      container.innerHTML = '';

      const topAction = h('div', { style: { display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' } },
        h('button', { 
          className: 'btn btn-primary', 
          onClick: () => showCreateModal(loadData),
          style: { padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }
        }, '➕ Tạo Mã Mới')
      );
      container.appendChild(topAction);

      if (codes.length === 0) {
        container.appendChild(h('p', { style: { textAlign: 'center', padding: '2rem', color: '#888' } }, 'Chưa có mã VIP nào được tạo.'));
        return;
      }

      const tableWrapper = h('div', { style: { overflowX: 'auto', background: '#111226', borderRadius: '8px', padding: '1rem' } });
      const table = h('table', { className: 'admin-table', style: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#fff' } });
      
      const thead = h('thead', {}, 
        h('tr', { style: { borderBottom: '1px solid #333' } },
          h('th', { style: { padding: '1rem' } }, 'Mã Code'),
          h('th', { style: { padding: '1rem' } }, 'Loại Mã'),
          h('th', { style: { padding: '1rem' } }, 'Đã dùng'),
          h('th', { style: { padding: '1rem' } }, 'Trạng thái'),
          h('th', { style: { padding: '1rem', textAlign: 'right' } }, 'Hành động')
        )
      );
      table.appendChild(thead);

      const tbody = h('tbody');
      codes.forEach(item => {
        const typeLabel = item.isUniversal ? 'Mở Toàn Bộ VIP' : `Mở bài: ${item.targetLesson?.title || 'Đã xóa'}`;
        const usageLabel = item.maxUses === 0 ? `${item.usedCount} / ∞` : `${item.usedCount} / ${item.maxUses}`;
        
        let status = 'Hoạt động';
        let color = '#28a745';
        if (item.maxUses > 0 && item.usedCount >= item.maxUses) {
          status = 'Hết lượt';
          color = '#dc3545';
        } else if (item.expiresAt && new Date() > new Date(item.expiresAt)) {
          status = 'Hết hạn';
          color = '#ffc107';
        }

        const tr = h('tr', { style: { borderBottom: '1px solid #222' } },
          h('td', { style: { padding: '1rem', fontWeight: 'bold', color: '#ffd700' } }, item.code),
          h('td', { style: { padding: '1rem' } }, typeLabel),
          h('td', { style: { padding: '1rem' } }, usageLabel),
          h('td', { style: { padding: '1rem', color } }, status),
          h('td', { style: { padding: '1rem', textAlign: 'right' } },
            h('button', {
              className: 'btn btn-danger btn-sm',
              style: { padding: '0.25rem 0.75rem', fontSize: '0.85rem' },
              onClick: async () => {
                if (confirm(`Bạn có chắc chắn muốn xóa mã "${item.code}" không?`)) {
                  try {
                    await deleteVipCodeAPI(item._id);
                    showToast('Đã xóa mã thành công', 'success');
                    loadData();
                  } catch (err) {
                    showToast('Lỗi khi xóa: ' + err.message, 'error');
                  }
                }
              }
            }, 'Xóa')
          )
        );
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      tableWrapper.appendChild(table);
      container.appendChild(tableWrapper);

    } catch (err) {
      container.innerHTML = `<p style="color: red; text-align: center;">Lỗi tải dữ liệu: ${err.message}</p>`;
    }
  };

  loadData();

  return container;
}

// Modal tạo mã VIP
async function showCreateModal(onSuccess) {
  const overlay = h('div', { 
    style: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' } 
  });

  const modal = h('div', { 
    className: 'card animate-scale-up', 
    style: { width: '500px', maxWidth: '90%', padding: '2rem' } 
  });

  modal.innerHTML = `
    <h3 style="margin-bottom: 1.5rem">Tạo Mã VIP Mới</h3>
    
    <div style="margin-bottom: 1rem">
      <label class="form-label">Tên Mã Code (vd: SUMMER2026)</label>
      <input type="text" id="vip-code-input" class="input" style="text-transform: uppercase;">
    </div>

    <div style="margin-bottom: 1rem">
      <label class="form-label">Loại Mã</label>
      <select id="vip-type-select" class="input select">
        <option value="universal">🌟 Mở Toàn Bộ Kho VIP</option>
        <option value="specific">🎯 Mở 1 Bài Cụ Thể</option>
      </select>
    </div>

    <div id="lesson-select-container" style="display: none; margin-bottom: 1rem">
      <label class="form-label">Chọn Bài VIP</label>
      <select id="vip-lesson-select" class="input select">
        <option value="">Đang tải danh sách bài VIP...</option>
      </select>
    </div>

    <div style="margin-bottom: 1rem">
      <label class="form-label">Số Lượt Dùng Tối Đa (Để 0 = Không giới hạn)</label>
      <input type="number" id="vip-max-uses" class="input" value="0" min="0">
    </div>

    <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem">
      <button class="btn btn-secondary" id="vip-cancel-btn">Hủy</button>
      <button class="btn btn-primary" id="vip-save-btn">Tạo Mã</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Load VIP lessons
  const lessonsSelect = modal.querySelector('#vip-lesson-select');
  try {
    const allLessons = await fetchLessonsAPI();
    const vipLessons = allLessons.filter(l => l.isVip);
    
    if (vipLessons.length === 0) {
      lessonsSelect.innerHTML = '<option value="">Không có bài VIP nào trong hệ thống</option>';
    } else {
      lessonsSelect.innerHTML = vipLessons.map(l => `<option value="${l._id}">${l.title}</option>`).join('');
    }
  } catch (err) {
    lessonsSelect.innerHTML = '<option value="">Lỗi tải danh sách bài học</option>';
  }

  // Toggle dropdown logic
  const typeSelect = modal.querySelector('#vip-type-select');
  const lessonContainer = modal.querySelector('#lesson-select-container');
  
  typeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'specific') {
      lessonContainer.style.display = 'block';
    } else {
      lessonContainer.style.display = 'none';
    }
  });

  const closeModal = () => {
    overlay.style.animation = 'fadeOut 0.2s ease-out forwards';
    setTimeout(() => overlay.remove(), 200);
  };

  modal.querySelector('#vip-cancel-btn').onclick = closeModal;

  modal.querySelector('#vip-save-btn').onclick = async () => {
    const code = modal.querySelector('#vip-code-input').value.trim();
    const type = modal.querySelector('#vip-type-select').value;
    const lessonId = modal.querySelector('#vip-lesson-select').value;
    const maxUses = parseInt(modal.querySelector('#vip-max-uses').value) || 0;

    if (!code) {
      return showToast('Vui lòng nhập tên mã code', 'error');
    }
    if (type === 'specific' && !lessonId) {
      return showToast('Vui lòng chọn bài học cụ thể', 'error');
    }

    try {
      modal.querySelector('#vip-save-btn').disabled = true;
      modal.querySelector('#vip-save-btn').textContent = 'Đang xử lý...';

      await createVipCodeAPI({
        code,
        isUniversal: type === 'universal',
        targetLesson: type === 'specific' ? lessonId : null,
        maxUses
      });

      showToast('Tạo mã thành công!', 'success');
      closeModal();
      if (onSuccess) onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
      modal.querySelector('#vip-save-btn').disabled = false;
      modal.querySelector('#vip-save-btn').textContent = 'Tạo Mã';
    }
  };
}
