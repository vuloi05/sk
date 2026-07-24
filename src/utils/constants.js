/**
 * DictaFlow — Constants & Configuration
 */

/** Supabase project credentials (public — safe to expose) */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

/** App routes */
export const ROUTES = {
  HOME: 'home',
  LIBRARY: 'library',
  UPLOAD: 'upload',
  TRANSCRIPT: 'transcript',
  MODE_SELECT: 'mode-select',
  PRACTICE: 'practice',
  SCORE: 'score',
  SETTINGS: 'settings',
  VOCABULARY: 'vocabulary',
};

/** Supported languages */
export const LANGUAGES = {
  ja: { code: 'ja', label: '日本語', flag: '🇯🇵', name: 'Japanese' },
  en: { code: 'en', label: 'English', flag: '🇬🇧', name: 'English' },
};

/** Difficulty levels */
export const LEVELS = {
  beginner: { code: 'beginner', label: 'Cơ bản', color: 'green' },
  intermediate: { code: 'intermediate', label: 'Trung cấp', color: 'blue' },
  advanced: { code: 'advanced', label: 'Nâng cao', color: 'purple' },
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
  mcq: {
    id: 'mcq',
    title: 'Multiple Choice',
    titleVi: 'Trắc nghiệm',
    icon: '🔤',
    desc: 'Nghe và chọn đáp án đúng',
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

/** Maximum file size for upload (50 MB — Supabase free tier limit) */
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
