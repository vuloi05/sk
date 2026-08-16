/**
 * DictaFlow — YouTube Utility Functions
 *
 * Handles YouTube URL parsing, validation, and metadata fetching.
 * Uses oEmbed API (free, no API key required).
 */

/** Maximum video duration in seconds (2 minutes) */
export const YOUTUBE_MAX_DURATION = 120;

/**
 * Regular expressions to match various YouTube URL formats.
 * Supports: youtube.com/watch, youtu.be, youtube.com/embed, youtube.com/shorts
 */
const YT_PATTERNS = [
  /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
];

/**
 * Extract YouTube video ID from a URL string.
 * @param {string} url - YouTube URL in any common format
 * @returns {string|null} 11-character video ID or null if invalid
 */
export function extractVideoId(url) {
  if (!url || typeof url !== 'string') return null;

  for (const pattern of YT_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

/**
 * Validate a YouTube URL and return the video ID.
 * @param {string} url
 * @returns {{ valid: boolean, videoId: string|null, error: string|null }}
 */
export function validateYouTubeUrl(url) {
  if (!url || !url.trim()) {
    return { valid: false, videoId: null, error: 'Vui lòng dán link YouTube.' };
  }

  const videoId = extractVideoId(url.trim());
  if (!videoId) {
    return {
      valid: false,
      videoId: null,
      error: 'Link YouTube không hợp lệ. Ví dụ: https://www.youtube.com/watch?v=...',
    };
  }

  return { valid: true, videoId, error: null };
}

/**
 * Fetch video metadata via YouTube oEmbed API (free, no key required).
 * Returns title and thumbnail URL.
 * @param {string} videoId - 11-character YouTube video ID
 * @returns {Promise<{ title: string, thumbnailUrl: string, authorName: string }>}
 */
export async function fetchVideoInfo(videoId) {
  const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

  const response = await fetch(oEmbedUrl);
  if (!response.ok) {
    throw new Error('Không thể lấy thông tin video. Video có thể không tồn tại hoặc ở chế độ riêng tư.');
  }

  const data = await response.json();
  return {
    title: data.title || 'Video YouTube',
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    authorName: data.author_name || '',
  };
}

/**
 * Build the canonical YouTube watch URL from a video ID.
 * @param {string} videoId
 * @returns {string}
 */
export function buildYouTubeUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
