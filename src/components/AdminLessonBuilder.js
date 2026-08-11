import { h } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { api } from '../core/api.js';
import { showToast } from './Toast.js';
import { ROUTES } from '../utils/constants.js';

let ytData = null;
let isFetching = false;
let isSaving = false;
let isFallbackMode = false;
let selectedLang = 'jp';

export function renderAdminLessonBuilder() {
  const user = store.get('currentUser');
  if (!user || user.role !== 'admin') {
    setTimeout(() => store.set('route', ROUTES.LIBRARY), 0);
    return h('div', {}, 'Đang chuyển hướng...');
  }

  const page = h('div', { className: 'page animate-fade-in' },
    h('div', { className: 'container', style: { maxWidth: '800px', marginTop: '2rem' } },
      
      h('div', { className: 'flex justify-between items-center mb-lg' },
         h('h1', { style: { fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '10px' } }, 
            '📝', 'Tạo bài học từ YouTube'
         ),
         h('button', { 
            className: 'btn btn-outline',
            onClick: () => store.set('route', ROUTES.ADMIN)
         }, 'Trở lại Bảng quản trị')
      ),

      // 1. YouTube Fetcher
      h('div', { className: 'card mb-lg', style: { padding: '2rem' } },
        h('h3', { className: 'mb-md' }, '1. Nhập link YouTube'),
        h('div', { className: 'flex gap-sm' },
          h('input', {
            type: 'text',
            id: 'youtube-url',
            className: 'input',
            style: { flex: 1 },
            placeholder: 'https://www.youtube.com/watch?v=...',
            disabled: isFetching
          }),
          h('button', {
            className: 'btn btn-primary',
            disabled: isFetching,
            onClick: async () => {
              const url = document.getElementById('youtube-url').value;
              if (!url) return showToast('Vui lòng nhập link YouTube', 'error');
              
              isFetching = true;
              renderUI();
              
              try {
                const res = await api.post('/lessons/youtube/fetch', { youtube_url: url });
                ytData = res.data;
                isFallbackMode = !ytData.transcript || ytData.transcript.length === 0;
                
                // Auto update language dropdown if language is detected
                if (ytData.language) {
                  const langSelect = document.getElementById('lesson-lang');
                  if (langSelect) {
                    langSelect.value = ytData.language;
                    // Trigger manual change to update level dropdown
                    langSelect.dispatchEvent(new Event('change'));
                  }
                }
                
                showToast('Tải dữ liệu thành công!', 'success');
              } catch (err) {
                showToast(err.response?.data?.message || 'Lỗi khi tải dữ liệu YouTube', 'error');
              } finally {
                isFetching = false;
                renderUI();
              }
            }
          }, isFetching ? 'Đang tải...' : '🔍 Tải Dữ Liệu')
        )
      ),

      // 2. Lesson Details
      ytData ? h('div', { className: 'card mb-lg', style: { padding: '2rem' } },
        h('h3', { className: 'mb-md' }, '2. Thông tin bài học'),
        
        h('div', { style: { display: 'flex', gap: '2rem', marginBottom: '1rem' } },
          h('div', { style: { width: '200px' } }, 
             h('img', { src: ytData.thumbnail, style: { width: '100%', borderRadius: '8px', border: '1px solid #333' } })
          ),
          h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' } },
             h('div', {},
               h('label', { className: 'form-label' }, 'Tiêu đề bài học *'),
               h('input', { type: 'text', id: 'lesson-title', className: 'input', value: ytData.title })
             ),
             h('div', { style: { display: 'flex', gap: '1rem' } },
               h('div', { style: { flex: 1 } },
                 h('label', { className: 'form-label' }, 'Ngôn ngữ *'),
                 h('select', { 
                   id: 'lesson-lang', 
                   className: 'input select',
                   value: selectedLang,
                   onChange: (e) => {
                     selectedLang = e.target.value;
                     const levelSelect = document.getElementById('lesson-level');
                     if (levelSelect) {
                       levelSelect.innerHTML = '';
                       let options = [];
                       if (selectedLang === 'jp') {
                         options = ['Tự động tính (Auto)|Unknown', 'N5|N5', 'N4|N4', 'N3|N3', 'N2|N2', 'N1|N1'];
                       } else {
                         options = ['Tự động tính (Auto)|Unknown', 'A1|A1', 'A2|A2', 'B1|B1', 'B2|B2', 'C1|C1', 'C2|C2'];
                       }
                       options.forEach(opt => {
                         const [text, val] = opt.split('|');
                         const option = document.createElement('option');
                         option.value = val;
                         option.textContent = text;
                         levelSelect.appendChild(option);
                       });
                     }
                   }
                 },
                   h('option', { value: 'jp', selected: selectedLang === 'jp' }, 'Tiếng Nhật'),
                   h('option', { value: 'en', selected: selectedLang === 'en' }, 'Tiếng Anh')
                 )
               ),
               h('div', { style: { flex: 1 } },
                 h('label', { className: 'form-label' }, 'Độ khó'),
                 h('select', { id: 'lesson-level', className: 'input select' },
                   ...(selectedLang === 'jp' ? [
                     h('option', { value: 'Unknown' }, 'Tự động tính (Auto)'),
                     h('option', { value: 'N5' }, 'N5'),
                     h('option', { value: 'N4' }, 'N4'),
                     h('option', { value: 'N3' }, 'N3'),
                     h('option', { value: 'N2' }, 'N2'),
                     h('option', { value: 'N1' }, 'N1')
                   ] : [
                     h('option', { value: 'Unknown' }, 'Tự động tính (Auto)'),
                     h('option', { value: 'A1' }, 'A1'),
                     h('option', { value: 'A2' }, 'A2'),
                     h('option', { value: 'B1' }, 'B1'),
                     h('option', { value: 'B2' }, 'B2'),
                     h('option', { value: 'C1' }, 'C1'),
                     h('option', { value: 'C2' }, 'C2')
                   ])
                 )
               )
             ),
             h('div', {},
               h('label', { className: 'form-label' }, 'Mô tả ngắn'),
               h('textarea', { id: 'lesson-desc', className: 'input', style: { height: '80px' }, placeholder: 'Giới thiệu về bài nghe...' })
             ),
             h('div', {},
               h('label', { className: 'form-label' }, 'Tags (cách nhau bởi dấu phẩy)'),
               h('input', { type: 'text', id: 'lesson-tags', className: 'input', placeholder: 'vd: minna, bài 5' })
             )
          )
        )
      ) : null,

      // 3. Transcript
      ytData ? h('div', { className: 'card mb-lg', style: { padding: '2rem' } },
        h('h3', { className: 'mb-md' }, '3. Kịch bản nghe (Transcript)'),
        
        isFallbackMode ? h('div', { 
           style: { padding: '1rem', backgroundColor: '#3a2a00', color: '#ffb700', borderRadius: '8px', marginBottom: '1rem' }
        }, 
           h('strong', {}, '⚠️ Video không có phụ đề (SRT/VTT).'),
           h('p', { style: { marginTop: '5px' } }, 'Hãy dán kịch bản thô vào dưới đây. Âm thanh sẽ không thể dừng tự động theo từng câu.'),
           h('textarea', { 
              id: 'fallback-text', 
              className: 'input', 
              style: { height: '150px', marginTop: '1rem' }, 
              placeholder: 'Nhập nội dung kịch bản...' 
           })
        ) : h('div', {},
           h('p', { className: 'text-secondary mb-md' }, `Hệ thống tải thành công ${ytData.transcript.length} câu phụ đề.`),
           h('div', { style: { maxHeight: '400px', overflowY: 'auto', border: '1px solid #333', borderRadius: '8px' } },
              h('table', { style: { width: '100%', textAlign: 'left', borderCollapse: 'collapse' } },
                 h('thead', { style: { position: 'sticky', top: 0, backgroundColor: 'var(--color-bg)' } },
                    h('tr', {},
                       h('th', { style: { padding: '10px', borderBottom: '1px solid #333', width: '80px' } }, 'Start'),
                       h('th', { style: { padding: '10px', borderBottom: '1px solid #333', width: '80px' } }, 'End'),
                       h('th', { style: { padding: '10px', borderBottom: '1px solid #333' } }, 'Text')
                    )
                 ),
                 h('tbody', {},
                    ...ytData.transcript.map((sentence, index) => 
                       h('tr', {},
                          h('td', { style: { padding: '10px', borderBottom: '1px solid #333' } }, sentence.start.toFixed(1)),
                          h('td', { style: { padding: '10px', borderBottom: '1px solid #333' } }, sentence.end.toFixed(1)),
                          h('td', { style: { padding: '10px', borderBottom: '1px solid #333' } }, 
                             h('input', {
                                type: 'text',
                                className: 'input',
                                style: { width: '100%', border: 'none', backgroundColor: 'transparent' },
                                value: sentence.en,
                                onChange: (e) => { ytData.transcript[index].en = e.target.value; }
                             })
                          )
                       )
                    )
                 )
              )
           )
        )
      ) : null,

      // Save Button
      ytData ? h('div', { style: { textAlign: 'right' } },
        h('button', {
           className: 'btn btn-primary',
           style: { fontSize: '1.2rem', padding: '15px 30px' },
           disabled: isSaving,
           onClick: handleSave
        }, isSaving ? 'Đang lưu...' : '💾 Lưu Bài Học')
      ) : null

    )
  );

  return page;
}

