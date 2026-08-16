/**
 * DictaFlow — YouTube Helper (AI-Powered Transcription)
 *
 * Luồng xử lý:
 * 1. Lấy metadata video (title, thumbnail, duration) bằng youtube-dl-exec.
 * 2. Tải audio .wav từ YouTube.
 * 3. Gửi file .wav tới AI Server (Parakeet-TDT) để phiên âm.
 * 4. Nếu AI Server không khả dụng → fallback về phụ đề YouTube (VTT).
 * 5. Trả về transcript chuẩn format DictaFlow.
 */

const youtubedl = require('youtube-dl-exec');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ──────────────────────────────────────────────
// Cấu hình
// ──────────────────────────────────────────────
const TEMP_DIR = path.join(__dirname, '..', 'temp');
const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:8000';
const AI_TIMEOUT_MS = 10 * 60 * 1000; // 10 phút timeout cho AI Server

// Đảm bảo thư mục temp tồn tại
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}


// ──────────────────────────────────────────────
// Hàm chính: Lấy metadata + transcript từ YouTube
// ──────────────────────────────────────────────

/**
 * Lấy metadata và transcript (phiên âm AI hoặc phụ đề YouTube) từ video.
 * @param {string} url - Link YouTube
 * @returns {Object} { title, youtube_id, thumbnail, duration, language, transcript }
 */
exports.fetchYoutubeMetadataAndTranscript = async (url) => {
  // Bước 1: Lấy metadata (title, thumbnail, duration, youtube_id)
  console.log('📡 Đang lấy metadata từ YouTube...');
  const metadata = await youtubedl(url, {
    dumpSingleJson: true,
    noWarnings: true,
  });

  // Bước 2: Thử phiên âm bằng AI Server
  let transcript = [];
  let usedAI = false;

  try {
    // Kiểm tra AI Server có đang chạy không
    await axios.get(`${AI_SERVER_URL}/health`, { timeout: 5000 });

    console.log('🤖 AI Server đang hoạt động → Tải audio và phiên âm bằng AI...');

    // Tải audio từ YouTube
    const wavPath = await downloadAudioFromYouTube(url);

    try {
      // Gửi audio tới AI Server
      transcript = await transcribeWithAI(wavPath);
      usedAI = true;
      console.log(`✅ AI phiên âm thành công: ${transcript.length} câu`);
    } finally {
      // Luôn xóa file audio tạm
      safeDeleteFile(wavPath);
    }
  } catch (err) {
    // AI Server không khả dụng hoặc lỗi → fallback về phụ đề YouTube
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNABORTED') {
      console.log('⚠️ AI Server không chạy → Chuyển sang dùng phụ đề YouTube...');
    } else {
      console.error('⚠️ Lỗi AI transcription, fallback về phụ đề YouTube:', err.message);
    }

    transcript = await fetchYoutubeSubtitlesFallback(metadata);
  }

  // Phát hiện ngôn ngữ
  let detectedLang = usedAI ? 'en' : detectLanguage(metadata);

  return {
    title: metadata.title,
    youtube_id: metadata.id,
    thumbnail: metadata.thumbnail,
    duration: metadata.duration || 0,
    language: detectedLang,
    transcript,
  };
};


// ──────────────────────────────────────────────
// Tải audio từ YouTube
// ──────────────────────────────────────────────

/**
 * Tải file audio .wav từ video YouTube bằng youtube-dl-exec.
 * @param {string} url - Link YouTube
 * @returns {string} Đường dẫn tuyệt đối tới file .wav đã tải
 */
async function downloadAudioFromYouTube(url) {
  const fileId = uuidv4().substring(0, 8);
  const outputTemplate = path.join(TEMP_DIR, `audio_${fileId}.%(ext)s`);

  console.log('⬇️ Đang tải audio từ YouTube...');

  await youtubedl(url, {
    extractAudio: true,
    audioFormat: 'wav',
    output: outputTemplate,
    noWarnings: true,
    preferFreeFormats: true,
  });

  // yt-dlp thay %(ext)s thành extension thực tế
  const wavPath = path.join(TEMP_DIR, `audio_${fileId}.wav`);

  if (!fs.existsSync(wavPath)) {
    // Thử tìm file với extension khác (yt-dlp đôi khi dùng .opus, .webm rồi convert)
    const files = fs.readdirSync(TEMP_DIR).filter(f => f.startsWith(`audio_${fileId}`));
    if (files.length > 0) {
      return path.join(TEMP_DIR, files[0]);
    }
    throw new Error('Không thể tải audio từ YouTube. Kiểm tra ffmpeg đã được cài đặt chưa.');
  }

  console.log(`✅ Audio đã tải: ${wavPath}`);
  return wavPath;
}


// ──────────────────────────────────────────────
// Gửi audio tới AI Server
// ──────────────────────────────────────────────

