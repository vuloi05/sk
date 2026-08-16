/**
 * DictaFlow — Constants & Configuration
 */

/** App routes */
export const ROUTES = {
  HOME: 'home',
  LIBRARY: 'library',
  UPLOAD: 'upload', // Now admin only
  TRANSCRIPT: 'transcript', // Now admin only
  MODE_SELECT: 'mode-select',
  PRACTICE: 'practice',
  SCORE: 'score',
  SETTINGS: 'settings',
  PROFILE: 'profile',
  VOCABULARY: 'vocabulary',
  VOCAB_EN: 'vocab-en',
  ADMIN_PANEL: 'admin_panel' // New admin route
};

/** Supported languages */
export const LANGUAGES = {
  ja: { code: 'ja', label: '日本語', flag: '🇯🇵', name: 'Japanese' },
  en: { code: 'en', label: 'English', flag: '🇬🇧', name: 'English' },
};

export const LEVELS = {
  A1: { code: 'A1', label: 'A1', color: 'green' },
  A2: { code: 'A2', label: 'A2', color: 'blue' },
  B1: { code: 'B1', label: 'B1', color: 'cyan' },
  B2: { code: 'B2', label: 'B2', color: 'orange' },
  C1: { code: 'C1', label: 'C1', color: 'purple' },
  C2: { code: 'C2', label: 'C2', color: 'red' },
  N5: { code: 'N5', label: 'N5', color: 'green' },
  N4: { code: 'N4', label: 'N4', color: 'blue' },
  N3: { code: 'N3', label: 'N3', color: 'cyan' },
  N2: { code: 'N2', label: 'N2', color: 'orange' },
  N1: { code: 'N1', label: 'N1', color: 'red' },
  Unknown: { code: 'Unknown', label: 'Khác', color: 'gray' },
};

/** Practice modes */
export const MODES = {
  dictation: {
    id: 'dictation',
    title: 'Dictation',
    titleVi: 'Chép chính tả',
    icon: '✍️',
    desc: 'Nghe và chép lại toàn bộ câu',
  },
  gapfill: {
    id: 'gapfill',
    title: 'Gap-fill',
    titleVi: 'Điền từ',
    icon: '📝',
    desc: 'Nghe và điền từ còn thiếu',
  },
};

/** Audio playback speeds */
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

/** Default settings */
export const DEFAULTS = {
  playbackSpeed: 1,
  repeatCount: 1,
  language: 'ja',
};

/** Local storage keys */
export const STORAGE_KEYS = {
  API_KEY: 'dictaflow_gemini_api_key',
  SETTINGS: 'dictaflow_settings',
  RECENT_LESSONS: 'dictaflow_recent_lessons',
};

/** Maximum file size for upload (50 MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Supported audio MIME types */
export const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/ogg',
  'audio/webm',
];
