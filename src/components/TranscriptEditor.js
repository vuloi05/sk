/**
 * DictaFlow — Transcript Editor Component
 *
 * Allows users to review, edit, and publish transcribed content.
 */

import { h, formatTime } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { createLesson, isSupabaseConfigured } from '../core/supabase.js';
import { audioManager } from '../core/audioManager.js';
import { showToast } from './Toast.js';
import { ROUTES } from '../utils/constants.js';

/**
 * Render the transcript editor page.
 * @returns {HTMLElement}
 */
export function renderTranscriptEditor() {
  const data = store.get('transcriptData');
  if (!data) {
    return h('div', { className: 'page' },
      h('div', { className: 'container text-center' },
        h('p', {}, 'Không có dữ liệu transcript.'),
        h('button', {
          className: 'btn btn-primary mt-lg',
          onClick: () => store.set('route', ROUTES.UPLOAD),
        }, '← Quay lại Upload'),
      ),
    );
  }

  const page = h('div', { className: 'page' },
    h('div', { className: 'container', style: { maxWidth: '800px' } },
      // Header
      h('div', { className: 'flex items-center justify-between mb-lg' },
        h('div', {},
          h('h1', { style: { marginBottom: '4px' } }, '📝 Xem lại Transcript'),
          h('p', { className: 'text-secondary' }, `${data.title} — ${data.sentences.length} câu`),
        ),
        h('button', {
          className: 'btn btn-ghost btn-sm',
          onClick: () => store.set('route', ROUTES.UPLOAD),
        }, '← Quay lại'),
      ),

      // Instruction
      h('div', {
        className: 'card',
        style: { marginBottom: 'var(--space-lg)', borderColor: 'var(--color-accent-blue)', backgroundColor: 'rgba(28,176,246,0.05)' },
      },
        h('p', { className: 'text-sm' },
          '💡 Kiểm tra và chỉnh sửa nếu AI nhận sai. Click vào câu để sửa nội dung.',
        ),
      ),

      // Sentences list
      h('div', { className: 'card transcript-editor', id: 'sentence-list' },
        ...data.sentences.map((s, i) =>
          h('div', { className: 'transcript-sentence' },
            h('div', { className: 'transcript-sentence-number' }, String(i + 1)),
            h('div', { className: 'transcript-sentence-text' },
              h('input', {
                className: 'input',
                type: 'text',
                value: s.text,
                dataset: { index: String(i) },
                onChange: (e) => {
                  data.sentences[i].text = e.target.value;
                },
              }),
            ),
            h('div', { className: 'transcript-sentence-time' },
              `${formatTime(s.startTime)} - ${formatTime(s.endTime)}`,
            ),
          ),
        ),
      ),

      // Actions
      h('div', { className: 'flex gap-md mt-lg', style: { justifyContent: 'center' } },
        // Practice locally
        h('button', {
          className: 'btn btn-blue btn-lg',
          onClick: () => practiceLocally(data),
        }, '▶️ Luyện ngay'),

        // Share to community
        isSupabaseConfigured()
          ? h('button', {
              className: 'btn btn-primary btn-lg',
              id: 'share-btn',
              onClick: () => shareToLibrary(data),
            }, '🌍 Chia sẻ cho cộng đồng')
          : null,
      ),

      h('p', { className: 'text-center text-sm text-muted mt-md' },
        'Luyện ngay = chỉ luyện trên máy bạn. Chia sẻ = lưu vào thư viện cộng đồng.',
      ),
    ),
  );

  return page;
}

/**
 * Start practice with current transcript data (local only, no Supabase).
 * @param {Object} data
 */
async function practiceLocally(data) {
  store.showLoading('Đang chuẩn bị bài luyện...');
  
  try {
    if (data.sourceType === 'youtube' && data.youtubeVideoId) {
      await audioManager.loadYouTube(data.youtubeVideoId);
    } else {
      const file = store.get('uploadedFile');
      if (file) {
        audioManager.loadFile(file);
      }
    }
  } catch (err) {
    store.hideLoading();
    showToast('Lỗi khi tải media: ' + err.message, 'error');
    return;
  }

  store.update({
    currentLesson: {
      id: 'local-' + Date.now(),
      title: data.title,
      language: data.language,
      level: data.level,
      source_type: data.sourceType || 'upload',
      youtube_url: data.youtubeUrl || null,
    },
    currentSentences: data.sentences.map((s, i) => ({
      id: `local-s${i}`,
      order_index: i,
      content: s.text,
      start_time: s.startTime,
      end_time: s.endTime,
      gap_fill_data: s.gapFillData ? JSON.stringify(s.gapFillData) : null,
      mcq_data: s.mcqData ? JSON.stringify(s.mcqData) : null,
    })),
    currentSentenceIndex: 0,
    practiceResults: [],
  });
  
  store.hideLoading();
  store.set('route', ROUTES.MODE_SELECT);
}

/**
 * Share lesson to Supabase community library.
 * Supports both 'upload' (audio file) and 'youtube' source types.
 * @param {Object} data
 */
async function shareToLibrary(data) {
  const isYouTube = data.sourceType === 'youtube';
  const file = store.get('uploadedFile');

  // Only require file for upload source type
  if (!isYouTube && !file) {
    showToast('File audio không còn. Vui lòng upload lại.', 'error');
    return;
  }

  const btn = document.getElementById('share-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Đang chia sẻ...';
  }

  try {
    // Get audio duration
    let duration = 0;
    if (data.sentences.length > 0) {
      const lastSentence = data.sentences[data.sentences.length - 1];
      duration = lastSentence.endTime || 0;
    }

    const lesson = await createLesson(
      {
        title: data.title,
        language: data.language,
        level: data.level,
        description: data.description,
        tags: data.tags,
        duration,
        sourceType: isYouTube ? 'youtube' : 'upload',
        youtubeUrl: data.youtubeUrl || null,
      },
      data.sentences,
      isYouTube ? null : file,
    );

    showToast('🎉 Bài luyện đã được chia sẻ cho cộng đồng!', 'success');
    store.resetUpload();
    store.set('route', ROUTES.LIBRARY);
  } catch (err) {
    console.error('[Share] Error:', err);
    showToast(err.message || 'Không thể chia sẻ bài. Vui lòng thử lại.', 'error');
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🌍 Chia sẻ cho cộng đồng';
    }
  }
}