/**
 * Gửi file audio tới AI Server để phiên âm thành text.
 * @param {string} wavPath - Đường dẫn file audio
 * @returns {Array} Mảng transcript format DictaFlow [{ id, start, end, en, vi }]
 */
async function transcribeWithAI(wavPath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(wavPath), {
    filename: path.basename(wavPath),
    contentType: 'audio/wav',
  });

  const response = await axios.post(`${AI_SERVER_URL}/transcribe`, form, {
    headers: form.getHeaders(),
    timeout: AI_TIMEOUT_MS,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const aiResult = response.data;

  // Chuyển đổi format AI → format DictaFlow
  if (aiResult.segments && aiResult.segments.length > 0) {
    return aiResult.segments.map((seg) => ({
      id: 's_' + uuidv4().substring(0, 8),
      start: seg.start,
      end: seg.end,
      en: seg.text,
      vi: '',
    }));
  }

  return [];
}


// ──────────────────────────────────────────────
// Fallback: Phụ đề YouTube (logic cũ, giữ làm dự phòng)
// ──────────────────────────────────────────────

/**
 * Lấy phụ đề .vtt từ YouTube khi AI Server không khả dụng.
 * Đây là phương pháp cũ, giữ lại làm phương án dự phòng.
 */
async function fetchYoutubeSubtitlesFallback(metadata) {
  let targetSubs = null;

  // Ưu tiên phụ đề do người viết
  if (metadata.subtitles) {
    const keys = Object.keys(metadata.subtitles);
    const validKey = keys.find((k) => k.startsWith('ja') || k.startsWith('en'));
    if (validKey) targetSubs = metadata.subtitles[validKey];
  }

  // Fallback: Phụ đề tự động của YouTube
  if (!targetSubs && metadata.automatic_captions) {
    const keys = Object.keys(metadata.automatic_captions);
    const validKey = keys.find((k) => k.startsWith('ja') || k.startsWith('en'));
    if (validKey) targetSubs = metadata.automatic_captions[validKey];
  }

  if (!targetSubs) {
    console.log('⚠️ Không tìm thấy phụ đề nào trên YouTube.');
    return [];
  }

  // Tìm file VTT
  const vttSub = targetSubs.find((sub) => sub.ext === 'vtt');
  if (!vttSub) return [];

  try {
    const response = await axios.get(vttSub.url);
    return parseVttToTranscript(response.data);
  } catch (err) {
    console.error('Lỗi khi tải VTT:', err.message);
    return [];
  }
}


/**
 * Parse file VTT thành mảng transcript.
 * (Giữ nguyên logic gốc của dự án)
 */
function parseVttToTranscript(vttData) {
  const lines = vttData.split('\n');
  const transcript = [];
  let currentSentence = null;

  const timeRegex =
    /(?:(\d{2}):)?(\d{2}):(\d{2})\.(\d{3})\s+-->\s+(?:(\d{2}):)?(\d{2}):(\d{2})\.(\d{3})/;

  const timeToSeconds = (h, m, s, ms) => {
    return parseInt(h || 0) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('-->')) {
      const match = line.match(timeRegex);
      if (match) {
        currentSentence = {
          id: 's_' + uuidv4().substring(0, 8),
          start: timeToSeconds(match[1], match[2], match[3], match[4]),
          end: timeToSeconds(match[5], match[6], match[7], match[8]),
          en: '',
          vi: '',
        };
      }
    } else if (
      line !== '' &&
      !line.startsWith('WEBVTT') &&
      !line.startsWith('Kind:') &&
      !line.startsWith('Language:')
    ) {
      if (currentSentence) {
        const cleanText = line.replace(/<\/?[^>]+(>|$)/g, '');
        if (cleanText && !cleanText.match(/^\d+$/)) {
          currentSentence.en += (currentSentence.en ? ' ' : '') + cleanText;
        }

        if (i === lines.length - 1 || lines[i + 1].trim() === '') {
          if (currentSentence.en !== '') {
            transcript.push(currentSentence);
          }
          currentSentence = null;
        }
      }
    }
  }
  return transcript;
}


// ──────────────────────────────────────────────
// Tiện ích
// ──────────────────────────────────────────────

/**
 * Phát hiện ngôn ngữ dựa trên metadata YouTube.
 */
function detectLanguage(metadata) {
  if (metadata.subtitles) {
    const keys = Object.keys(metadata.subtitles);
    if (keys.some((k) => k.startsWith('en'))) return 'en';
  }
  if (metadata.automatic_captions) {
    const keys = Object.keys(metadata.automatic_captions);
    if (keys.some((k) => k.startsWith('en'))) return 'en';
  }
  return 'jp'; // Mặc định tiếng Nhật
}

/**
 * Xóa file an toàn, bỏ qua lỗi.
 */
function safeDeleteFile(filepath) {
  try {
    if (filepath && fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`🗑️ Đã xóa file tạm: ${path.basename(filepath)}`);
    }
  } catch (e) {
    // Bỏ qua lỗi xóa file
  }
}
