/**
 * DictaFlow — Audio Uploader Component
 */

import { h, formatFileSize } from '../utils/helpers.js';
import { store } from '../core/store.js';
import { initGemini, isGeminiReady, transcribeAudio, transcribeYouTube, enrichSentences } from '../core/gemini.js';
import { showToast } from './Toast.js';
import { ROUTES, LANGUAGES, LEVELS, MAX_FILE_SIZE, SUPPORTED_AUDIO_TYPES } from '../utils/constants.js';
import { validateYouTubeUrl, fetchVideoInfo, buildYouTubeUrl, YOUTUBE_MAX_DURATION } from '../utils/youtubeUtils.js';
import { getJlptLevel } from '../core/kanjiService.js';

/** @type {'upload' | 'youtube'} Current active tab */
let activeTab = 'upload';

/** @type {{ videoId: string, title: string, thumbnailUrl: string, authorName: string } | null} */
let ytPreview = null;

/**
 * Render the audio upload page.
 * @returns {HTMLElement}
 */
export function renderUploader() {
  const hasKey = !!store.get('apiKey');

  const page = h('div', { className: 'page' },
    h('div', { className: 'container', style: { maxWidth: '700px' } },
      h('h1', { style: { marginBottom: '8px' } }, '➕ Tạo bài luyện mới'),
      h('p', { className: 'text-secondary mb-lg' }, 'Upload file audio hoặc dán link YouTube → AI tạo transcript → Chia sẻ cho cộng đồng'),

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

      // Auth warning
      !store.get('currentUser')
        ? h('div', {
            className: 'card',
            style: {
              borderColor: 'var(--color-accent-orange)',
              backgroundColor: 'var(--color-missing-bg)',
              marginBottom: 'var(--space-lg)',
            },
          },
            h('p', { style: { fontWeight: '600' } }, '👤 Bạn cần đăng nhập để tạo bài mới'),
            h('p', { className: 'text-sm mt-sm' }, 'Theo tiêu chuẩn Phase 2, để tránh spam rác trên hệ thống, chỉ những thành viên đã có tài khoản mới được chia sẻ bài luyện lên thư viện cộng đồng.'),
            h('button', {
              className: 'btn btn-primary btn-sm mt-md',
              onClick: async () => {
                const { renderAuthModal } = await import('./AuthModal.js');
                const modal = renderAuthModal(() => {
                  modal.remove();
                });
                document.body.appendChild(modal);
              },
            }, 'Đăng nhập ngay'),
          )
        : null,

      // ===== Tab Switcher =====
      h('div', {
        className: 'tab-switcher',
        id: 'source-tabs',
        style: (!hasKey || !store.get('currentUser')) ? { opacity: '0.5', pointerEvents: 'none' } : {},
      },
        h('button', {
          className: `tab-btn ${activeTab === 'upload' ? 'active' : ''}`,
          id: 'tab-upload',
          onClick: () => {
            activeTab = 'upload';
            updateTabUI();
          },
        }, '📁 Upload Audio'),
        h('button', {
          className: `tab-btn ${activeTab === 'youtube' ? 'active' : ''}`,
          id: 'tab-youtube',
          onClick: () => {
            activeTab = 'youtube';
            updateTabUI();
          },
        }, '🔗 YouTube'),
      ),

      // ===== Tab Content: Upload Audio =====
      h('div', {
        id: 'tab-content-upload',
        style: { display: activeTab === 'upload' ? 'block' : 'none' },
      },
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
      ),

      // ===== Tab Content: YouTube =====
      h('div', {
        id: 'tab-content-youtube',
        style: { display: activeTab === 'youtube' ? 'block' : 'none' },
      },
        h('div', { className: 'youtube-input-section' },
          h('div', { className: 'flex gap-sm', style: { alignItems: 'flex-start' } },
            h('input', {
              className: 'input',
              id: 'youtube-url-input',
              type: 'url',
              placeholder: 'https://www.youtube.com/watch?v=...',
              style: { flex: 1 },
              onKeydown: (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleYouTubePreview();
                }
              },
            }),
            h('button', {
              className: 'btn btn-primary',
              id: 'yt-preview-btn',
              onClick: handleYouTubePreview,
            }, '🔍 Xem trước'),
          ),
          h('p', { className: 'text-sm text-secondary mt-xs' }, `Video tối đa ${YOUTUBE_MAX_DURATION / 60} phút • Hỗ trợ youtube.com, youtu.be`),
        ),

        // YouTube preview area
        h('div', { id: 'youtube-preview', className: 'youtube-preview-area' }),
      ),

      // ===== Shared Upload Form (metadata) =====
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

        // Language
        h('div', { className: 'upload-form-row' },
          h('div', { style: { flex: 1 } },
            h('label', { className: 'form-label' }, 'Ngôn ngữ *'),
            h('select', {
              className: 'input select',
              id: 'lesson-language',
              innerHTML: Object.values(LANGUAGES)
                .map(l => `<option value="${l.code}">${l.flag} ${l.label}</option>`)
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
 * Update tab visibility when switching tabs.
 */
function updateTabUI() {
  const uploadTab = document.getElementById('tab-upload');
  const youtubeTab = document.getElementById('tab-youtube');
  const uploadContent = document.getElementById('tab-content-upload');
  const youtubeContent = document.getElementById('tab-content-youtube');

  if (uploadTab) uploadTab.className = `tab-btn ${activeTab === 'upload' ? 'active' : ''}`;
  if (youtubeTab) youtubeTab.className = `tab-btn ${activeTab === 'youtube' ? 'active' : ''}`;
  if (uploadContent) uploadContent.style.display = activeTab === 'upload' ? 'block' : 'none';
  if (youtubeContent) youtubeContent.style.display = activeTab === 'youtube' ? 'block' : 'none';

  // Hide shared form when switching tabs (reset state)
  const form = document.getElementById('upload-form');
  if (form) form.style.display = 'none';
}

/**
 * Handle YouTube URL preview.
 */
async function handleYouTubePreview() {
  const input = document.getElementById('youtube-url-input');
  const previewArea = document.getElementById('youtube-preview');
  if (!input || !previewArea) return;

  const url = input.value.trim();
  const { valid, videoId, error } = validateYouTubeUrl(url);

  if (!valid) {
    showToast(error, 'error');
    return;
  }

  previewArea.innerHTML = '';
  previewArea.appendChild(
    h('div', { className: 'flex items-center justify-center', style: { padding: 'var(--space-lg)' } },
      h('div', { className: 'loading-spinner' }),
      h('span', { className: 'ml-sm text-secondary' }, 'Đang tải thông tin video...'),
    )
  );

  try {
    const info = await fetchVideoInfo(videoId);
    ytPreview = { videoId, ...info };

    previewArea.innerHTML = '';
    previewArea.appendChild(
      h('div', { className: 'youtube-preview-card card animate-slide-up' },
        h('div', { className: 'youtube-preview-thumb-wrap' },
          h('img', {
            src: info.thumbnailUrl,
            alt: info.title,
            className: 'youtube-preview-thumb',
          }),
          h('div', { className: 'youtube-preview-play' }, '▶'),
        ),
        h('div', { className: 'youtube-preview-info' },
          h('h3', { className: 'youtube-preview-title' }, info.title),
          h('p', { className: 'text-sm text-secondary' }, `📺 ${info.authorName}`),
        ),
        h('button', {
          className: 'btn btn-ghost btn-sm',
          style: { position: 'absolute', top: '8px', right: '8px' },
          onClick: () => {
            ytPreview = null;
            previewArea.innerHTML = '';
            const form = document.getElementById('upload-form');
            if (form) form.style.display = 'none';
          },
        }, '✕'),
      )
    );

    // Auto-fill title from YouTube video title
    const titleInput = document.getElementById('lesson-title');
    if (titleInput && !titleInput.value) {
      titleInput.value = info.title;
    }

    // Show shared form
    const form = document.getElementById('upload-form');
    if (form) {
      form.style.display = 'flex';
      form.classList.add('animate-slide-up');
    }
  } catch (err) {
    previewArea.innerHTML = '';
    showToast(err.message, 'error');
    ytPreview = null;
  }
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
 * Handle transcription process (for both upload and YouTube).
 */
async function handleTranscribe() {
  const isYouTube = activeTab === 'youtube';
  const file = store.get('uploadedFile');

  // Validate source
  if (isYouTube) {
    if (!ytPreview || !ytPreview.videoId) {
      showToast('Vui lòng dán link YouTube và bấm "Xem trước" trước.', 'error');
      return;
    }
  } else {
    if (!file) {
      showToast('Vui lòng chọn file audio trước.', 'error');
      return;
    }
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
  const description = document.getElementById('lesson-description')?.value?.trim() || '';
  const tags = document.getElementById('lesson-tags')?.value?.trim() || '';

  store.showLoading(
    isYouTube
      ? '🤖 AI đang xem video YouTube và tạo transcript...\nQuá trình này có thể mất 30-60 giây.'
      : '🤖 AI đang phân tích audio...\nQuá trình này có thể mất 30-60 giây.'
  );

  try {
    let sentences;
    let duration = 0;

    if (isYouTube) {
      // YouTube path: transcribe directly from URL
      const youtubeUrl = buildYouTubeUrl(ytPreview.videoId);
      sentences = await transcribeYouTube(youtubeUrl, language);

      // Estimate duration from last sentence endTime
      if (sentences.length > 0) {
        duration = sentences[sentences.length - 1].endTime || 0;
      }
    } else {
      // Audio file path: check duration + transcribe from file
      duration = await new Promise((resolve) => {
        const audio = new Audio(URL.createObjectURL(file));
        audio.onloadedmetadata = () => resolve(audio.duration);
        audio.onerror = () => resolve(0);
      });

      if (duration > 125) {
        store.hideLoading();
        showToast('⚠️ Vui lòng chọn audio ngắn dưới 2 phút. Các file quá dài sẽ làm AI nhận diện thời gian bị sai lệch (ảo giác).', 'error');
        return;
      }

      sentences = await transcribeAudio(file, language);
    }

    // Step 2: Auto-detect Level and Enrich with gap-fill & MCQ data
    store.set('loadingMessage', '🧠 Đang phân tích độ khó & tạo bài tập...');
    let level = 'beginner';
    if (language === 'ja' && sentences.length > 0) {
      const allText = sentences.map(s => s.text || '').join('');
      const analysis = await getJlptLevel(allText);
      level = analysis.suggested.toLowerCase();
    } else if (language === 'en') {
       // Optional: For English, default to intermediate or use another heuristic later
       level = 'intermediate';
    }

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
        // YouTube-specific metadata
        sourceType: isYouTube ? 'youtube' : 'upload',
        youtubeVideoId: isYouTube ? ytPreview.videoId : null,
        youtubeUrl: isYouTube ? buildYouTubeUrl(ytPreview.videoId) : null,
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
