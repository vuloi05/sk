/**
 * DictaFlow — Audio Uploader Component
 */

import { h, formatFileSize } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { initGemini, isGeminiReady, transcribeAudio, enrichSentences } from '../core/gemini.js';
import { showToast } from './Toast.js';
import { ROUTES, LANGUAGES, LEVELS, MAX_FILE_SIZE, SUPPORTED_AUDIO_TYPES } from '../utils/constants.js';

/**
 * Render the audio upload page.
 * @returns {HTMLElement}
 */
export function renderUploader() {
  const hasKey = !!store.get('apiKey');

  const page = h('div', { className: 'page' },
    h('div', { className: 'container', style: { maxWidth: '700px' } },
      h('h1', { style: { marginBottom: '8px' } }, '➕ Tạo bài luyện mới'),
      h('p', { className: 'text-secondary mb-lg' }, 'Upload file audio → AI tạo transcript → Chia sẻ cho cộng đồng'),

      // API Key warning
      !hasKey
        ? h('div', {
            className: 'card',
            style: {
              borderColor: 'var(--color-accent-orange)',
              backgroundColor: 'var(--color-missing-bg)',
              marginBottom: 'var(--space-lg)',
            },
          },
            h('p', { style: { fontWeight: '600' } }, '🔑 Cần Gemini API Key để tạo bài mới'),
            h('p', {
              className: 'text-sm mt-sm',
              innerHTML: 'Vào <strong>Cài đặt</strong> để nhập API key miễn phí từ <a href="https://aistudio.google.com/apikey" target="_blank">Google AI Studio</a>.',
            }),
            h('button', {
              className: 'btn btn-orange btn-sm mt-md',
              onClick: () => store.set('route', ROUTES.SETTINGS),
            }, '⚙️ Đi đến Cài đặt'),
          )
        : null,

      // Upload zone
      h('div', {
        className: 'upload-zone',
        id: 'upload-zone',
        onClick: () => document.getElementById('file-input')?.click(),
        onDragover: (e) => {
          e.preventDefault();
          e.currentTarget.classList.add('dragover');
        },
        onDragleave: (e) => {
          e.currentTarget.classList.remove('dragover');
        },
        onDrop: (e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('dragover');
          const file = e.dataTransfer?.files?.[0];
          if (file) handleFileSelect(file);
        },
      },
        h('div', { className: 'upload-zone-icon' }, '🎵'),
        h('div', { className: 'upload-zone-title' }, 'Kéo thả file audio vào đây'),
        h('div', { className: 'upload-zone-subtitle' }, `Hoặc click để chọn file • MP3, WAV, M4A • Tối đa ${formatFileSize(MAX_FILE_SIZE)}`),
        h('input', {
          type: 'file',
          id: 'file-input',
          accept: 'audio/*',
          style: { display: 'none' },
          onChange: (e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          },
        }),
        // Preview (hidden by default)
        h('div', { id: 'upload-preview', style: { display: 'none' } }),
      ),

      // Upload form (hidden by default)
      h('div', {
        className: 'upload-form',
        id: 'upload-form',
        style: { display: 'none' },
      },
        // Title
        h('div', {},
          h('label', { className: 'form-label' }, 'Tiêu đề bài luyện *'),
          h('input', {
            className: 'input',
            id: 'lesson-title',
            type: 'text',
            placeholder: 'Ví dụ: みんなの日本語 第5課',
          }),
        ),

        // Language + Level
        h('div', { className: 'upload-form-row' },
          h('div', {},
            h('label', { className: 'form-label' }, 'Ngôn ngữ *'),
            h('select', {
              className: 'input select',
              id: 'lesson-language',
              innerHTML: Object.values(LANGUAGES)
                .map(l => `<option value="${l.code}">${l.flag} ${l.label}</option>`)
                .join(''),
            }),
          ),
          h('div', {},
            h('label', { className: 'form-label' }, 'Trình độ *'),
            h('select', {
              className: 'input select',
              id: 'lesson-level',
              innerHTML: Object.values(LEVELS)
                .map(l => `<option value="${l.code}">${l.label}</option>`)
                .join(''),
            }),
          ),
        ),

        // Description
        h('div', {},
          h('label', { className: 'form-label' }, 'Mô tả (không bắt buộc)'),
          h('input', {
            className: 'input',
            id: 'lesson-description',
            type: 'text',
            placeholder: 'Mô tả ngắn về nội dung bài...',
          }),
        ),

        // Tags
        h('div', {},
          h('label', { className: 'form-label' }, 'Tags (phân cách bằng dấu phẩy)'),
          h('input', {
            className: 'input',
            id: 'lesson-tags',
            type: 'text',
            placeholder: 'minna, lesson5, beginner',
          }),
        ),

        // Submit button
        h('button', {
          className: 'btn btn-primary btn-lg',
          id: 'start-transcribe',
          onClick: handleTranscribe,
          disabled: !hasKey,
        }, '🚀 Bắt đầu tạo bài'),
      ),
    ),
  );

  return page;
}