function renderUI() {
  const oldPage = document.querySelector('.page');
  const newPage = renderAdminLessonBuilder();
  if (oldPage && oldPage.parentNode) {
    oldPage.parentNode.replaceChild(newPage, oldPage);
  }
}

async function handleSave() {
  const title = document.getElementById('lesson-title').value.trim();
  const lang = document.getElementById('lesson-lang').value;
  const level = document.getElementById('lesson-level').value;
  const desc = document.getElementById('lesson-desc').value.trim();
  const tagsStr = document.getElementById('lesson-tags').value.trim();
  
  if (!title) return showToast('Vui lòng nhập tiêu đề', 'error');

  let finalTranscript = ytData.transcript;

  if (isFallbackMode) {
    const rawText = document.getElementById('fallback-text').value.trim();
    if (!rawText) return showToast('Vui lòng nhập kịch bản', 'error');
    
    const sentences = rawText.split(/(?<=[。！？.!?\n])/).map(s => s.trim()).filter(s => s.length > 0);
    
    finalTranscript = sentences.map((s, idx) => ({
       id: 's_' + Date.now() + '_' + idx,
       start: 0,
       end: 0,
       en: s,
       vi: ''
    }));
  }

  isSaving = true;
  renderUI();

  try {
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : [];
    
    const payload = {
      title,
      youtube_id: ytData.youtube_id,
      language: lang,
      level,
      description: desc,
      tags,
      thumbnail: ytData.thumbnail,
      transcript: finalTranscript
    };

    await api.post('/lessons', payload);
    showToast('Tạo bài học thành công!', 'success');
    
    ytData = null;
    isFallbackMode = false;
    store.set('route', ROUTES.LIBRARY);
    
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    isSaving = false;
    renderUI();
  }
}
