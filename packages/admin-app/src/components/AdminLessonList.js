import {  h  } from '@dictaflow/shared';
import {  fetchLessonsAPI, deleteLessonAPI, toggleLessonVipAPI  } from '@dictaflow/shared';
import {  showToast  } from '@dictaflow/shared';

export function renderAdminLessonList() {
  const container = h('div', { className: 'admin-lesson-list' });
  
  // Loading state
  container.innerHTML = '<div class="loading-spinner" style="margin: 2rem auto;"></div><p style="text-align: center;">Đang tải dữ liệu...</p>';

  fetchLessonsAPI()
    .then(allLessons => {
      container.innerHTML = '';
      
      let currentLang = 'en'; // default English
      
      const headerContainer = h('div', { style: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #333' } });
      
      const tabEn = h('div', { 
        style: { padding: '0.75rem 1.5rem', cursor: 'pointer', transition: 'all 0.2s' }
      }, 'Tiếng Anh');

      const tabJa = h('div', { 
        style: { padding: '0.75rem 1.5rem', cursor: 'pointer', transition: 'all 0.2s' }
      }, 'Tiếng Nhật');
      
      headerContainer.appendChild(tabEn);
      headerContainer.appendChild(tabJa);
      container.appendChild(headerContainer);

      const tableContainer = h('div');
      container.appendChild(tableContainer);

      const renderTable = () => {
        // update tabs visual
        tabEn.style.borderBottom = currentLang === 'en' ? '2px solid #e53637' : '2px solid transparent';
        tabEn.style.color = currentLang === 'en' ? '#fff' : '#888';
        tabEn.style.fontWeight = currentLang === 'en' ? 'bold' : 'normal';

        tabJa.style.borderBottom = currentLang === 'ja' ? '2px solid #e53637' : '2px solid transparent';
        tabJa.style.color = currentLang === 'ja' ? '#fff' : '#888';
        tabJa.style.fontWeight = currentLang === 'ja' ? 'bold' : 'normal';

        tableContainer.innerHTML = '';
        const lessons = allLessons.filter(l => l.language === currentLang);

        if (lessons.length === 0) {
          tableContainer.appendChild(h('p', { style: { textAlign: 'center', padding: '2rem', color: '#888' } }, 'Chưa có bài học nào trong kho.'));
          return;
        }

        const tableWrapper = h('div', { style: { overflowX: 'auto', background: '#111226', borderRadius: '8px', padding: '1rem' } });
        const table = h('table', { className: 'admin-table', style: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#fff' } });
        
        // Header
        const thead = h('thead', {}, 
          h('tr', { style: { borderBottom: '1px solid #333' } },
            h('th', { style: { padding: '1rem' } }, 'Tiêu đề'),
            h('th', { style: { padding: '1rem' } }, 'Số câu'),
            h('th', { style: { padding: '1rem' } }, 'Ngày tạo'),
            h('th', { style: { padding: '1rem', textAlign: 'right' } }, 'Hành động')
          )
        );
        table.appendChild(thead);

        // Body
        const tbody = h('tbody');
        lessons.forEach(lesson => {
          const tr = h('tr', { style: { borderBottom: '1px solid #222' } },
            h('td', { style: { padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' } },
              h('img', { 
                src: lesson.youtube_id ? `https://img.youtube.com/vi/${lesson.youtube_id}/default.jpg` : lesson.thumbnail, 
                style: { width: '80px', height: '45px', objectFit: 'cover', borderRadius: '4px' } 
              }),
              h('span', {}, 
                lesson.title, 
                lesson.isVip ? h('span', { style: { marginLeft: '10px', background: 'linear-gradient(45deg, #ffd700, #ff8c00)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' } }, '⭐ VIP') : null
              )
            ),
            h('td', { style: { padding: '1rem' } }, `${lesson.sentence_count || 0} câu`),
            h('td', { style: { padding: '1rem' } }, new Date(lesson.createdAt).toLocaleDateString('vi-VN')),
            h('td', { style: { padding: '1rem', textAlign: 'right' } },
              h('button', {
                className: 'btn btn-secondary btn-sm',
                style: { padding: '0.25rem 0.75rem', fontSize: '0.85rem', marginRight: '0.5rem' },
                onClick: async () => {
                  try {
                    const updated = await toggleLessonVipAPI(lesson._id, !lesson.isVip);
                    lesson.isVip = updated.isVip;
                    showToast(lesson.isVip ? 'Đã đánh dấu VIP' : 'Đã hủy VIP', 'success');
                    renderTable();
                  } catch (err) {
                    showToast('Lỗi khi cập nhật VIP: ' + err.message, 'error');
                  }
                }
              }, lesson.isVip ? 'Hủy VIP' : '⭐ Set VIP'),
              h('button', {
                className: 'btn btn-danger btn-sm',
                style: { padding: '0.25rem 0.75rem', fontSize: '0.85rem' },
                onClick: async () => {
                  if (confirm(`Bạn có chắc chắn muốn xóa bài học "${lesson.title}" không?`)) {
                    try {
                      await deleteLessonAPI(lesson._id);
                      showToast('Đã xóa bài học thành công', 'success');
                      const index = allLessons.findIndex(l => l._id === lesson._id);
                      if (index !== -1) allLessons.splice(index, 1);
                      renderTable(); // re-render to handle empty state if needed
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
        tableContainer.appendChild(tableWrapper);
      };

      tabEn.onclick = () => { currentLang = 'en'; renderTable(); };
      tabJa.onclick = () => { currentLang = 'ja'; renderTable(); };

      renderTable();
    })
    .catch(err => {
      container.innerHTML = `<p style="color: red; text-align: center;">Lỗi tải dữ liệu: ${err.message}</p>`;
    });

  return container;
}