/**
 * Handle file selection.
 * @param {File} file
 */
function handleFileSelect(file) {
  // Validate type
  if (!SUPPORTED_AUDIO_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg|webm)$/i)) {
    showToast('Định dạng file không hỗ trợ. Vui lòng dùng MP3, WAV, M4A.', 'error');
    return;
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    showToast(`File quá lớn. Giới hạn ${formatFileSize(MAX_FILE_SIZE)}.`, 'error');
    return;
  }

  store.set('uploadedFile', file);

  // Show preview
  const preview = document.getElementById('upload-preview');
  if (preview) {
    preview.style.display = 'flex';
    preview.innerHTML = '';
    preview.className = 'upload-preview animate-fade-in';
    preview.appendChild(h('div', { className: 'upload-preview-icon' }, '🎵'));
    preview.appendChild(
      h('div', { className: 'upload-preview-info' },
        h('div', { className: 'upload-preview-name' }, file.name),
        h('div', { className: 'upload-preview-size' }, formatFileSize(file.size)),
      ),
    );
    preview.appendChild(
      h('button', {
        className: 'btn btn-ghost btn-sm',
        onClick: (e) => {
          e.stopPropagation();
          store.set('uploadedFile', null);
          preview.style.display = 'none';
          document.getElementById('upload-form').style.display = 'none';
          document.getElementById('file-input').value = '';
        },
      }, '✕'),
    );
  }

  // Show form
  const form = document.getElementById('upload-form');
  if (form) {
    form.style.display = 'flex';
    form.classList.add('animate-slide-up');
  }
}

/**
 * Handle transcription process.
 */
async function handleTranscribe() {
  const file = store.get('uploadedFile');
  if (!file) {
    showToast('Vui lòng chọn file audio trước.', 'error');
    return;
  }

  const title = document.getElementById('lesson-title')?.value?.trim();
  if (!title) {
    showToast('Vui lòng nhập tiêu đề bài luyện.', 'error');
    document.getElementById('lesson-title')?.focus();
    return;
  }

  const apiKey = store.get('apiKey');
  if (!apiKey) {
    showToast('Vui lòng nhập Gemini API key trong Cài đặt.', 'error');
    return;
  }

  // Initialize Gemini
  if (!isGeminiReady()) {
    initGemini(apiKey);
  }

  const language = document.getElementById('lesson-language')?.value || 'ja';
  const level = document.getElementById('lesson-level')?.value || 'beginner';
  const description = document.getElementById('lesson-description')?.value?.trim() || '';
  const tags = document.getElementById('lesson-tags')?.value?.trim() || '';

  store.showLoading('🤖 AI đang phân tích audio...\nQuá trình này có thể mất 30-60 giây.');

  try {
    // Step 1: Transcribe
    const sentences = await transcribeAudio(file, language);

    // Step 2: Enrich with gap-fill & MCQ data
    store.set('loadingMessage', '🧠 Đang tạo bài tập gap-fill & trắc nghiệm...');
    const enrichedSentences = await enrichSentences(sentences, language, level);

    // Step 3: Store data for TranscriptEditor
    store.update({
      transcriptData: {
        title,
        language,
        level,
        description,
        tags,
        sentences: enrichedSentences,
      },
    });

    store.hideLoading();
    store.set('route', ROUTES.TRANSCRIPT);
    showToast(`Đã tạo transcript với ${enrichedSentences.length} câu!`, 'success');
  } catch (err) {
    store.hideLoading();
    console.error('[Upload] Transcribe error:', err);
    showToast(err.message || 'Không thể tạo transcript. Vui lòng thử lại.', 'error');
  }
}
